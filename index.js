const express = require("express");
const connectDB = require("./config/connectDB");
const app = express();

const cors = require("cors");
app.use(cors());

require("dotenv").config();

// Connect to database
connectDB();

app.use(express.json());

app.use("/auth", require("./routes/authRouter"));
app.use("/api/albums", require("./routes/albumRouter"));
app.use("/api/albums", require("./routes/imageRouter"));

app.get("/", (req, res) => {
  res.send("KaviosPix Backend API is running!");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Export the app for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`app listening on port ${port}`);
  });
}
