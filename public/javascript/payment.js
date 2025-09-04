document.addEventListener('DOMContentLoaded', async function () {
    // ==================== INITIALIZE ====================
    const cardDetails = document.getElementById('cardDetails');
    const upiRadio = document.getElementById('upiRadio');
    const upiApps = document.getElementById('upiApps');
    const upiInput = document.getElementById('upiInput');
    const payButton = document.getElementById('payButton');
    const successMessage = document.getElementById('successMessage');
    const formGroups = document.querySelectorAll('.form-group');
    const orderSummary = document.querySelector(".order-summary");
    let cartTotal = 0;

    // ==================== FETCH CART SUMMARY ====================
    async function loadCartSummary() {
        try {
            const res = await fetch("/api/cart/total", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                orderSummary.innerHTML = "";
                cartTotal = parseFloat(data.total);

                data.items.forEach(item => {
                    orderSummary.innerHTML += `
                        <div class="order-item">
                            <span>${item.item_name} <span class="quantity">× ${item.quantity}</span></span>
                            <span>₹${(item.item_price * item.quantity).toFixed(2)}</span>
                        </div>
                    `;
                });

                orderSummary.innerHTML += `
                    <hr class="divider">
                    <div class="order-item">
                        <span>Delivery Fee</span>
                        <span>₹0</span>
                    </div>
                    <div class="order-total">
                        <span>Total</span>
                        <span id="totalAmount">₹${data.total}</span>
                    </div>
                `;

                payButton.textContent = `Pay ₹${data.total}`;
            } else {
                throw new Error(data.error || "Failed to fetch cart");
            }
        } catch (err) {
            console.error("Payment page error:", err.message);
            orderSummary.innerHTML = `
                <div class="error" style="color: #e74a3b; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load cart. Please refresh the page.</p>
                    <p><small>${err.message}</small></p>
                </div>
            `;
        }
    }

    // ==================== PAYMENT METHOD TOGGLE ====================
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            upiApps.classList.toggle('active', upiRadio.checked);
            cardDetails.style.display = radio.value === 'card' ? 'block' : 'none';

            if (radio.value !== 'card') {
                document.querySelectorAll('.card-details .error-message').forEach(msg => {
                    msg.style.display = 'none';
                });
                document.querySelectorAll('.card-details .form-control').forEach(input => {
                    input.classList.remove('error');
                });
            }

            if (radio.value !== 'upi') {
                document.querySelector('#upiInput + .error-message').style.display = 'none';
                upiInput.classList.remove('error');
            }
        });
    });

    // ==================== UPI APP SELECTION ====================
    document.querySelectorAll('.upi-app').forEach(app => {
        app.addEventListener('click', () => {
            const upi = app.getAttribute('data-upi');
            upiInput.value = upi;
            document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('active'));
            app.classList.add('active');
        });
    });

    // ==================== VALIDATION ====================
    function validateForm() {
        let isValid = true;

        const name = document.getElementById('name');
        const phone = document.getElementById('phone');
        const address = document.getElementById('address');

        // Reset errors
        formGroups.forEach(group => group.classList.remove('error'));

        // Validate delivery details
        if (!name.value.trim()) {
            name.parentElement.classList.add('error');
            isValid = false;
        }
        if (!phone.value.trim() || !/^\d{10}$/.test(phone.value)) {
            phone.parentElement.classList.add('error');
            isValid = false;
        }
        if (!address.value.trim()) {
            address.parentElement.classList.add('error');
            isValid = false;
        }

        const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
        if (selectedPayment === 'card') {
            const cardNumber = document.getElementById('cardNumber');
            const expiry = document.getElementById('expiry');
            const cvv = document.getElementById('cvv');
            const cardName = document.getElementById('cardName');

            if (!cardNumber.value.trim() || !/^\d{16}$/.test(cardNumber.value.replace(/\s/g, ''))) {
                cardNumber.parentElement.classList.add('error');
                isValid = false;
            }
            if (!expiry.value.trim() || !/^\d{2}\/\d{2}$/.test(expiry.value)) {
                expiry.parentElement.classList.add('error');
                isValid = false;
            }
            if (!cvv.value.trim() || !/^\d{3,4}$/.test(cvv.value)) {
                cvv.parentElement.classList.add('error');
                isValid = false;
            }
            if (!cardName.value.trim()) {
                cardName.parentElement.classList.add('error');
                isValid = false;
            }
        } else if (selectedPayment === 'upi') {
            if (!upiInput.value.trim() || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiInput.value)) {
                upiInput.parentElement.classList.add('error');
                isValid = false;
            }
        }
        return isValid;
    }

    // ==================== PROCESS PAYMENT ====================
    // ==================== PROCESS PAYMENT ====================
    async function processPayment() {
        const deliveryDetails = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        try {
            if (paymentMethod === "cod") {
                // 👉 Directly place COD order (no Razorpay)
                const response = await fetch('/api/orders/place', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        ...deliveryDetails,
                        items: [], // optionally fetch cart items from backend
                        total: cartTotal,
                        paymentMethod: "cod"
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    return { success: true, cod: true, order: data.order };
                } else {
                    return { success: false, error: data.message };
                }
            } else {
                // 👉 Online Payment (Razorpay)
                const response = await fetch('/api/orders/create-razorpay-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        total: cartTotal
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    return { success: true, cod: false, razorpayOrder: data.order, deliveryDetails, paymentMethod };
                } else {
                    return { success: false, error: data.message };
                }
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    payButton.addEventListener('click', async function (e) {
        e.preventDefault();

        if (!validateForm()) {
            const firstError = document.querySelector('.error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        payButton.disabled = true;
        payButton.textContent = 'Processing...';

        try {
            const paymentResult = await processPayment();

            if (paymentResult.success) {
                if (paymentResult.cod) {
                    // COD success
                    successMessage.innerHTML = `
                    <h3>✅ Order Placed Successfully (Cash on Delivery)</h3>
                    <p>Your food will be delivered soon!</p>
                `;
                    successMessage.style.display = 'block';
                    payButton.style.display = 'none';
                } else {
                    // Online (Razorpay)
                    const options = {
                        key: "YOUR_RAZORPAY_KEY_ID", // hardcode or inject key
                        amount: paymentResult.razorpayOrder.amount,
                        currency: "INR",
                        name: "Your Restaurant",
                        description: "Food Order Payment",
                        order_id: paymentResult.razorpayOrder.id,
                        handler: async function (response) {
                            // After Razorpay success, call backend to confirm
                            const confirmRes = await fetch('/api/orders/place', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                    ...paymentResult.deliveryDetails,
                                    items: [], // fetch from cart if needed
                                    total: cartTotal,
                                    paymentMethod: "online",
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature
                                })
                            });

                            const confirmData = await confirmRes.json();
                            if (confirmRes.ok) {
                                successMessage.innerHTML = `
                                <h3>✅ Payment Successful!</h3>
                                <p>Your order has been confirmed.</p>
                            `;
                                successMessage.style.display = 'block';
                                payButton.style.display = 'none';
                            } else {
                                alert("Order placement failed after payment.");
                            }
                        },
                        prefill: {
                            name: document.getElementById('name').value,
                            contact: document.getElementById('phone').value,
                        },
                        theme: {
                            color: "#4e73df"
                        }
                    };

                    const rzp = new Razorpay(options);
                    rzp.open();
                }
            } else {
                alert(`Payment failed: ${paymentResult.error}`);
                payButton.disabled = false;
                payButton.textContent = `Pay ₹${cartTotal.toFixed(2)}`;
            }
        } catch (error) {
            alert('An unexpected error occurred. Please try again.');
            payButton.disabled = false;
            payButton.textContent = `Pay ₹${cartTotal.toFixed(2)}`;
        }
    });

    // ==================== EVENT LISTENERS ====================
    // Clear errors while typing
    formGroups.forEach(group => {
        const input = group.querySelector('.form-control');
        if (input) {
            input.addEventListener('input', () => {
                group.classList.remove('error');
            });
        }
    });

    // Format card number
    const cardNumber = document.getElementById('cardNumber');
    cardNumber.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\s+/g, '');
        if (value.length > 16) value = value.substr(0, 16);
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Format expiry date
    const expiry = document.getElementById('expiry');
    expiry.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substr(0, 4);
        if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{0,2})/, '$1/$2');
        }
        e.target.value = value;
    });

    // ==================== INITIAL LOAD ====================
    await loadCartSummary();
});
