const express = require('express');
const escrituraController = require('../controllers/escrituraController');
const { ensureAuthenticated, ensureMaster } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', escrituraController.list);
router.post('/', ensureMaster, escrituraController.create);
router.get('/:id/edit', ensureMaster, escrituraController.edit);
router.put('/:id', ensureMaster, escrituraController.update);
router.delete('/:id', ensureMaster, escrituraController.remove);

module.exports = router;
