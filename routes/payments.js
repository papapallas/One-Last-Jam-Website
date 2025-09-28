const express = require('express');
const router = express.Router();

// Payment routes (for future PayFast integration)
router.post('/process', async (req, res) => {
    // This will handle PayFast payment processing
    // For now, we'll simulate successful payment
    res.json({
        success: true,
        message: 'Payment processed successfully (simulated)',
        paymentId: 'PAY-' + Date.now(),
        amount: req.body.amount
    });
});

// Refund endpoint
router.post('/refund', async (req, res) => {
    const { ticketNumber } = req.body;
    
    // Check if within refund period
    const currentDate = new Date();
    const refundDeadline = new Date('2023-10-11');
    
    if (currentDate > refundDeadline) {
        return res.status(400).json({
            success: false,
            error: 'Refunds not available within 2 days of event'
        });
    }
    
    res.json({
        success: true,
        message: 'Refund processed successfully (simulated)',
        ticketNumber,
        refundAmount: req.body.amount
    });
});

module.exports = router;