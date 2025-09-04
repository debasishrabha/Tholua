// models/cartModel.js
const pool = require("../config/db"); // your db.js where you connect PostgreSQL

// Add item to cart
const addItemToCart = async (userId, itemName, itemPrice, quantity = 1) => {
    const query = `
    INSERT INTO cart_items (user_id, item_name, item_price, quantity)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
    const values = [userId, itemName, itemPrice, quantity];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// Get all items for a user's cart
const getCartItems = async (userId) => {
    const query = `
    SELECT * FROM cart_items
    WHERE user_id = $1;
  `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// Update item quantity
const updateCartItemQuantity = async (itemId, quantity) => {
    const query = `
    UPDATE cart_items
    SET quantity = $1
    WHERE id = $2
    RETURNING *;
  `;
    const result = await pool.query(query, [quantity, itemId]);
    return result.rows[0];
};

// Remove item from cart
const removeCartItem = async (itemId) => {
    const query = `
    DELETE FROM cart_items
    WHERE id = $1
    RETURNING *;
  `;
    const result = await pool.query(query, [itemId]);
    return result.rows[0];
};

// Clear all items in a user's cart
const clearCart = async (userId) => {
    const query = `
    DELETE FROM cart_items
    WHERE user_id = $1;
  `;
    await pool.query(query, [userId]);
};

module.exports = {
    addItemToCart,
    getCartItems,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
