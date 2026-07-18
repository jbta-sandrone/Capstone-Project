import { randomUUID } from "node:crypto";

import { firebaseDatabase } from "../config/firebaseAdmin.js";

export const DAILY_AI_SEARCH_LIMIT = 3;
const DEFAULT_RESERVATION_TTL_MS = 5 * 60 * 1000;
const DEFAULT_DATABASE_TIMEOUT_MS = 10_000;

function getPositiveDuration(value, fallback) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? duration : fallback;
}

function withTimeout(operation, timeoutMs, operationName) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId));
}

function debugReservationOperation(operation, details) {
  if (process.env.AI_USAGE_DEBUG !== "true") return;
  console.log(`[AI_USAGE_DEBUG] ${operation}`, details);
}

export function getTodayDateKey(now = new Date()) {
  const timeZone = process.env.AI_USAGE_TIME_ZONE || "Asia/Manila";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

function normalizeReservations(value, nowMs) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, expiresAt]) => {
      const expiration = Number(expiresAt);
      return Number.isFinite(expiration) && expiration > nowMs;
    })
  );
}

function normalizeUsageRecord(record, date, nowMs) {
  if (!record || record.date !== date) {
    return { date, count: 0, reservations: {} };
  }

  return {
    date,
    count: normalizeCount(record.count),
    reservations: normalizeReservations(record._reservations, nowMs),
  };
}

function toDatabaseRecord(usage) {
  const record = {
    date: usage.date,
    count: normalizeCount(usage.count),
  };

  if (Object.keys(usage.reservations).length > 0) {
    record._reservations = usage.reservations;
  }

  return record;
}

function formatUsage(record) {
  const count = normalizeCount(record?.count);

  return {
    date: record?.date,
    count,
    limit: DAILY_AI_SEARCH_LIMIT,
    remaining: Math.max(DAILY_AI_SEARCH_LIMIT - count, 0),
  };
}

