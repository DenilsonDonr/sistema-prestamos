'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/usuarios.controller');

const router = Router();

// Público
router.get('/check-username/:username', ctrl.checkUsername);

// Protegidas
router.get('/', auth, rbac('usuario.ver'), ctrl.list);
router.get('/:id', auth, rbac('usuario.ver'), ctrl.getById);
router.post('/', auth, rbac('usuario.crear'), ctrl.create);
router.put('/:id', auth, rbac('usuario.editar'), ctrl.update);
router.delete('/:id', auth, rbac('usuario.eliminar'), ctrl.deactivate);
router.patch('/:id/activate', auth, rbac('usuario.editar'), ctrl.activate);

module.exports = router;