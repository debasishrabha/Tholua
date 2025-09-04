const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Get user addresses (from users table)
// Get user addresses (from users table)
router.get("/:id/addresses", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, address, phone FROM users WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json([result.rows[0]]); // <-- wrap in array
    } catch (err) {
        console.error("Error loading address:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Add or update address
router.post("/:id/address", async (req, res) => {
    try {
        const { id } = req.params;
        const { address, phone } = req.body;
        await pool.query("UPDATE users SET address = $1, phone = $2 WHERE id = $3", [address, phone, id]);
        res.json({ message: "Address updated successfully" });
    } catch (err) {
        console.error("Error updating address:", err);
        res.status(500).json({ message: "Server error" });
    }
});
// Get user orders
router.get("/:id/orders", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, user_id, items, total_price, delivery_address, order_time, status 
             FROM orders 
             WHERE user_id = $1 
             ORDER BY order_time DESC`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error("Error loading user orders:", err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
