import { Router } from "express";
import { getRecommendations } from "../controllers/aiController.js";

const router = Router();

// AI recommendation route. Gemini integration will be added in the service layer later.
router.post("/recommendations", getRecommendations);

export default router;

