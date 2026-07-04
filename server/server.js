import "dotenv/config";

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "running",
    project: "CLIQ Backend"
  });
});

app.use("/api", aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CLIQ Backend running on port ${PORT}`);
});