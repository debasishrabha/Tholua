const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===== Middleware =====
app.use(cors());                  // Allow cross-origin if needed
app.use(express.json());          // Parse JSON bodies

// ===== Import routes =====
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const userRoutes = require("./routes/user");

// ===== Mount API routes =====
app.use("/api/auth", authRoutes);     // <-- Login, register
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/user", userRoutes);

// ===== Serve static files (frontend in public/) =====
app.use(express.static(path.join(__dirname, "..", "public")));

// ===== JSON 404 handler for unknown API routes =====
app.all(/^\/api\/.*/, (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// ===== Catch-all for frontend routes =====
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ===== Start the server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Restaurant App running at http://localhost:${PORT}`);
});
