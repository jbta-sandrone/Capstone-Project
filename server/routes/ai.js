import { Router } from "express";
import {
  getRecommendations,
  getRecommendationUsage,
} from "../controllers/aiController.js";
import { authenticateFirebase } from "../middleware/authenticateFirebase.js";

const router = Router();

router.use(authenticateFirebase);

router.get("/recommendations/usage", getRecommendationUsage);
router.post("/recommendations", getRecommendations);

export default router;
