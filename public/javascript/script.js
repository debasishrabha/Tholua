import { API_URL } from "./config.js";

// ===== Show login popup on profile button click =====
const showPopupBtn = document.querySelector(".login-btn");
const formPopup = document.querySelector(".modal-content");
const hidePopupBtns = document.querySelectorAll(".modal-content .close");
const loginSignupLinks = document.querySelectorAll(".form-box .register a");

const signInForm = document.querySelector(".login");
const signUpForm = document.querySelector(".signup");

// Show login popup
showPopupBtn?.addEventListener("click", () => {
    document.body.classList.add("show-popup");
    if (signInForm) signInForm.style.display = "block";
    if (signUpForm) signUpForm.style.display = "none";
});

// Hide login popup
hidePopupBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        document.body.classList.remove("show-popup");
        if (signInForm) signInForm.style.display = "none";
        if (signUpForm) signUpForm.style.display = "none";
    });
});

// Toggle between login and signup forms
loginSignupLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const isSignup = link.classList.contains("signup-link");
        if (signInForm) signInForm.style.display = isSignup ? "none" : "block";
        if (signUpForm) signUpForm.style.display = isSignup ? "block" : "none";
    });
});

// =============================
// SIGNUP FORM HANDLING
// =============================
const signupForm = document.querySelector(".form-box.signup form");

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputs = signupForm.querySelectorAll("input");
        const name = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;

        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();
            console.log("Signup Response:", data);

            if (res.ok) {
                alert("✅ Signup successful!");
                signupForm.reset();
                if (signInForm) signInForm.style.display = "block";
                if (signUpForm) signUpForm.style.display = "none";
            } else {
                alert("❌ Signup failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Error:", err);
            alert("❌ Something went wrong during signup!");
        }
    });
}

// =============================
// LOGIN FORM HANDLING
// =============================
const loginForm = document.querySelector(".form-box.login form");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputs = loginForm.querySelectorAll("input");
        const email = inputs[0].value;
        const password = inputs[1].value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            console.log("Login Response:", data);

            if (res.ok) {
                alert("✅ Login successful!");
                loginForm.reset();

                if (data.token) {
                    localStorage.setItem("token", data.token);
                }

                document.body.classList.remove("show-popup");
            } else {
                alert("❌ Login failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Error:", err);
            alert("❌ Something went wrong during login!");
        }
    });
}

// ===== Checkout button redirect =====
document.querySelector(".checkOut-btn")?.addEventListener("click", () => {
    window.location.href = "payment.html";
});

// ===== Mobile Nav Toggle =====
function toggleNav() {
    const nav = document.querySelector(".nav-link");
    const icon = document.querySelector(".bar");

    if (!nav || !icon) return;

    const isOpen = nav.classList.toggle("show");

    if (isOpen) {
        nav.classList.remove("hidden");
        icon.innerHTML = `<i class="fa-solid fa-times"></i>`;
    } else {
        nav.classList.add("hidden");
        icon.innerHTML = `☰`;
    }
}

// ===== Reset nav on screen resize =====
function resetNavOnResize() {
    const nav = document.querySelector(".nav-link");
    const icon = document.querySelector(".bar");

    if (!nav || !icon) return;

    if (window.innerWidth >= 768) {
        nav.classList.remove("hidden", "show");
        icon.innerHTML = `☰`;
    } else {
        nav.classList.add("hidden");
        nav.classList.remove("show");
        icon.innerHTML = `☰`;
    }
}

// ===== User icon (modal vs redirect) =====
document.querySelectorAll(".open-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        if (token) {
            window.location.href = "user.html";
            return;
        }

        document.body.classList.add("show-popup");
        const loginForm = document.querySelector(".login-form");
        const signupForm = document.querySelector(".signup-form");
        if (loginForm) loginForm.style.display = "block";
        if (signupForm) signupForm.style.display = "none";
    });
});

// ===== Protected pages check =====
document.addEventListener("DOMContentLoaded", async () => {
    const protectedPages = ["user.html", "payment.html"];
    const currentPage = window.location.pathname.split("/").pop();
    const token = localStorage.getItem("token");

    if (protectedPages.includes(currentPage) && !token) {
        window.location.href = "index.html";
        return;
    }

    if (protectedPages.includes(currentPage) && token) {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token,
                },
            });

            const data = await res.json();
            console.log("User Profile:", data);

            if (res.ok) {
                if (document.getElementById("userName"))
                    document.getElementById("userName").innerText =
                        data.user?.name || "No Name";
                if (document.getElementById("userEmail"))
                    document.getElementById("userEmail").innerText =
                        data.user?.email || "No Email";
            } else {
                localStorage.removeItem("token");
                window.location.href = "index.html";
            }
        } catch (err) {
            console.error("Error:", err);
            localStorage.removeItem("token");
            window.location.href = "index.html";
        }
    }
});

window.addEventListener("resize", resetNavOnResize);
window.addEventListener("DOMContentLoaded", resetNavOnResize);
