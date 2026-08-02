// routes/likesRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { validateLike } = require('../middleware/validators');
const likesController = require('../controllers/likesController');

router.get('/', optionalAuth, likesController.getAllLikes);

router.get('/count/:menuItemId', optionalAuth, likesController.getLikeCount);

router.get('/check/:menuItemId', verifyToken, checkRole('Customer'), likesController.checkIfLiked);

router.get('/:id', optionalAuth, likesController.getLikeById);

router.post('/', verifyToken, checkRole('Customer'), validateLike, likesController.createLike);

router.delete('/:id', verifyToken, checkRole('Customer'), likesController.deleteLike);

module.exports = router;
