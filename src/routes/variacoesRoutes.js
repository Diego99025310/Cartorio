const express = require('express');
const variacoesPalavrasController = require('../controllers/variacoesPalavrasController');
const { ensureAuthenticated, ensureMaster } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/', ensureMaster, variacoesPalavrasController.store);

module.exports = router;
