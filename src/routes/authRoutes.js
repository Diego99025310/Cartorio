const express = require('express');
const authController = require('../controllers/authController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', ensureAuthenticated, authController.logout);

module.exports = router;
