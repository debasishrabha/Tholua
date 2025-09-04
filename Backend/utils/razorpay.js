const razorpay = {
    orders: {
        create: async (orderOptions) => ({
            id: "mock_order_" + Math.random().toString(36).substring(7),
            amount: orderOptions.amount,
            currency: "INR",
            status: "created",
        }),
    },
    payments: {
        fetch: async (paymentId) => ({
            id: paymentId,
            status: "captured",
            amount: 1000, // Mock amount
        }),
    },
};

module.exports = razorpay;
