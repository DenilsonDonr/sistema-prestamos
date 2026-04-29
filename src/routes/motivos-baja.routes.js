'use strict';

/**
 * Rutas para el catálogo de motivos de baja.
 * Montado en /api/catalogos/motivos-baja
 *
 * Permisos requeridos:
 *   GET              → catalogo.ver       (administrador, encargado_almacen)
 *   POST / PUT / DEL → catalogo.gestionar (administrador)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const motivosBajaController = require('../controllers/motivos-baja.controller');

const router = Router();

router.get('/',       authMiddleware, rbac('catalogo.ver'),       motivosBajaController.getAll);
router.get('/:id',    authMiddleware, rbac('catalogo.ver'),       motivosBajaController.getById);
router.post('/',      authMiddleware, rbac('catalogo.gestionar'), motivosBajaController.create);
router.put('/:id',    authMiddleware, rbac('catalogo.gestionar'), motivosBajaController.update);
router.delete('/:id', authMiddleware, rbac('catalogo.gestionar'), motivosBajaController.remove);

module.exports = router;
