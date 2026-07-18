import { generateMenuRecommendations } from "../services/geminiService.js";
import {
  DAILY_AI_SEARCH_LIMIT,
  getDailyAiUsage,
  releaseAiSearchReservation,
  reserveAiSearch,
  recordSuccessfulAiSearch,
} from "../services/aiUsageService.js";

const LIMIT_MESSAGE = "Daily AI Smart Search limit reached. Please try again tomorrow.";
const BUSY_MESSAGE = "Your available AI Smart Searches are already in progress. Please wait and try again.";
const PREFERENCE_OPTIONS = {
  category: new Set([
    "Any",
    "Milk Tea",
    "Espresso",
    "Fruit Tea",
    "Silog",
    "Sandwiches",
    "Snacks",
    "Rice Meals",
    "Noodles & Pasta",
    "Fries",
    "Extras",
    "Best Seller",
  ]),
  taste: new Set(["Sweet", "Creamy", "Coffee-forward", "Fruity", "Savory", "Light"]),
  temperature: new Set(["Any", "Cold", "Hot", "Room temperature"]),
  budget: new Set(["Under P100", "P100-P150", "P150-P200", "Any budget"]),
};

function sendLimitReached(res) {
  return res.status(429).json({
    success: false,
    code: "DAILY_AI_LIMIT_REACHED",
    message: LIMIT_MESSAGE,
    count: DAILY_AI_SEARCH_LIMIT,
    limit: DAILY_AI_SEARCH_LIMIT,
    remaining: 0,
  });
}

function sendSearchesInProgress(res, usage) {
  return res.status(429).json({
    success: false,
    code: "AI_SEARCHES_IN_PROGRESS",
    message: BUSY_MESSAGE,
    ...usage,
  });
}

function hasValidPreferences(preferences) {
  return Object.entries(PREFERENCE_OPTIONS).every(([name, allowedValues]) =>
    allowedValues.has(preferences[name])
  );
}

function isValidMenuItems(menuItems) {
  return (
    Array.isArray(menuItems) &&
    menuItems.length > 0 &&
    menuItems.length <= 250 &&
    menuItems.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.name === "string" &&
        item.name.trim().length > 0 &&
        item.name.length <= 150
    )
  );
}

export async function getRecommendationUsage(req, res, next) {
  try {
    const usage = await getDailyAiUsage(req.auth.uid);

    return res.status(200).json({
      success: true,
      ...usage,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecommendations(req, res, next) {
  try {
    const { category, taste, temperature, budget, menuItems } = req.body || {};
    const preferences = { category, taste, temperature, budget };

    if (!hasValidPreferences(preferences)) {
      return res.status(400).json({
        success: false,
        message: "Valid category, taste, temperature, and budget preferences are required.",
      });
    }

    if (!isValidMenuItems(menuItems)) {
      return res.status(400).json({
        success: false,
        message: "A valid menu items list is required.",
      });
    }

    // Reserve one of the three slots transactionally before spending Gemini quota.
    // The durable count is not incremented until Gemini succeeds.
    const reservation = await reserveAiSearch(req.auth.uid);

    if (!reservation.reservationId) {
      return reservation.usage.remaining === 0
        ? sendLimitReached(res)
        : sendSearchesInProgress(res, reservation.usage);
    }

    const { reservationId } = reservation;

    let result;
    try {
      result = await generateMenuRecommendations(
        preferences,
        menuItems
      );
    } catch (error) {
      await releaseAiSearchReservation(req.auth.uid, reservationId).catch((releaseError) => {
        console.error("Could not release failed AI request reservation:", releaseError);
      });
      throw error;
    }

    const updatedUsage = await recordSuccessfulAiSearch(
      req.auth.uid,
      reservationId
    );

    if (!updatedUsage) {
      await releaseAiSearchReservation(
        req.auth.uid,
        reservationId
      ).catch((releaseError) => {
        console.error(
          "Could not release unfinalized AI reservation:",
          releaseError
        );
      });

      const error = new Error(
        "The successful AI response could not be finalized. Please try again."
      );

      error.statusCode = 503;
      throw error;
    }

    return res.status(200).json({
      success: true,
      recommendations: result.recommendations || [],
      ...updatedUsage,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    next(error);
  }
}
