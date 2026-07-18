import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";

process.env.FIREBASE_PROJECT_ID ||= "test-project";
process.env.FIREBASE_CLIENT_EMAIL ||= "firebase-adminsdk@test-project.iam.gserviceaccount.com";
process.env.FIREBASE_DATABASE_URL ||= "https://test-project.firebaseio.com";

if (!process.env.FIREBASE_PRIVATE_KEY) {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.FIREBASE_PRIVATE_KEY = privateKey.export({
    type: "pkcs8",
    format: "pem",
  });
}

const {
  createAiUsageService,
  DAILY_AI_SEARCH_LIMIT,
  getTodayDateKey,
} = await import("../services/aiUsageService.js");
const { getFirebaseAdminEnvironment } = await import("../config/firebaseAdmin.js");

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createFakeDatabase(initialValue = null, { initialNullTransaction = false } = {}) {
  const state = {
    value: clone(initialValue),
    queue: Promise.resolve(),
  };

  return {
    state,
    ref() {
      return {
        transaction(update) {
          const operation = state.queue.then(() => {
            if (initialNullTransaction && state.value !== null) {
              const initialCandidate = update(null);
              if (initialCandidate === undefined) {
                return {
                  committed: false,
                  snapshot: { val: () => clone(state.value) },
                };
              }
            }

            const nextValue = update(clone(state.value));

            if (nextValue === undefined) {
              return {
                committed: false,
                snapshot: { val: () => clone(state.value) },
              };
            }

            state.value = clone(nextValue);
            return {
              committed: true,
              snapshot: { val: () => clone(state.value) },
            };
          });

          state.queue = operation.then(() => undefined, () => undefined);
          return operation;
        },
      };
    },
  };
}

function createService(database, date = "2026-07-18", nowMs = 1_752_854_400_000) {
  let nextId = 0;

  return createAiUsageService({
    database,
    dateProvider: () => date,
    nowProvider: () => nowMs,
    reservationIdProvider: () => `reservation-${++nextId}`,
    reservationTtlMs: 60_000,
  });
}

test("uses the configured Manila calendar day", () => {
  assert.equal(getTodayDateKey(new Date("2026-07-17T16:30:00.000Z")), "2026-07-18");
});

test("reports every missing Firebase Admin environment variable", () => {
  assert.throws(
    () => getFirebaseAdminEnvironment({}),
    (error) =>
      error.message.includes("FIREBASE_PROJECT_ID") &&
      error.message.includes("FIREBASE_CLIENT_EMAIL") &&
      error.message.includes("FIREBASE_PRIVATE_KEY") &&
      error.message.includes("FIREBASE_DATABASE_URL")
  );
});

test("normalizes escaped Firebase private-key newlines", () => {
  const environment = getFirebaseAdminEnvironment({
    FIREBASE_PROJECT_ID: "test-project",
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk@test-project.iam.gserviceaccount.com",
    FIREBASE_PRIVATE_KEY: "first-line\\nsecond-line",
    FIREBASE_DATABASE_URL: "https://test-project.firebaseio.com",
  });

  assert.equal(environment.privateKey, "first-line\nsecond-line");
});

test("initializes a new daily usage record with three searches remaining", async () => {
  const database = createFakeDatabase();
  const service = createService(database);

  const usage = await service.getDailyAiUsage("user-1");

  assert.deepEqual(usage, {
    date: "2026-07-18",
    count: 0,
    limit: DAILY_AI_SEARCH_LIMIT,
    remaining: 3,
  });
  assert.deepEqual(database.state.value, { date: "2026-07-18", count: 0 });
});

test("resets a previous day's count", async () => {
  const database = createFakeDatabase({ date: "2026-07-17", count: 3 });
  const service = createService(database);

  const usage = await service.getDailyAiUsage("user-1");

  assert.equal(usage.count, 0);
  assert.equal(usage.remaining, 3);
  assert.deepEqual(database.state.value, { date: "2026-07-18", count: 0 });
});

test("reserves only three concurrent Gemini calls and commits their successful counts", async () => {
  const database = createFakeDatabase({ date: "2026-07-18", count: 0 });
  const service = createService(database);

  const reservations = await Promise.all(
    Array.from({ length: 10 }, () => service.reserveAiSearch("user-1"))
  );
  const acceptedReservations = reservations
    .map((reservation) => reservation.reservationId)
    .filter(Boolean);
  const rejectedReservations = reservations.filter(
    (reservation) => reservation.reservationId === null
  );
  const results = await Promise.all(
    acceptedReservations.map((reservationId) =>
      service.recordSuccessfulAiSearch("user-1", reservationId)
    )
  );

  assert.equal(acceptedReservations.length, 3);
  assert.equal(rejectedReservations.length, 7);
  assert.ok(rejectedReservations.every((reservation) => reservation.usage.remaining === 3));
  assert.equal(results.filter(Boolean).length, 3);
  assert.deepEqual(database.state.value, { date: "2026-07-18", count: 3 });
});

test("releases a failed Gemini call without incrementing count", async () => {
  const database = createFakeDatabase({ date: "2026-07-18", count: 0 });
  const service = createService(database);

  const reservation = await service.reserveAiSearch("user-1");
  const released = await service.releaseAiSearchReservation(
    "user-1",
    reservation.reservationId
  );

  assert.equal(released, true);
  assert.deepEqual(database.state.value, { date: "2026-07-18", count: 0 });
});

test("finalizes and releases reservations when transactions initially receive null", async () => {
  const database = createFakeDatabase(
    { date: "2026-07-18", count: 0 },
    { initialNullTransaction: true }
  );
  const service = createService(database);

  const successfulReservation = await service.reserveAiSearch("user-1");
  const finalized = await service.recordSuccessfulAiSearch(
    "user-1",
    successfulReservation.reservationId
  );
  const failedReservation = await service.reserveAiSearch("user-1");
  const released = await service.releaseAiSearchReservation(
    "user-1",
    failedReservation.reservationId
  );

  assert.equal(finalized.count, 1);
  assert.equal(released, true);
  assert.deepEqual(database.state.value, { date: "2026-07-18", count: 1 });
});

test("returns a 503 error when a database transaction does not settle", async () => {
  const database = {
    ref() {
      return {
        transaction() {
          return new Promise(() => {});
        },
      };
    },
  };
  const service = createAiUsageService({
    database,
    dateProvider: () => "2026-07-18",
    databaseTimeoutMs: 10,
  });

  await assert.rejects(
    service.getDailyAiUsage("user-1"),
    (error) => error.statusCode === 503 && error.message.includes("temporarily unavailable")
  );
});
