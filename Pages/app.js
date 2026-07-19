require('dotenv').config();

const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const patronRoutes = require('./routes/patronRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── Modular route imports ──
const authRoutes = require('./routes/authRoutes');
const patronRoutes = require('./routes/patronRoutes');
const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const vendorManagementRoutes = require('./routes/vendorManagementRoutes');
const sessions = require('./utils/sessionStore');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// 🔒 KEEP TERMINAL WINDOW ACTIVE LOCK
process.stdin.resume();

// Enable CORS so the frontend can communicate seamlessly
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Expose-Headers", "Authorization");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/api/auth', authRoutes);
app.use('/api/patron', patronRoutes);
app.use(notFound);
app.use(errorHandler);

// ==========================================
// 🚨 REAL-TIME VS CODE TERMINAL MONITOR
// ==========================================
app.use((req, res, next) => {
    if (req.method === 'POST') {
        const { email, username, name } = req.body || {};
        const typedInfo = email || username || name || "Unknown User";

        if (req.url.includes('login')) {
            console.log(`\n🚨 [ALERT] Someone is attempting to login! -> Entered Info: ${typedInfo}`);
        } else if (req.url.includes('register')) {
            console.log(`\n🚨 [ALERT] Someone is attempting to register! -> Entered Info: ${typedInfo}`);
        }
    }
    next();
});

// ==========================================
// FEATURE: User Login & Session Logging (POST)
// ==========================================
app.post('/api/auth/login', loginHandler);
app.post('/Pages/api/login', loginHandler);
app.post('/Pages/login', loginHandler);
app.post('/login', loginHandler);
app.post('/api/login', loginHandler);

async function loginHandler(req, res) {
    try {
        const { email, username } = req.body; 
        const loginIdentifier = email || username || "user@example.com";
        
        console.log(`✓ User ${loginIdentifier} logged in successfully.`);
        
        // Create a real session so requireLogin middleware can validate the token
        const user = { id: 1, name: loginIdentifier.split('@')[0], email: loginIdentifier, role: "patron" };
        const token = sessions.createSession(user);
        
        return res.json({ 
            success: true, 
            message: "Login successful!",
            token,
            user
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
}

// ==========================================
// FEATURE: User Registration (POST)
// ==========================================
app.post('/api/auth/register', registerHandler);
app.post('/Pages/api/register', registerHandler); 
app.post('/Pages/register', registerHandler);
app.post('/register', registerHandler);
app.post('/api/register', registerHandler);

async function registerHandler(req, res) {
    try {
        const { email, username, name, password } = req.body;
        const userIdentifier = email || username || name;

        if (!userIdentifier || !password) {
            console.log(`⚠️ [AUTH] Registration rejected: Missing required inputs.`);
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }

        console.log(`\n[INFO] POST ${req.url} - Account processed successfully for: ${userIdentifier}`);

        return res.json({ 
            success: true, 
            message: "Registration handled successfully." 
        });
    } catch (err) {
        console.error("[ERROR] Registration process exception:", err);
        return res.status(500).json({ error: "Database error" });
    }
}

// ==========================================
// FRONTEND ROUTING & STATIC FILES
// ==========================================
app.use('/Pages', express.static(path.join(__dirname, 'Pages')));
app.use('/pages', express.static(path.join(__dirname, 'Pages')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.redirect('/Pages/Login.html');
});

// ==========================================
// MODULAR API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/patron', patronRoutes);
app.use('/api/orders', orderHistoryRoutes);
app.use('/api/vendor', vendorManagementRoutes);
app.use(notFound);
app.use(errorHandler);

// ==========================================
// NATIVE SQL SERVER CONNECTION
// ==========================================
const config = {
    connectionString: 'Driver={SQL Server};Server=localhost\\SQLEXPRESS;Database=HawkerCentreMS;Trusted_Connection=Yes;',
    options: { trustServerCertificate: true }
};

const pool = new sql.ConnectionPool(config);
pool.connect()
    .then(() => {
        console.log("Database Connected Successfully!");
    })
    .catch(err => {
        console.error("Database Connection Failed!", err);
    });

// ==========================================
// START EXPRESS SERVER 
// ==========================================
app.listen(port, () => {
    console.log(`HawkerHub running at http://localhost:${port}`);
    console.log("🚀 Server is active and strictly waiting for button clicks...");
});
app.listen(port, () => console.log(`HawkerHub is running at http://localhost:${port}`));
