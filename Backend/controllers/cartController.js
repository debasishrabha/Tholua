const pool = require("../config/db");

// ================= Add to Cart =================
exports.addToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, name, price, image, quantity } = req.body;

    // Validation
    if (!productId || !name || !price) {
        return res.status(400).json({
            error: "Product ID, name, and price are required"
        });
    }

    try {
        // Check if item already exists in user's cart
        const existingItem = await pool.query(
            "SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
            [userId, productId]
        );

        let result;
        if (existingItem.rows.length > 0) {
            // Update quantity if already in cart
            result = await pool.query(
                "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *",
                [quantity || 1, existingItem.rows[0].id]
            );
        } else {
            // Insert new item
            result = await pool.query(
                `INSERT INTO cart_items 
                (user_id, product_id, item_name, item_price, item_image, quantity) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [userId, productId, name, price, image, quantity || 1]
            );
        }

        res.status(201).json({
            success: true,
            message: "Item added to cart successfully",
            item: result.rows[0]
        });
    } catch (err) {
        console.error("Add to cart error:", err.message);
        res.status(500).json({
            error: "Failed to add item to cart",
            details: err.message
        });
    }
};

// ================= Get User's Cart =================
exports.getCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT id, product_id, item_name, item_price, item_image, quantity 
             FROM cart_items 
             WHERE user_id = $1 
             ORDER BY id DESC`,
            [userId]
        );

        res.json({
            success: true,
            items: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error("Get cart error:", err.message);
        res.status(500).json({
            error: "Failed to load cart items",
            details: err.message
        });
    }
};

// ================= Get Cart Total =================
exports.getCartTotal = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT id, product_id, item_name, item_price, item_image, quantity 
             FROM cart_items 
             WHERE user_id = $1`,
            [userId]
        );

        let total = 0;
        const items = result.rows.map(item => {
            const subtotal = parseFloat(item.item_price) * parseInt(item.quantity);
            total += subtotal;
            return {
                ...item,
                subtotal: subtotal.toFixed(2)
            };
        });

        res.json({
            success: true,
            items,
            total: total.toFixed(2),
            itemCount: items.reduce((sum, item) => sum + parseInt(item.quantity), 0)
        });
    } catch (err) {
        console.error("Get cart total error:", err.message);
        res.status(500).json({
            error: "Failed to calculate cart total",
            details: err.message
        });
    }
};

// ================= Update Cart Item Quantity =================
exports.updateCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity == null || quantity < 0) {
        return res.status(400).json({
            error: "Valid product ID and quantity are required"
        });
    }

    try {
        // If quantity is 0, remove the item
        if (quantity === 0) {
            await pool.query(
                "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
                [userId, productId]
            );
            return res.json({
                success: true,
                message: "Item removed from cart"
            });
        }

        const result = await pool.query(
            "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
            [quantity, userId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Item not found in cart"
            });
        }

        res.json({
            success: true,
            message: "Cart updated successfully",
            item: result.rows[0]
        });
    } catch (err) {
        console.error("Update cart error:", err.message);
        res.status(500).json({
            error: "Failed to update cart",
            details: err.message
        });
    }
};

// ================= Remove Item from Cart =================
exports.removeItemFromCart = async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.params;

    if (!itemId) {
        return res.status(400).json({
            error: "Item ID is required"
        });
    }

    try {
        const result = await pool.query(
            "DELETE FROM cart_items WHERE user_id = $1 AND id = $2 RETURNING *",
            [userId, itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Item not found in cart"
            });
        }

        res.json({
            success: true,
            message: "Item removed from cart successfully",
            removedItem: result.rows[0]
        });
    } catch (err) {
        console.error("Remove item error:", err.message);
        res.status(500).json({
            error: "Failed to remove item from cart",
            details: err.message
        });
    }
};

// ================= Clear Entire Cart =================
exports.clearCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            "DELETE FROM cart_items WHERE user_id = $1 RETURNING *",
            [userId]
        );

        res.json({
            success: true,
            message: "Cart cleared successfully",
            removedItems: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error("Clear cart error:", err.message);
        res.status(500).json({
            error: "Failed to clear cart",
            details: err.message
        });
    }
};
