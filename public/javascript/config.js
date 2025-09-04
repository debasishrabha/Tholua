// config.js
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://tholua-1.onrender.com/api";

const token = localStorage.getItem("token");
