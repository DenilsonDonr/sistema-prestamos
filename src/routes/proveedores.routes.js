'use strict';

/**
 * Rutas para proveedores.
 * Montado en /api/proveedores
 *
 * Permisos requeridos:
 *   GET              → compra.ver       (administrador)
 *   POST / PUT / DEL → compra.registrar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const proveedoresController = require('../controllers/proveedores.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('compra.ver'),       proveedoresController.getAll);
router.get('/:id',    authMiddleware, rbac('compra.ver'),       proveedoresController.getById);
router.post('/',      authMiddleware, rbac('compra.registrar'), proveedoresController.create);
router.put('/:id',    authMiddleware, rbac('compra.registrar'), proveedoresController.update);
router.delete('/:id', authMiddleware, rbac('compra.registrar'), proveedoresController.remove);

module.exports = router;
