const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/authMiddleware');


// Add item to cart
router.post('/add', auth, cartController.addToCart);

// Get user's cart items
router.get('/', auth, cartController.getCart);

// Get cart total calculation
router.get('/total', auth, cartController.getCartTotal);

// Update item quantity
router.put('/update', auth, cartController.updateCart);

// Remove specific item by ID
router.delete('/item/:itemId', auth, cartController.removeItemFromCart);

// Clear entire cart
router.delete('/clear', auth, cartController.clearCart);

module.exports = router;
