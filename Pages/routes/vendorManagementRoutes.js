// routes/vendorManagementRoutes.js — Vendor management routes
const router = require('express').Router(); const ctrl = require('../controllers/vendorManagementController'); const { requireLogin } = require('../middleware/authMiddleware');

// Menu items (public read, protected write)
router.get('/menu-items', ctrl.getMenuItems);
router.get('/menu-items/popular', ctrl.getPopularItems);
router.get('/menu-items/:itemId', ctrl.getMenuItemById);
router.post('/menu-items', requireLogin, ctrl.createMenuItem);
router.put('/menu-items/:itemId', requireLogin, ctrl.updateMenuItem);
router.delete('/menu-items/:itemId', requireLogin, ctrl.deleteMenuItem);
router.post('/menu-items/:itemId/like', requireLogin, ctrl.toggleLike);

// Stalls
router.get('/stalls', requireLogin, ctrl.getMyStalls);
router.get('/stalls/:stallId/dashboard', requireLogin, ctrl.getStallDashboard);
router.get('/stalls/:stallId', ctrl.getStallById);
router.put('/stalls/:stallId', requireLogin, ctrl.updateStall);

// Rental agreements
router.get('/rental-agreements/upcoming-expiries', requireLogin, ctrl.getUpcomingExpiries);
router.get('/rental-agreements', requireLogin, ctrl.getRentalAgreements);
router.get('/rental-agreements/:agreementId', requireLogin, ctrl.getRentalAgreementById);
router.post('/rental-agreements', requireLogin, ctrl.createRentalAgreement);
router.put('/rental-agreements/:agreementId', requireLogin, ctrl.updateRentalAgreement);
router.delete('/rental-agreements/:agreementId', requireLogin, ctrl.deleteRentalAgreement);

module.exports = router;
