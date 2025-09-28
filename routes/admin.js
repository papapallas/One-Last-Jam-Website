const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../Database/config');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const password = req.headers['admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            error: 'Invalid admin password'
        });
    }
    next();
};

// Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Ticket statistics
        const [ticketStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_tickets,
                SUM(ticket_price) as total_revenue,
                university,
                COUNT(*) as count
            FROM tickets 
            WHERE status = 'active' 
            GROUP BY university
        `);
        
        // Revenue by phase
        const [revenueByPhase] = await connection.execute(`
            SELECT 
                CASE 
                    WHEN ticket_price = 30 THEN 'Phase 1'
                    WHEN ticket_price = 50 THEN 'Phase 2' 
                    ELSE 'Phase 3'
                END as phase,
                COUNT(*) as ticket_count,
                SUM(ticket_price) as revenue
            FROM tickets 
            WHERE status = 'active'
            GROUP BY phase
        `);
        
        // Artist referral rankings
        const [artistRankings] = await connection.execute(`
            SELECT artist_name, total_referrals 
            FROM artists 
            ORDER BY total_referrals DESC
        `);
        
        await connection.end();
        
        const totalTickets = ticketStats.reduce((sum, stat) => sum + stat.total_tickets, 0);
        const totalRevenue = ticketStats.reduce((sum, stat) => sum + (stat.total_revenue || 0), 0);
        
        res.json({
            success: true,
            dashboard: {
                totalTickets,
                totalRevenue,
                capacity: {
                    current: totalTickets,
                    max: 150,
                    percentage: Math.round((totalTickets / 150) * 100)
                },
                universityBreakdown: ticketStats,
                revenueByPhase,
                topArtists: artistRankings.slice(0, 5)
            }
        });
        
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data'
        });
    }
});

// Add new artist
router.post('/artists', authenticateAdmin, async (req, res) => {
    try {
        const { artistName, songCount, setTime, contactEmail } = req.body;
        
        if (!artistName || !songCount) {
            return res.status(400).json({
                success: false,
                error: 'Artist name and song count are required'
            });
        }
        
        const connection = await mysql.createConnection(dbConfig);
        
        const [result] = await connection.execute(
            'INSERT INTO artists (artist_name, song_count, set_time, contact_email) VALUES (?, ?, ?, ?)',
            [artistName, songCount, setTime, contactEmail]
        );
        
        // Log admin action
        await connection.execute(
            'INSERT INTO admin_logs (admin_user, action_type, action_details) VALUES (?, ?, ?)',
            ['admin', 'add_artist', JSON.stringify({ artistName, songCount })]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            message: 'Artist added successfully',
            artistId: result.insertId
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'Artist name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to add artist'
        });
    }
});

// Update event costs
router.put('/financials', authenticateAdmin, async (req, res) => {
    try {
        const { eventCosts, artistPercentage } = req.body;
        
        // In a real app, you'd save this to a settings table
        // For now, we'll just acknowledge the update
        
        res.json({
            success: true,
            message: 'Financial settings updated',
            financials: {
                eventCosts,
                artistPercentage
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update financial settings'
        });
    }
});

module.exports = router;