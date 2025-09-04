// config.js
const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : `${window.location.origin}/api`;

// Export the variables
export { API_URL };

// Helper function to get token
export const getToken = () => localStorage.getItem("token");
