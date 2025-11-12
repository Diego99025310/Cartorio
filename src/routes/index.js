const express = require('express');
const authRoutes = require('./authRoutes');
const escrituraRoutes = require('./escrituraRoutes');
const clausulaRoutes = require('./clausulaRoutes');
const declaracaoRoutes = require('./declaracaoRoutes');
const homeController = require('../controllers/homeController');
const declaracaoDinamicaController = require('../controllers/declaracaoDinamicaController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authRoutes);
router.get('/', ensureAuthenticated, homeController.dashboard);
router.use('/escrituras', escrituraRoutes);
router.use('/clausulas', clausulaRoutes);
router.use('/declaracoes', declaracaoRoutes);
router.post(
  '/api/testar-declaracao',
  ensureAuthenticated,
  declaracaoDinamicaController.testarDeclaracao
);

module.exports = router;
