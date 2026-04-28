'use strict';

const express = require('express');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API (se montan aquí a medida que se implementan)

// 404 para /api — debe ir ANTES del catch-all SPA
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
});

// Catch-all: entrega index.html al router del cliente
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

module.exports = app;
