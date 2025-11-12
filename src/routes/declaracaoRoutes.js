const express = require('express');
const declaracaoController = require('../controllers/declaracaoController');
const { ensureAuthenticated, ensureMaster } = require('../middlewares/authMiddleware');
const csvUploadMiddleware = require('../middlewares/csvUploadMiddleware');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', declaracaoController.list);
router.post('/', ensureMaster, declaracaoController.create);
router.get('/:id/edit', ensureMaster, declaracaoController.edit);
router.put('/:id', ensureMaster, declaracaoController.update);
router.delete('/:id', ensureMaster, declaracaoController.remove);
router.post(
  '/importar-variacoes',
  ensureMaster,
  csvUploadMiddleware,
  declaracaoController.importarVariacoesCsv
);

module.exports = router;
