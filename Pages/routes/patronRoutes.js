const router = require('express').Router(); const controller = require('../controllers/patronController'); const { requireLogin, requirePatron } = require('../middleware/authMiddleware');
router.use(requireLogin, requirePatron); router.get('/products', controller.listProducts); router.get('/cart', controller.getCart); router.post('/cart', controller.addToCart); router.patch('/cart/:id', controller.updateCart); router.post('/orders', controller.submitOrder); router.get('/orders', controller.listOrders);
module.exports = router;
