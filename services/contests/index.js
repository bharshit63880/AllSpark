import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";
import connectDB from "./config/v1/db.js";

const app = express();

const PORT = process.env.PORT || 3200;


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const initialConfigurations = async () => {
  await initializeTopics();
  await connectProducer();
  await connectDB();
  await consumeEvents();
};

const runInitialConfigurationsWithRetry = async () => {
  const baseDelayMs = Math.max(1, Number(process.env.INIT_STARTUP_BASE_DELAY_MS) || 1000);
  const maxDelayMs = Math.max(1, Number(process.env.INIT_STARTUP_MAX_DELAY_MS) || 30000);
  let currentDelayMs = baseDelayMs;
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      console.log(`[Startup] Attempt ${attempt}: running initial configurations`);
      await initialConfigurations();
      console.log("[Startup] Initial configurations complete.");
      break;
    } catch (error) {
      console.error(`[Startup] Attempt ${attempt} failed:`, error?.message || error);
      console.error("[Startup] retrying after backoff...");
      await sleep(currentDelayMs);
      currentDelayMs = Math.min(maxDelayMs, currentDelayMs * 2);
    }
  }
};


// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Successfully running Contest Service....",
    });
});


app.listen(PORT, async () => {
    console.log("Contest Service: Listening on the Port: ", PORT, `http://localhost:${PORT}`);
    await runInitialConfigurationsWithRetry();
});
