import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "../config/v1/db.js";
import { initializeTopics } from "./utils/kafkaAdmin.js";
import { connectProducer } from "./utils/kafkaProducer.js";
import runConsumer from "./kafka/consume.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = process.env.PORT || 3950;

app.use(cors());
app.use(express.json());

app.use("/api/v1/admin", adminRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Admin service is running." });
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initialConfigurations = async () => {
  await connectDB();
  await initializeTopics();
  await connectProducer();
  await runConsumer();
};

const runInitialConfigurationsWithRetry = async (maxRetries = 20, retryDelay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await initialConfigurations();
      console.log("Admin Service: Initial configurations completed successfully.");
      return;
    } catch (error) {
      console.error(`Admin Service: Initialization attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt === maxRetries) {
        console.error("Admin Service: Max retries reached. Exiting process.");
        process.exit(1);
      }
      console.log(`Admin Service: Retrying initialization in ${retryDelay}ms...`);
      await sleep(retryDelay);
    }
  }
};

app.listen(PORT, async () => {
  console.log("Admin service listening on port", PORT, `http://localhost:${PORT}`);
  await runInitialConfigurationsWithRetry();
});
