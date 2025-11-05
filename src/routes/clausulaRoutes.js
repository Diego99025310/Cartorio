const express = require('express');
const clausulaController = require('../controllers/clausulaController');
const { ensureAuthenticated, ensureMaster } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', clausulaController.list);
router.post('/', ensureMaster, clausulaController.create);
router.get('/:id/edit', ensureMaster, clausulaController.edit);
router.put('/:id', ensureMaster, clausulaController.update);
router.delete('/:id', ensureMaster, clausulaController.remove);

module.exports = router;
