import { generateMenuRecommendations } from "../services/geminiService.js";

export async function getRecommendations(req, res, next) {
  try {
    const { category, taste, temperature, budget, menuItems } = req.body;

    if (!category || !taste || !temperature || !budget) {
      return res.status(400).json({
        success: false,
        message: "Missing required preferences.",
      });
    }

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Menu items are required.",
      });
    }

    const result = await generateMenuRecommendations(
      { category, taste, temperature, budget },
      menuItems
    );

    res.status(200).json({
      success: true,
      recommendations: result.recommendations || [],
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    next(error);
  }
}