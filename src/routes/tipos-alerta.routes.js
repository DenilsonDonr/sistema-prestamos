'use strict';

/**
 * Rutas para el catálogo de tipos de alerta.
 * Montado en /api/catalogos/tipos-alerta
 *
 * Solo lectura — los tipos de alerta son definidos por el sistema,
 * no por el usuario. Crearlos o modificarlos no tiene efecto funcional.
 *
 * Permisos requeridos:
 *   GET → catalogo.ver (administrador, encargado_almacen)
 */

const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const tiposAlertaController = require('../controllers/tipos-alerta.controller');

const router = Router();

router.get('/',    authMiddleware, rbac('catalogo.ver'), tiposAlertaController.getAll);
router.get('/:id', authMiddleware, rbac('catalogo.ver'), tiposAlertaController.getById);

module.exports = router;
