const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


router.post("/razorpay-order", orderController.createRazorpayOrder);
router.post("/place-order", orderController.placeOrder);
router.get('/:userId', orderController.getOrdersByUser);

module.exports = router;
