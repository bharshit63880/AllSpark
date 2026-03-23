import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";

const app = express();

const PORT = process.env.PORT || 3100;


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initialConfigurations = async () => {
  // Initialize the Kafka Topics
  await initializeTopics();

  // Connect the Producer
  await connectProducer();

  // Start Consuming the Events
  await consumeEvents();
};

const runInitialConfigurationsWithRetry = async (maxRetries = 20, retryDelay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await initialConfigurations();
      console.log("Auth Service: Initial configurations completed successfully.");
      return;
    } catch (error) {
      console.error(`Auth Service: Initialization attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt === maxRetries) {
        console.error("Auth Service: Max retries reached. Exiting process.");
        process.exit(1);
      }
      console.log(`Auth Service: Retrying initialization in ${retryDelay}ms...`);
      await sleep(retryDelay);
    }
  }
};

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Successfully running Auth Service....",
  });
});

app.listen(PORT, async () => {
  console.log("Auth Service: Listening on the Port: ", PORT, `http://localhost:${PORT}`);
  await runInitialConfigurationsWithRetry();
});
