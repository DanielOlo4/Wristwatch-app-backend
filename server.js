require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./src/config/db");
const cors = require("cors")

const { register, login } = require("./src/Controllers/auth.controller");
const watchRouter = require("./src/routes/watch.routes");
const adminRouter = require("./src/routes/admin.routes")
const authRoutes = require("./src/routes/auth.routes");
const cartRoutes = require("./src/routes/cart.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());



// Debugging: check if MONGO_URI is loaded
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

// Image retrieval handling
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public homepage
app.get("/", (req, res) => {
  res.send("⏱️ Wristwatch API is running...");
});

// Auth routes
app.post("/register", register);
app.post("/login", login);

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/watches", watchRouter);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 5000;

// ✅ Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
