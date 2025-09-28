// Password configuration
const passwords = {
    event: "hiphop",
    performer: "pallasperformer", 
    admin: "mayenziwe"
};

// Global variables
let selectedUniversity = "";
let currentTicketPrice = 30;

// Loading utility functions
function showLoading(button, text = 'Loading...') {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
}

function hideLoading(button) {
    button.textContent = button.dataset.originalText;
    button.disabled = false;
}

// API Base URL
const API_BASE = '/api';

// API Functions
async function purchaseTicket(ticketData) {
    try {
        const response = await fetch('/api/tickets/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ticket purchase error:', error);
        return { success: false, error: 'Network error' };
    }
}

// ⬅️ this line is critical
window.purchaseTicket = purchaseTicket;

console.log("✅ purchaseTicket attached to window");

async function getArtistsData() {
    try {
        const response = await fetch(`${API_BASE}/artists`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Artists data error:', error);
        return { success: false, error: 'Failed to load artists data' };
    }
}

async function getAdminStats(adminPassword) {
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: {
                'admin-password': adminPassword
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Admin stats error:', error);
        return { success: false, error: 'Failed to load admin data' };
    }
}

// Password functionality
document.getElementById('submit-password').addEventListener('click', function() {
    const password = document.getElementById('event-password').value;
    if (password === passwords.event) {
        showSection('landing-page');
    } else {
        alert('Incorrect password. Please try again.');
        document.getElementById('event-password').value = '';
    }
});

document.getElementById('submit-performer').addEventListener('click', function() {
    const password = document.getElementById('performer-password').value;
    if (password === passwords.performer) {
        showSection('artist-dashboard');
        populateArtistList();
    } else {
        alert('Incorrect performer password. Please try again.');
        document.getElementById('performer-password').value = '';
    }
});

document.getElementById('submit-admin').addEventListener('click', function() {
    const password = document.getElementById('admin-password').value;
    if (password === passwords.admin) {
        showSection('admin-panel');
    } else {
        alert('Incorrect admin password. Please try again.');
        document.getElementById('admin-password').value = '';
    }
});

// Show/hide sections
function showSection(sectionId) {
    const sections = ['password-screen', 'landing-page', 'artist-dashboard', 'admin-panel'];
    sections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// Replace the admin tab click handler with this:
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', async function() {
        const targetTab = this.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(targetTab + '-section').classList.add('active');
        
        // Load data when dashboard tab is clicked
        if (targetTab === 'dashboard') {
            await loadAdminDashboard();
        }
    });
});

