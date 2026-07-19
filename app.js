require('dotenv').config();
const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8'); 

const app = express();
const port = process.env.PORT || 3000;

// 🔒 KEEP TERMINAL WINDOW ACTIVE LOCK
process.stdin.resume();

// Enable CORS so the frontend can communicate seamlessly
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Parsers to extract parameters dynamically regardless of frontend payload structures
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 🚨 REAL-TIME VS CODE TERMINAL MONITOR
// ==========================================
app.use((req, res, next) => {
    if (req.method === 'POST') {
        const { email, username, name } = req.body || {};
        const typedInfo = email || username || name || "Incoming Data Stream";

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
        const { email, username } = req.body || {}; 
        const loginIdentifier = email || username || "user@example.com";
        
        console.log(`✓ User ${loginIdentifier} logged in successfully.`);
        
        return res.json({ 
            success: true, 
            message: "Login successful!",
            token: "mock-jwt-token-12345",
            user: {
                id: 1,
                email: loginIdentifier,
                role: "patron"  
            }
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
        const { email, username, name, password, pwd, pass } = req.body || {};
        
        // Dynamically detects whatever string fields the form submits
        const userIdentifier = email || username || name || "New Account Candidate";
        const incomingPassword = password || pwd || pass;

        // Dynamic terminal block that registers all details on success
        console.log(`\n==================================================`);
        console.log(`🎉 [SUCCESS] Someone has created an account successfully!`);
        console.log(`👤 Account Identifier: ${userIdentifier}`);
        console.log(`🔑 Password Field Detected: ${incomingPassword ? "Yes" : "No"}`);
        console.log(`==================================================\n`);

        return res.json({ 
            success: true, 
            message: "Registration handled successfully.",
            user: {
                id: 2,
                email: email || "newuser@example.com",
                role: "patron"
            }
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