const router = require('express').Router(); const controller = require('../controllers/authController'); const { requireLogin } = require('../middleware/authMiddleware');
router.post('/login', controller.login); router.post('/register', controller.register); router.get('/google', controller.googleLogin); router.get('/google/callback', controller.googleCallback); router.post('/google/complete-signup', controller.completeGoogleSignup); router.post('/logout', requireLogin, controller.logout); router.get('/me', requireLogin, controller.me);
module.exports = router;
