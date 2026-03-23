// Patch global timers to avoid negative timeout issues (Node emits TimeoutNegativeWarning when delay < 0)
import "./src/utils/patchSetTimeout.js";

import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(1, ms)));

const initialConfigurations = async () => {
  // Initialize the Kafka Topics
  await initializeTopics();

  // Connect the Producer
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
      console.log(`[Startup] Attempt ${attempt}: running initial configurations`);
      await initialConfigurations();
      console.log("[Startup] Initial configurations complete.");
      break;
    } catch (error) {
      console.error(`[Startup] Attempt ${attempt} failed:`, error?.message || error);
      console.error("[Startup] Retrying initial configurations after backoff.");
      await sleep(currentDelayMs);
      currentDelayMs = Math.min(maxDelayMs, currentDelayMs * 2);
    }
  }
};

// Health + Root Routes
app.get("/", (req, res) => {
  res.status(200).json({ service: "judge", status: "ok" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ service: "judge", status: "healthy" });
});

// 404 handler (all other routes)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
});

const server = app.listen(PORT, async () => {
  const address = server.address();
  const boundPort = typeof address === "string" ? address : address?.port;
  console.log(`Judge Service: Listening on port ${boundPort} http://localhost:${boundPort}`);

  await runInitialConfigurationsWithRetry();
});
