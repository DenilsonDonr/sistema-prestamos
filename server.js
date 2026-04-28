'use strict';

const env = require('./src/config/env');
const db = require('./src/config/db');
const app = require('./src/app');

async function start() {
  try {
    const conn = await db.getConnection();
    conn.release();
    console.log('[db] Pool conectado correctamente');

    app.listen(env.port, () => {
      console.log(`[server] Corriendo en http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[db] No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
}

start();
