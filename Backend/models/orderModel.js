const pool = require('../config/db');
const createOrder = async (userId, items, totalAmount) => {
    const query = `
    INSERT INTO orders (user_id, items, total_amount)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
    const values = [userId, JSON.stringify(items), totalAmount];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];  // return the created order
    } catch (err) {
        console.error('Error creating order:', err);
        throw err;
    }
};


const getOrdersByUser = async (userId) => {
    const query = `
    SELECT * FROM orders 
    WHERE user_id = $1
    ORDER BY order_date DESC;
  `;

    try {
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error('Error fetching user orders:', err);
        throw err;
    }
};

const getOrderById = async (orderId) => {
    const query = `
    SELECT * FROM orders 
    WHERE id = $1;
  `;

    try {
        const result = await pool.query(query, [orderId]);
        return result.rows[0];
    } catch (err) {
        console.error('Error fetching order by ID:', err);
        throw err;
    }
};


const deleteOrder = async (orderId) => {
    const query = `
    DELETE FROM orders 
    WHERE id = $1
    RETURNING *;
  `;

    try {
        const result = await pool.query(query, [orderId]);
        return result.rows[0];  // return deleted order
    } catch (err) {
        console.error('Error deleting order:', err);
        throw err;
    }
};

module.exports = {
    createOrder,
    getOrdersByUser,
    getOrderById,
    deleteOrder
};
