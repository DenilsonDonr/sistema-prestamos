'use strict';

const env = require('./src/config/env');
const db = require('./src/config/db');
const app = require('./src/app');
const bootstrap = require('./scripts/bootstrap');

async function start() {
  try {
    const conn = await db.getConnection();
    conn.release();
    console.log('[db] Pool conectado correctamente');

    await bootstrap();

    app.listen(env.port, () => {
      console.log(`[server] Corriendo en http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[startup] Error al inicializar el servidor:', err.message);
    process.exit(1);
  }
}

start();