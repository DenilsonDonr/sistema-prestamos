'use strict';

const db = require('../config/db');

async function listRoles() {
  const [rows] = await db.query(
    'SELECT id, nombre, descripcion FROM roles ORDER BY id'
  );
  return rows;
}

module.exports = { listRoles };
