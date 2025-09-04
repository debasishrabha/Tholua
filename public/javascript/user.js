// ================= Global Variables =================
let currentUserId = null;

// Run after DOM loads
document.addEventListener("DOMContentLoaded", async () => {
    await loadUserProfile();   // FIX: correct function call
    await loadAddresses();
    await loadOrders();

    // Navigation highlight
    document.querySelectorAll(".sidebar li").forEach((item) => {
        item.addEventListener("click", () => {
            document
                .querySelectorAll(".sidebar li")
                .forEach((li) => li.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // Tab switching
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    // Handle reorder + help
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("btn-reorder")) {
            const orderId = e.target.dataset.id;
            try {
                const res = await fetch(`${API_URL}/orders/reorder/${orderId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                });
                const data = await res.json();
                if (res.ok) {
                    alert("Order re-added to cart!");
                } else {
                    alert(data.message || "Failed to reorder");
                }
            } catch (err) {
                console.error("Error reordering:", err);
            }
        }

        if (e.target.classList.contains("btn-help")) {
            const orderId = e.target.dataset.id;
            alert(`Help request submitted for Order #${orderId}. Our support team will contact you.`);
        }
    });
});


// ---- PROFILE ----
async function loadUserProfile() {
    try {
        const userData = await getCurrentUser();
        if (!userData) {
            window.location.href = "index.html";
            return;
        }

        console.log("User Profile:", userData);

        const user = userData.user;
        currentUserId = user.id;

        // Safe DOM updates
        const profileName = document.querySelector(".profile-name");
        // const profileNumber = document.querySelector(".profile-number");

        if (profileName) profileName.textContent = user.name || "Guest User";
        // if (profileNumber) profileNumber.textContent = user.phone || "Not provided";
    } catch (err) {
        console.error("Error loading profile:", err);
    }
}


// ---- ADDRESSES ----
async function loadAddresses() {
    if (!currentUserId) return;

    try {
        const res = await fetch(`${API_URL}/user/${currentUserId}/addresses`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        const addresses = await res.json();
        const container = document.querySelector("#addresses");

        if (container) {
            container.innerHTML = "";
            if (Array.isArray(addresses) && addresses.length > 0) {
                addresses.forEach((address) => {
                    const div = document.createElement("div");
                    div.className = "address-card";
                    div.innerHTML = `
                        <p>${address.address}, ${address.city}, ${address.pincode}</p>
                        <button onclick="editAddress('${address._id}')">Edit</button>
                        <button onclick="deleteAddress('${address._id}')">Delete</button>
                    `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = "<p>No addresses found.</p>";
            }
        }
    } catch (err) {
        console.error("Error loading addresses:", err);
    }
}

async function addAddress(address) {
    if (!currentUserId) return;

    try {
        const res = await fetch(`${API_URL}/user/${currentUserId}/addresses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(address),
        });
        if (res.ok) {
            loadAddresses();
        }
    } catch (err) {
        console.error("Error adding address:", err);
    }
}

async function deleteAddress(id) {
    if (!currentUserId) return;

    try {
        await fetch(`${API_URL}/user/${currentUserId}/addresses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        loadAddresses();
    } catch (err) {
        console.error("Error deleting address:", err);
    }
}

function editAddress(id) {
    alert("Edit feature not implemented yet");
}


// ---- ORDERS ----
async function loadOrders() {
    if (!currentUserId) return;

    try {
        const res = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        const currentContainer = document.getElementById("current-orders");
        const pastContainer = document.getElementById("past-orders");
        if (!currentContainer || !pastContainer) return;

        currentContainer.innerHTML = "";
        pastContainer.innerHTML = "<h3>Past Orders</h3>";

        if (!res.ok) {
            currentContainer.innerHTML = "<p>Failed to load orders.</p>";
            return;
        }

        const data = await res.json();
        const orders = Array.isArray(data) ? data : data.orders || [];

        if (orders.length === 0) {
            currentContainer.innerHTML = `<p>No current orders found.</p>`;
            pastContainer.innerHTML += `<p>No past orders found.</p>`;
            return;
        }

        orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";

            // Fix: use correct fields from backend
            const orderId = order.id || order._id;
            const orderDate = order.date || order.createdAt || order.orderDate;
            const orderTotal = order.total || order.amount || order.totalPrice || 0;
            const orderStatus = order.status || order.orderStatus || "completed";

            // If no image at order level, try from first item
            const orderImage = order.image || (order.items?.[0]?.image) || "images/default-food.png";

            card.innerHTML = `
      <div class="order-details">
        <small>Order ${orderId} | ${orderDate ? new Date(order_time).toLocaleString() : "No Date"}</small>
        <div class="order-meta">
          <div>
            ${(order.items || []).map(it => `<p>${it.name || it.itemName} x${it.qty || it.quantity}</p>`).join("")}
            <strong>Total Paid: ₹${orderTotal}</strong>
          </div>
          <div class="order-actions">
            <button class="btn-reorder" data-id="${orderId}">REORDER</button>
            <button class="btn-help" data-id="${orderId}">HELP</button>
          </div>
        </div>
      </div>
    `;

            // Fix: match backend statuses
            if (["pending", "preparing", "ongoing"].includes(orderStatus)) {
                currentContainer.appendChild(card);
            } else {
                pastContainer.appendChild(card);
            }
        });

    } catch (err) {
        console.error("Error loading orders:", err);
    }
}


// ---- CHECKOUT ----
async function payNow(orderId, amount) {
    try {
        const res = await fetch(`${API_URL}/orders/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ amount }),
        });
        const order = await res.json();

        var options = {
            key: "rzp_test_yourkey", // replace with Razorpay key
            amount: order.amount,
            currency: "INR",
            name: "Tholua",
            description: "Order Payment",
            order_id: order.id,
            handler: async function (response) {
                await fetch(`${API_URL}/orders/verify-payment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(response),
                });
                alert("Payment Successful!");
                loadOrders();
            },
            theme: { color: "#3399cc" },
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
    } catch (err) {
        console.error("Error during payment:", err);
    }
}


// ---- NAVIGATION HELPERS ----
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach((sec) => (sec.style.display = "none"));
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "block";
}

function switchOrderTab(tab) {
    document.querySelectorAll(".tab-content").forEach((c) => (c.style.display = "none"));
    const target = document.getElementById(`${tab}-orders`);
    if (target) target.style.display = "block";
}
