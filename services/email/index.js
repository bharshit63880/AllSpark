import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";

const app = express();

const PORT = process.env.EMAIL_SERVICE_PORT || 3600;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const initialConfigurations = async () => {
  // Initialize the Kafka Topics
  await initializeTopics();

  // Connect the Producer (if needed for future use)
  await connectProducer();

  // Start Consuming the Events
  await consumeEvents();
};

const runInitialConfigurationsWithRetry = async () => {
  const baseDelayMs = Math.max(1, Number(process.env.INIT_STARTUP_BASE_DELAY_MS) || 1000);
  const maxDelayMs = Math.max(1, Number(process.env.INIT_STARTUP_MAX_DELAY_MS) || 30000);
  let attempt = 0;
  let currentDelayMs = baseDelayMs;

  while (true) {
    attempt += 1;
    try {
      console.log(`[Email Startup] Attempt ${attempt}: running initial configurations`);
      await initialConfigurations();
      console.log("[Email Startup] Initial configurations complete.");
      break;
    } catch (error) {
      console.error(`[Email Startup] Attempt ${attempt} failed:`, error?.message || error);
      console.error("[Email Startup] Retrying initial configurations after backoff.");
      await sleep(currentDelayMs);
      currentDelayMs = Math.min(maxDelayMs, currentDelayMs * 2);
    }
  }
};

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Email Service is running...",
  });
});

app.listen(PORT, async () => {
  console.log(
    "Email Service: Listening on the Port: ",
    PORT,
    `http://localhost:${PORT}`
  );
  await runInitialConfigurationsWithRetry();
});
