const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

// Middleware

app.use(
  cors({
    origin: [
      "https://ai-mock-interview-eta-gules.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);


app.use(express.json());
app.use((req, res, next) => {
  if (req.path === "/api/v1/auth/login") {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body:", req.body);
  }
  next();
});
// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Mock Interview API is running!",
  });
});

// Interview CRUD APIs
app.use("/api/v1/interviews", interviewRoutes);
app.use("/api/v1/auth", authRoutes);
// Connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
