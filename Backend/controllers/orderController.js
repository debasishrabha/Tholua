const pool = require("../config/db");
const sendEmail = require("../utils/mailer");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

// Step 1: Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
    const { total } = req.body;
    if (!total) return res.status(400).json({ message: "Total amount is required." });

    const options = {
        amount: total * 100, // in paise
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (err) {
        console.error("Razorpay Order Error:", err);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
};
// Step 2: Confirm Payment and Place Order
exports.placeOrder = async (req, res) => {
    const {
        name,
        phone,
        address,
        items,
        total,
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        upiId
    } = req.body;

    const userId = req.user.id;

    if (!name || !phone || !address || !items || !paymentMethod) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    // ✅ Razorpay signature verification (for online payments only)
    if (paymentMethod === "online") {
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
        const digest = hmac.digest("hex");

        if (digest !== razorpaySignature) {
            return res.status(400).json({ message: "Payment signature verification failed." });
        }
    }

    try {
        // ✅ Save order
        const result = await pool.query(
            `INSERT INTO orders 
                (user_id, items, total_price, delivery_address, status, order_time)
             VALUES ($1, $2, $3, $4, 'confirmed', NOW())
             RETURNING *`,
            [userId, JSON.stringify(items), total, address]
        );

        const order = result.rows[0];

        await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

        const cartAfter = await pool.query("SELECT * FROM cart_items WHERE user_id = $1", [userId]);
        console.log("Cart after delete:", cartAfter.rows);

        await sendEmail({
            to: "d60726851@gmail.com",   // make sure this is not empty!
            subject: "Your Order is Confirmed",
            html: `
        <h3>Thank you for your order!</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
       <h4>Items:</h4>
        <ul>
  ${items.map(i => `<li>${i.item_name} (x${i.quantity}) – ₹${i.item_price * i.quantity}</li>`).join("")}
</ul>

        <h3>Total: ₹${total}</h3>`
        });

        res.status(200).json({ message: "Order placed successfully", order });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ message: "Something went wrong." });
    }
};



// Step 5: Fetch orders for logged-in user
exports.getOrdersByUser = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT 
                id,
                items,
                total_price AS "totalPrice",
                delivery_address AS "deliveryAddress",
                order_time AS "orderTime",
                status
             FROM orders
             WHERE user_id = $1
             ORDER BY order_time DESC`,
            [userId]
        );

        const orders = result.rows.map(order => ({
            id: order.id,
            items: order.items,  // ✅ comes directly from DB (JSONB)
            totalPrice: order.totalPrice,
            deliveryAddress: order.deliveryAddress,
            orderTime: order.orderTime,
            status: order.status
        }));

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

