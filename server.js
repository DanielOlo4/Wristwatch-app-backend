require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./src/config/db");
const cors = require("cors");

const watchRouter = require("./src/routes/watch.routes");
const adminRouter = require("./src/routes/admin.routes");
const authRoutes = require("./src/routes/auth.routes");
const cartRoutes = require("./src/routes/cart.routes");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",       // 👈 your local frontend
    "https://dantechy.netlify.app", // 👈 if deployed
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("⏱️ Wristwatch API is running...");
});

app.use("/api/admin", adminRouter);
app.use("/api/watches", watchRouter);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});