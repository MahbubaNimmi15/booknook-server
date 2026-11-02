
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
}));

app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.send("BookNook Server is Running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BookNook API is working",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`BookNook Server running on http://localhost:${PORT}`);
});