export function createAiUsageService({
  database,
  dateProvider = getTodayDateKey,
  nowProvider = Date.now,
  reservationIdProvider = randomUUID,
  reservationTtlMs = getPositiveDuration(
    process.env.AI_SEARCH_RESERVATION_TTL_MS,
    DEFAULT_RESERVATION_TTL_MS
  ),
  databaseTimeoutMs = getPositiveDuration(
    process.env.AI_DATABASE_TIMEOUT_MS,
    DEFAULT_DATABASE_TIMEOUT_MS
  ),
}) {
  function getUsageRef(uid) {
    return database.ref(`aiUsage/${uid}`);
  }

  async function runUsageTransaction(usageRef, update, operationName) {
    try {
      return await withTimeout(
        usageRef.transaction(update, undefined, true),
        databaseTimeoutMs,
        operationName
      );
    } catch (cause) {
      const error = new Error(
        "AI usage service is temporarily unavailable. Please try again.",
        { cause }
      );
      error.statusCode = 503;
      throw error;
    }
  }

  async function getDailyAiUsage(uid) {
    const date = dateProvider();
    const nowMs = nowProvider();
    const usageRef = getUsageRef(uid);
    const result = await runUsageTransaction(
      usageRef,
      (current) => toDatabaseRecord(normalizeUsageRecord(current, date, nowMs)),
      "Read AI usage"
    );

    return formatUsage(result.snapshot.val());
  }

  async function reserveAiSearch(uid) {
    const date = dateProvider();
    const nowMs = nowProvider();
    const reservationId = reservationIdProvider();
    const expiresAt = nowMs + reservationTtlMs;
    const usageRef = getUsageRef(uid);
    const databasePath = usageRef.toString();
    let snapshotBefore = null;
    let attempt = 0;
    const result = await runUsageTransaction(
      usageRef,
      (current) => {
        attempt += 1;
        snapshotBefore = current;
        const usage = normalizeUsageRecord(current, date, nowMs);
        const reservedCount = Object.keys(usage.reservations).length;

        debugReservationOperation("reserveAiSearch transaction callback", {
          attempt,
          reservationId,
          databasePath,
          databaseAppName: database.app?.name,
          snapshotBefore: current,
          rawFirebaseValue: current,
        });

        if (usage.count + reservedCount >= DAILY_AI_SEARCH_LIMIT) {
          return undefined;
        }

        usage.reservations[reservationId] = expiresAt;
        return toDatabaseRecord(usage);
      },
      "Reserve AI usage"
    );

    debugReservationOperation("reserveAiSearch transaction result", {
      reservationId,
      databasePath,
      databaseAppName: database.app?.name,
      transactionCommitted: result.committed,
      snapshotBefore,
      snapshotAfter: result.snapshot.val(),
      rawFirebaseValue: result.snapshot.val(),
    });

    if (!result.committed) {
      return {
        reservationId: null,
        usage: formatUsage(result.snapshot.val()),
      };
    }

    return {
      reservationId,
      usage: formatUsage(result.snapshot.val()),
    };
  }

  async function recordSuccessfulAiSearch(uid, reservationId) {
    const date = dateProvider();
    const nowMs = nowProvider();
    const usageRef = getUsageRef(uid);
    const databasePath = usageRef.toString();
    let snapshotBefore = null;
    let attempt = 0;
    let finalized = false;
    const result = await runUsageTransaction(
      usageRef,
      (current) => {
        attempt += 1;
        snapshotBefore = current;
        finalized = false;
        const usage = normalizeUsageRecord(current, date, nowMs);

        debugReservationOperation("recordSuccessfulAiSearch transaction callback", {
          attempt,
          reservationId,
          databasePath,
          databaseAppName: database.app?.name,
          snapshotBefore: current,
          rawFirebaseValue: current,
        });

        if (!usage.reservations[reservationId]) {
          // Firebase may initially invoke a transaction with a null local cache.
          // Returning a value lets the server reject the stale candidate and retry
          // this callback with the actual record instead of aborting locally.
          return toDatabaseRecord(usage);
        }

        if (usage.count >= DAILY_AI_SEARCH_LIMIT) {
          return undefined;
        }

        finalized = true;
        delete usage.reservations[reservationId];
        usage.count += 1;

        return toDatabaseRecord(usage);
      },
      "Record successful AI usage"
    );

    debugReservationOperation("recordSuccessfulAiSearch transaction result", {
      reservationId,
      databasePath,
      databaseAppName: database.app?.name,
      transactionCommitted: result.committed,
      snapshotBefore,
      snapshotAfter: result.snapshot.val(),
      rawFirebaseValue: result.snapshot.val(),
      reservationFinalized: finalized,
    });

    return result.committed && finalized ? formatUsage(result.snapshot.val()) : null;
  }

  async function releaseAiSearchReservation(uid, reservationId) {
    const date = dateProvider();
    const nowMs = nowProvider();
    const usageRef = getUsageRef(uid);
    const databasePath = usageRef.toString();
    let snapshotBefore = null;
    let attempt = 0;
    let released = false;
    const result = await runUsageTransaction(
      usageRef,
      (current) => {
        attempt += 1;
        snapshotBefore = current;
        released = false;
        const usage = normalizeUsageRecord(current, date, nowMs);

        debugReservationOperation("releaseAiSearchReservation transaction callback", {
          attempt,
          reservationId,
          databasePath,
          databaseAppName: database.app?.name,
          snapshotBefore: current,
          rawFirebaseValue: current,
        });

        if (!usage.reservations[reservationId]) {
          return toDatabaseRecord(usage);
        }

        released = true;
        delete usage.reservations[reservationId];
        return toDatabaseRecord(usage);
      },
      "Release AI usage reservation"
    );

    debugReservationOperation("releaseAiSearchReservation transaction result", {
      reservationId,
      databasePath,
      databaseAppName: database.app?.name,
      transactionCommitted: result.committed,
      snapshotBefore,
      snapshotAfter: result.snapshot.val(),
      rawFirebaseValue: result.snapshot.val(),
      reservationReleased: released,
    });

    return result.committed && released;
  }

  return {
    getDailyAiUsage,
    reserveAiSearch,
    recordSuccessfulAiSearch,
    releaseAiSearchReservation,
  };
}

const aiUsageService = createAiUsageService({ database: firebaseDatabase });

export const getDailyAiUsage = aiUsageService.getDailyAiUsage;
export const reserveAiSearch = aiUsageService.reserveAiSearch;
export const recordSuccessfulAiSearch = aiUsageService.recordSuccessfulAiSearch;
export const releaseAiSearchReservation = aiUsageService.releaseAiSearchReservation;
