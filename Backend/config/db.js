const { Pool } = require("pg");
const path = require("path");

// Load environment variables from .env located in the project root
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL connected"))
    .catch((err) => console.error("❌ DB connection error:", err));

module.exports = pool;
