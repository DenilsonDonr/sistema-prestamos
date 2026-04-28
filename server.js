'use strict';

const env = require('./src/config/env');
const express = require('express');
const path = require('path');
const db = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API (se montan aquí a medida que se implementan)
// app.use('/api/auth', require('./src/routes/auth.routes'));

// 404 para /api — debe ir ANTES del catch-all SPA
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
});

// Catch-all: entrega index.html al router del cliente
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

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
