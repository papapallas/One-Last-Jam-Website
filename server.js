require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const ticketRoutes = require('./routes/tickets');
const artistRoutes = require('./routes/artists');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000; // Railway provides PORT dynamically

// CORS for production
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint (Railway requires this)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Pallas Playground API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: PORT
    });
});

// Root endpoint (Railway health check)
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Pallas Playground is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Serve frontend for all other routes
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found' 
    });
});

// Listen on Railway dynamic port
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pallas Playground Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend served from: ${path.join(__dirname, 'frontend')}`);
});

// ADD THESE GRACEFUL SHUTDOWN HANDLERS:
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
