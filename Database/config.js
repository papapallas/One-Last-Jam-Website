require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'pallas_playground',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// For Railway MySQL service
if (process.env.MYSQL_URL) {
    dbConfig.uri = process.env.MYSQL_URL;
}

// Test connection function
async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');
        await connection.end();
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = dbConfig;
module.exports.testConnection = testConnection;