// ================= Selectors =================
let openShopping = document.querySelector(".shopping");
let closeShopping = document.querySelector(".close-btn");
let body = document.querySelector("body");
let listCart = document.querySelector(".listCart");
let total = document.querySelector(".total");
let quantity = document.querySelector(".quantity");
let addToCartButtons = document.querySelectorAll(".addtokart h3");

// ================= Config (from config.js) =================
let token = window.getToken();


// ================= Cart Toggle =================
openShopping.addEventListener("click", () => {
    body.classList.toggle("showCart");
});

closeShopping.addEventListener("click", () => {
    body.classList.remove("showCart");
});

// ================= Local Cart =================
let listCards = JSON.parse(localStorage.getItem("cart")) || [];

function saveLocalCart() {
    localStorage.setItem("cart", JSON.stringify(listCards));
}

function addToCart(product) {
    let existingProduct = listCards.find((item) => item.id == product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        product.quantity = 1;
        listCards.push(product);
    }

    saveLocalCart();
    reloadCart();

    // 🔗 Sync to backend if logged in
    if (token) addToCartBackend(product);
}

function reloadCart() {
    listCart.innerHTML = "";
    let count = 0;
    let totalPrice = 0;

    listCards.forEach((item) => {
        totalPrice += item.price * item.quantity;
        count += item.quantity;

        let newItem = document.createElement("li");
        newItem.innerHTML = `
        <div><img src="/imgUrl/${item.image}" width="50"/></div>
        <div>${item.name}</div>
        <div>₹${item.price.toLocaleString()}</div>
        <div>
            <button onclick="changeQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <div class="count">${item.quantity}</div>
            <button onclick="changeQuantity('${item.id}', ${item.quantity + 1})">+</button>
        </div>`;
        listCart.appendChild(newItem);
    });

    total.innerText = `Total: ₹${totalPrice.toLocaleString()}`;
    quantity.innerText = `${count}`;
}

function changeQuantity(productId, qty) {
    let product = listCards.find((item) => item.id == productId);

    if (qty === 0) {
        listCards = listCards.filter((item) => item.id != productId);
    } else {
        product.quantity = qty;
    }

    saveLocalCart();
    reloadCart();

    // 🔗 Sync backend
    if (token) updateCartBackend(productId, qty);
}

// ================= Backend Cart =================
async function addToCartBackend(product) {
    try {
        await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
            }),
        });
    } catch (err) {
        console.error("Backend cart error:", err);
    }
}

async function updateCartBackend(productId, qty) {
    try {
        await fetch(`${API_URL}/cart/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ productId, quantity: qty }),
        });
    } catch (err) {
        console.error("Backend cart update error:", err);
    }
}

async function loadCartFromBackend() {
    if (!token) return; // only load if logged in

    try {
        let res = await fetch(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        let data = await res.json();

        // Map backend keys → frontend keys
        listCards = (data.items || []).map(item => ({
            id: item.product_id,
            name: item.item_name,
            price: parseFloat(item.item_price),
            image: item.item_image,
            quantity: item.quantity
        }));

        saveLocalCart();
        reloadCart();
    } catch (err) {
        console.error("Error fetching backend cart:", err);
    }
}

// ================= Init =================
document.addEventListener("DOMContentLoaded", () => {
    token = window.getToken(); // refresh token on page load

    if (token) {
        loadCartFromBackend(); // 🔗 Logged in → Load from backend
    } else {
        reloadCart(); // Local only
    }
});

// ================= Add to Cart Button =================
addToCartButtons.forEach((button) => {
    button.addEventListener("click", function () {
        let itemElement = this.closest(".items");

        let productId = itemElement.getAttribute("data-id");
        let productName = itemElement.getAttribute("data-name");
        let productPrice = itemElement.getAttribute("data-price");
        let productImage = itemElement.getAttribute("data-image");

        addToCart({
            id: productId,
            name: productName,
            price: parseInt(productPrice),
            image: productImage,
        });
    });
});
