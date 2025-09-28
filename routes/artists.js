const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../Database/config');

// Get all artists with earnings calculations
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Get total revenue and costs for calculations
        const [ticketStats] = await connection.execute(
            'SELECT SUM(ticket_price) as total_revenue, COUNT(*) as total_tickets FROM tickets WHERE status = "active"'
        );
        
        const totalRevenue = ticketStats[0].total_revenue || 0;
        const eventCosts = 5000; // This should come from admin settings
        const profit = Math.max(0, totalRevenue - eventCosts);
        
        // Get all artists
        const [artists] = await connection.execute(
            'SELECT * FROM artists ORDER BY artist_name'
        );
        
        // Calculate earnings for each artist
        const totalSongs = artists.reduce((sum, artist) => sum + artist.song_count, 0);
        const artistPool = profit * 0.20; // 20% of profit to artists
        const referralPool = profit * 0.10; // 10% for referrals
        
        const artistsWithEarnings = artists.map(artist => {
            const songPercentage = totalSongs > 0 ? (artist.song_count / totalSongs) : 0;
            const referralPercentage = artist.total_referrals > 0 ? (artist.total_referrals / artists.reduce((sum, a) => sum + a.total_referrals, 0)) : 0;
            
            const songEarnings = artistPool * 0.7 * songPercentage; // 70% of artist pool by songs
            const referralEarnings = referralPool * referralPercentage; // Referral pool
            const totalEarnings = 150 + songEarnings + referralEarnings; // R150 base + calculated
            
            return {
                ...artist,
                songPercentage: (songPercentage * 100).toFixed(1),
                referralPercentage: (referralPercentage * 100).toFixed(1),
                projectedEarnings: Math.round(totalEarnings),
                songEarnings: Math.round(songEarnings),
                referralEarnings: Math.round(referralEarnings)
            };
        });
        
        await connection.end();
        
        res.json({
            success: true,
            artists: artistsWithEarnings,
            financials: {
                totalRevenue,
                eventCosts,
                profit,
                artistPool,
                referralPool,
                totalTickets: ticketStats[0].total_tickets
            }
        });
        
    } catch (error) {
        console.error('Artists API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch artists data'
        });
    }
});

// Get specific artist details
router.get('/:artistName', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM artists WHERE artist_name = ?',
            [req.params.artistName]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Artist not found'
            });
        }
        
        // Get artist's referrals
        const [referrals] = await connection.execute(
            'SELECT buyer_name, university, purchase_date FROM tickets WHERE referral_artist = ? ORDER BY purchase_date DESC',
            [req.params.artistName]
        );
        
        await connection.end();
        
        res.json({
            success: true,
            artist: rows[0],
            referrals: referrals
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch artist data'
        });
    }
});

module.exports = router;