'use strict';

/**
 * Rutas para compras.
 * Montado en /api/compras
 *
 * Permisos requeridos:
 *   GET  → compra.ver       (administrador)
 *   POST → compra.registrar (administrador)
 *
 * No hay PUT ni DELETE: los detalles no se editan (regla 5.5).
 * Si hay un error, se anula la cabecera y se vuelve a registrar.
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const comprasController = require('../controllers/compras.controller');

const router = Router();

router.get('/',           authMiddleware, rbac('compra.ver'),       comprasController.getAll);
router.get('/:id',        authMiddleware, rbac('compra.ver'),       comprasController.getById);
router.post('/',          authMiddleware, rbac('compra.registrar'), comprasController.create);
router.post('/:id/anular',authMiddleware, rbac('compra.registrar'), comprasController.anular);

module.exports = router;
