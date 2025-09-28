const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const QRCode = require('qrcode');
const dbConfig = require('../Database/config');

// Get current ticket price based on phase
function getCurrentPrice() {
    const today = new Date();
    const phase1End = new Date('2023-10-04');
    const phase2End = new Date('2023-10-10');
    
    if (today <= phase1End) return 30;
    if (today <= phase2End) return 50;
    return 70;
}

// Purchase ticket
router.post('/purchase', async (req, res) => {
    try {
        const { name, email, phone, university, referral } = req.body;
        
        // Validate required fields
        if (!name || !email || !phone || !university) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, email, phone, university'
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        // Generate unique ticket number
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const ticketNumber = `PALLAS-${timestamp}-${random}`;
        
        // Generate QR code
        const qrData = await QRCode.toDataURL(JSON.stringify({
            ticketNumber,
            name,
            event: 'Pallas Playground - One Last Jam',
            date: '2023-10-13'
        }));
        
        const currentPrice = getCurrentPrice();
        const refundDeadline = '2023-10-11';
        
        // Save to database
        const [result] = await connection.execute(
            `INSERT INTO tickets (ticket_number, buyer_name, buyer_email, buyer_phone, university, referral_artist, ticket_price, qr_code_data, refund_deadline) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ticketNumber, name, email, phone, university, referral || null, currentPrice, qrData, refundDeadline]
        );
        
        // Update artist referrals if referral exists
        if (referral) {
            await connection.execute(
                'UPDATE artists SET total_referrals = total_referrals + 1 WHERE artist_name = ?',
                [referral]
            );
        }
        
        await connection.end();
        
        res.json({ 
            success: true, 
            ticketNumber, 
            qrCode: qrData,
            price: currentPrice,
            message: 'Ticket purchased successfully!',
            data: {
                ticketNumber,
                buyerName: name,
                price: currentPrice,
                purchaseDate: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Ticket purchase error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process ticket purchase',
            message: error.message 
        });
    }
});

// Get ticket by number
router.get('/:ticketNumber', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM tickets WHERE ticket_number = ?',
            [req.params.ticketNumber]
        );
        
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket not found'
            });
        }
        
        res.json({
            success: true,
            ticket: rows[0]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database error'
        });
    }
});

// Get all tickets (for admin)
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT ticket_number, buyer_name, buyer_email, university, referral_artist, ticket_price, status, purchase_date FROM tickets ORDER BY purchase_date DESC'
        );
        
        await connection.end();
        
        res.json({
            success: true,
            tickets: rows,
            count: rows.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tickets'
        });
    }
});

module.exports = router;