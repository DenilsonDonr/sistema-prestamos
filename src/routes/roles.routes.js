'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const ctrl = require('../controllers/roles.controller');

const router = Router();

router.get('/', auth, rbac('usuario.ver'), ctrl.list);

module.exports = router;
