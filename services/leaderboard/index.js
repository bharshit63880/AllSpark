import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import consumeEvents from "./src/v1/logic.js";

const app = express();
const PORT = process.env.PORT || 3800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const initialConfigurations = async () => {
  await initializeTopics();
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

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Leaderboard service is running.",
  });
});

app.listen(PORT, async () => {
  console.log("Leaderboard Service: Listening on port", PORT, `http://localhost:${PORT}`);
  await runInitialConfigurationsWithRetry();
});
