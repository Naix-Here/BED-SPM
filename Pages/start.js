/* ==========================================================================
   start.js — Combined entry point (existing app + my features)
   Run with: node start.js
   Adds /api/orders and /api/vendor routes alongside existing /api/auth and /api/patron.
   ========================================================================== */
require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const patronRoutes = require('./routes/patronRoutes');
const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const vendorManagementRoutes = require('./routes/vendorManagementRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.get('/Js/patron.js', (req, res) => res.sendFile(path.join(__dirname, 'db', 'Js', 'patron.js')));
app.get('/Js/vendor.js', (req, res) => res.sendFile(path.join(__dirname, 'db', 'Js', 'vendor.js')));
app.use(express.static(path.join(__dirname)));
app.use('/api/auth', authRoutes);
app.use('/api/patron', patronRoutes);
app.use('/api/orders', orderHistoryRoutes);
app.use('/api/vendor', vendorManagementRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`HawkerHub is running at http://localhost:${port}`));
