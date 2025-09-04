const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Create Razorpay Order
router.post("/create-razorpay-order", authMiddleware, orderController.createRazorpayOrder);

// Place Order
router.post("/place", authMiddleware, orderController.placeOrder);

// Get logged-in user orders
router.get("/my-orders", authMiddleware, orderController.getOrdersByUser);

module.exports = router;
