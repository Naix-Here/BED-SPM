// routes/index.js — Aggregates ALL API routes (auth + stubs for parallel agents).
const express = require('express');
const router = express.Router();

// Team
const authRoutes = require('./authRoutes');

// Member 1
const feedbackRoutes = require('./feedbackRoutes');
const likesRoutes = require('./likesRoutes');
const complaintRoutes = require('./complaintRoutes');
const queueRoutes = require('./queueRoutes');
const notificationRoutes = require('./notificationRoutes');
const inspectionRoutes = require('./inspectionRoutes');
const hygieneGradeRoutes = require('./hygieneGradeRoutes');
const promotionRoutes = require('./promotionRoutes');

// Member 2
const stallRoutes = require('./stallRoutes');
const menuItemRoutes = require('./menuItemRoutes');
const menuItemCuisineRoutes = require('./menuItemCuisineRoutes');
const rentalAgreementRoutes = require('./rentalAgreementRoutes');
const orderRoutes = require('./orderRoutes');
const orderItemRoutes = require('./orderItemRoutes');

// Member 3
const customerProfileRoutes = require('./customerProfileRoutes');
const vendorProfileRoutes = require('./vendorProfileRoutes');
const cartRoutes = require('./cartRoutes');
const cartItemRoutes = require('./cartItemRoutes');
const orderStatusLogRoutes = require('./orderStatusLogRoutes');

// Mount
router.use('/auth', authRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/likes', likesRoutes);
router.use('/complaints', complaintRoutes);
router.use('/queue', queueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/hygiene-grades', hygieneGradeRoutes);
router.use('/promotions', promotionRoutes);
router.use('/stalls', stallRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/menu-item-cuisines', menuItemCuisineRoutes);
router.use('/rental-agreements', rentalAgreementRoutes);
router.use('/orders', orderRoutes);
router.use('/order-items', orderItemRoutes);
router.use('/customer-profile', customerProfileRoutes);
router.use('/vendor-profile', vendorProfileRoutes);
router.use('/cart', cartRoutes);
router.use('/cart-items', cartItemRoutes);
router.use('/order-status-logs', orderStatusLogRoutes);

module.exports = router;
