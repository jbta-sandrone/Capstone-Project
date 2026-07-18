import { firebaseAuth } from "../config/firebaseAdmin.js";

export async function authenticateFirebase(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required for AI Smart Search.",
    });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(match[1]);

    if (!decodedToken.uid) {
      throw new Error("Verified Firebase token did not include a uid.");
    }

    req.auth = {
      uid: decodedToken.uid,
    };
    next();
  } catch (error) {
    console.warn("Firebase ID token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or has expired. Please sign in again.",
    });
  }
}
