// routes/vendorManagementRoutes.js — Vendor management routes
const router = require('express').Router(); const ctrl = require('../controllers/vendorManagementController'); const { requireLogin, requireVendor } = require('../middleware/authMiddleware');

// Menu items (public read, protected write)
router.get('/menu-items', ctrl.getMenuItems);
router.get('/menu-items/popular', ctrl.getPopularItems);
router.get('/menu-items/:itemId', ctrl.getMenuItemById);
router.post('/menu-items', requireLogin, requireVendor, ctrl.createMenuItem);
router.put('/menu-items/:itemId', requireLogin, requireVendor, ctrl.updateMenuItem);
router.delete('/menu-items/:itemId', requireLogin, requireVendor, ctrl.deleteMenuItem);
router.post('/menu-items/:itemId/like', requireLogin, ctrl.toggleLike);

// Stalls
router.get('/stalls', requireLogin, requireVendor, ctrl.getMyStalls);
router.get('/stalls/:stallId/dashboard', requireLogin, requireVendor, ctrl.getStallDashboard);
router.get('/stalls/:stallId', ctrl.getStallById);
router.put('/stalls/:stallId', requireLogin, requireVendor, ctrl.updateStall);

// Rental agreements
router.get('/rental-agreements/upcoming-expiries', requireLogin, requireVendor, ctrl.getUpcomingExpiries);
router.get('/rental-agreements', requireLogin, requireVendor, ctrl.getRentalAgreements);
router.get('/rental-agreements/:agreementId', requireLogin, requireVendor, ctrl.getRentalAgreementById);
router.post('/rental-agreements', requireLogin, requireVendor, ctrl.createRentalAgreement);
router.put('/rental-agreements/:agreementId', requireLogin, requireVendor, ctrl.updateRentalAgreement);
router.delete('/rental-agreements/:agreementId', requireLogin, requireVendor, ctrl.deleteRentalAgreement);

module.exports = router;
