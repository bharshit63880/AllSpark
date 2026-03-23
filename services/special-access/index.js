import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";
import connectDB from "./config/v1/db.js";

const app = express();
const PORT = process.env.PORT || 3970;

const initialConfigurations = async () => {
  try {
    await initializeTopics();
    await connectProducer();
    await connectDB();
    await consumeEvents();
    console.log("[Startup] special-access initialization complete.");
  } catch (error) {
    console.error("[Startup] special-access fatal error:", error);
    process.exit(1);
  }
};

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Successfully running Special Access Service...",
  });
});

app.listen(PORT, async () => {
  console.log("Special Access Service: Listening on port", PORT, `http://localhost:${PORT}`);
  await initialConfigurations();
});
