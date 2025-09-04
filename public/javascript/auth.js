function getToken() {
    return localStorage.getItem("token");
}

function isLoggedIn() {
    return !!getToken();
}

async function getCurrentUser() {
    if (!isLoggedIn()) return null;
    const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) return null;
    return await res.json();
}

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    window.location.href = "index.html";
}
document.addEventListener("DOMContentLoaded", async () => {
    const userIcon = document.querySelector(".login-btn");
    const loginPopup = document.querySelector(".login-popup");

    if (isLoggedIn()) {
        const user = await getCurrentUser();

        if (user) {
            if (userIcon) {
                userIcon.addEventListener("click", (e) => {
                    e.preventDefault(); // stop popup/open-modal
                    window.location.href = "user.html"; // redirect directly
                });
            }
            if (loginPopup) loginPopup.style.display = "none";
        } else {
            logoutUser(); // token invalid
        }
    } else {
        if (loginPopup) loginPopup.style.display = "block";
    }
});
