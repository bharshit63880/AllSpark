import "dotenv/config";
import express from "express";
import { initializeTopics } from "./src/utils/kafkaAdmin.js";
import { connectProducer } from "./src/utils/kafkaProducer.js";
import consumeEvents from "./src/v1/logic.js";
import connectDB from "./config/v1/db.js";

const app = express();

const PORT = process.env.PORT || 3500;


const initialConfigurations = async () => {
  try {
    console.log("[Startup] Starting initialization...");

    // Step 1: Initialize the Kafka Topics (admin only, no producer needed)
    console.log("[Startup] Step 1: Initializing Kafka topics...");
    await initializeTopics();
    console.log("[Startup] ✓ Kafka topics initialized");

    // Step 2: Connect the Producer (CRITICAL - must be done before consumer starts)
    console.log("[Startup] Step 2: Connecting Kafka producer...");
    await connectProducer();
    console.log("[Startup] ✓ Kafka producer connected");

    // Step 3: Connect the Database
    console.log("[Startup] Step 3: Connecting to database...");
    await connectDB();
    console.log("[Startup] ✓ Database connected");

    // Step 4: Start Consuming the Events (only after producer is 100% ready)
    console.log("[Startup] Step 4: Starting event consumer...");
    await consumeEvents();
    console.log("[Startup] ✓ Event consumer started");

    console.log("[Startup] ✓ All initialization complete!");

  } catch (error) {
    console.error("[Startup] ✗ Fatal error during initialization:", error);
    console.error("[Startup] Stack:", error.stack);
    process.exit(1);
  }
};


// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Successfully running Problem Service...",
    });
});


app.listen(PORT, async () => {
    console.log("Problem Service: Listening on the Port: ", PORT, `http://localhost:${PORT}`);
    await initialConfigurations();
});