// New function to load admin dashboard data
async function loadAdminDashboard() {
    try {
        const result = await getAdminStats('mayenziwe');
        
        if (result.success) {
            const stats = result.dashboard;
            
            // Update ticket statistics
            document.getElementById('admin-total-sold').textContent = stats.totalTickets;
            document.getElementById('admin-total-revenue').textContent = `R${stats.totalRevenue}`;
            document.getElementById('admin-capacity').textContent = `${stats.totalTickets}/150 (${stats.capacity.percentage}%)`;
            
            // Update university breakdown
            document.getElementById('uwc-count').textContent = 
                stats.universityBreakdown.find(u => u.university === 'UWC')?.count || 0;
            document.getElementById('cput-count').textContent = 
                stats.universityBreakdown.find(u => u.university === 'CPUT')?.count || 0;
            document.getElementById('uct-count').textContent = 
                stats.universityBreakdown.find(u => u.university === 'UCT')?.count || 0;
            document.getElementById('other-count').textContent = 
                stats.universityBreakdown.find(u => u.university === 'Other')?.count || 0;
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Replace the populateArtistList function with this:
async function populateArtistList() {
    try {
        const result = await getArtistsData();
        
        if (result.success) {
            const container = document.getElementById('artist-list-container');
            container.innerHTML = '';
            
            // Update revenue meter
            const revenue = result.financials.totalRevenue;
            const goal = 10000; // R10,000 goal
            const meterPercentage = Math.min((revenue / goal) * 100, 100);
            document.getElementById('revenue-meter').style.width = `${meterPercentage}%`;
            document.getElementById('current-revenue').textContent = `R${revenue}`;
            document.getElementById('projected-revenue').textContent = `R${result.financials.projectedFinal || revenue * 1.5}`;
            
            // Populate artist cards
            result.artists.forEach(artist => {
                const card = document.createElement('div');
                card.className = 'artist-card';
                card.innerHTML = `
                    <div class="artist-name">${artist.artist_name}</div>
                    <div class="artist-earnings">Projected Earnings: R${artist.projectedEarnings}</div>
                    <div class="artist-referrals">
                        Songs: ${artist.song_count} | Referrals: ${artist.total_referrals}
                        <br>Song Share: ${artist.songPercentage}% | Referral Share: ${artist.referralPercentage}%
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            console.error('Failed to load artists data:', result.error);
        }
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

// Enhanced ticket purchase function with better loading states
document.getElementById('purchase-ticket').addEventListener('click', async function() {
    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const referral = document.getElementById('referral-code').value;
    const agreeTerms = document.getElementById('agree-terms').checked;

    if (!name || !email || !phone || !selectedUniversity || !agreeTerms) {
        alert('Please fill in all fields and agree to the terms and conditions.');
        return;
    }

    const button = this;
    showLoading(button, 'Processing Purchase...');

    try {
        const result = await purchaseTicket({
            name,
            email,
            phone,
            university: selectedUniversity,
            referral: referral || null
        });

        if (result.success) {
            // Show success with ticket details
            document.getElementById('success-modal').style.display = 'flex';
            
            // Reset form
            document.getElementById('full-name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('referral-code').value = '';
            document.getElementById('agree-terms').checked = false;
            document.querySelectorAll('.university-option').forEach(opt => opt.classList.remove('selected'));
            selectedUniversity = '';
        } else {
            alert('Ticket purchase failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error purchasing ticket. Please try again.');
        console.error('Purchase error:', error);
    } finally {
        hideLoading(button);
    }
});

// Access option toggles
document.getElementById('show-performer').addEventListener('click', function() {
    document.getElementById('performer-option').classList.remove('hidden-option');
    document.getElementById('admin-option').classList.add('hidden-option');
});

document.getElementById('show-admin').addEventListener('click', function() {
    document.getElementById('admin-option').classList.remove('hidden-option');
    document.getElementById('performer-option').classList.add('hidden-option');
});

document.getElementById('back-to-main-from-performer').addEventListener('click', function() {
    document.getElementById('performer-option').classList.add('hidden-option');
    document.getElementById('admin-option').classList.add('hidden-option');
});

document.getElementById('back-to-main-from-admin').addEventListener('click', function() {
    document.getElementById('admin-option').classList.add('hidden-option');
    document.getElementById('performer-option').classList.add('hidden-option');
});

// Back to main site buttons
document.getElementById('back-to-main').addEventListener('click', function() {
    showSection('password-screen');
});

document.getElementById('admin-back-to-main').addEventListener('click', function() {
    showSection('password-screen');
});

document.getElementById('admin-login').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('password-screen');
});

// University selection
document.querySelectorAll('.university-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.university-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        selectedUniversity = this.dataset.value;
        document.getElementById('university').value = selectedUniversity;
    });
});

// Modal functionality
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('success-modal').style.display = 'none';
});

document.getElementById('close-performer-modal').addEventListener('click', function() {
    document.getElementById('performer-modal').style.display = 'none';
});

document.getElementById('close-terms').addEventListener('click', function() {
    document.getElementById('terms-modal').style.display = 'none';
});

document.getElementById('show-terms').addEventListener('click', function() {
    document.getElementById('terms-modal').style.display = 'flex';
});

// Newsletter subscription
document.getElementById('subscribe-updates').addEventListener('click', function() {
    const name = document.getElementById('update-name').value;
    const phone = document.getElementById('update-phone').value;

    if (!name || !phone) {
        alert('Please enter your name and phone number.');
        return;
    }

    alert('Thank you! You will receive updates about the event.');
    document.getElementById('update-name').value = '';
    document.getElementById('update-phone').value = '';
});

// Admin actions
document.getElementById('send-broadcast').addEventListener('click', function() {
    const message = document.getElementById('broadcast-message').value;
    if (!message) {
        alert('Please enter a message to send.');
        return;
    }
    alert('Broadcast message sent to all ticket holders!');
    document.getElementById('broadcast-message').value = '';
});

document.getElementById('add-artist').addEventListener('click', function() {
    const name = document.getElementById('artist-name').value;
    const songs = document.getElementById('artist-songs').value;

    if (!name || !songs) {
        alert('Please enter artist name and number of songs.');
        return;
    }

    alert(`Artist "${name}" added with ${songs} songs!`);
    document.getElementById('artist-name').value = '';
    document.getElementById('artist-songs').value = '';
});

document.getElementById('send-mass-message').addEventListener('click', function() {
    const message = document.getElementById('mass-message').value;
    const type = document.getElementById('message-type').value;

    if (!message) {
        alert('Please enter a message to send.');
        return;
    }

    alert(`${type} message sent successfully!`);
    document.getElementById('mass-message').value = '';
});

document.getElementById('update-financials').addEventListener('click', function() {
    alert('Financial settings updated successfully!');
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});

// Handle Enter key for password inputs
document.getElementById('event-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('submit-password').click();
    }
});

document.getElementById('performer-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('submit-performer').click();
    }
});

document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('submit-admin').click();
    }
});

// Update current price display
function updateTicketPrice() {
    const currentDate = new Date();
    const phase1End = new Date('2023-09-28');
    const phase2End = new Date('2023-10-04');

    if (currentDate <= phase1End) {
        currentTicketPrice = 30;
    } else if (currentDate <= phase2End) {
        currentTicketPrice = 50;
    } else {
        currentTicketPrice = 70;
    }

    document.getElementById('current-price').textContent = 'R' + currentTicketPrice;
}

// Initialize price on load
updateTicketPrice();

// Smooth scrolling for ticket link
document.querySelector('a[href="#tickets"]').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
});

// Auto-refresh functionality
function startAutoRefresh() {
    // Refresh artist data every 30 seconds
    setInterval(async () => {
        if (!document.getElementById('artist-dashboard').classList.contains('hidden')) {
            await populateArtistList();
        }
    }, 30000);
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    startAutoRefresh();
});