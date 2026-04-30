'use strict';

const express = require('express');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API (se montan aquí a medida que se implementan)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/catalogos/marcas', require('./routes/marcas.routes'));
app.use('/api/catalogos/modelos', require('./routes/modelos.routes'));
app.use('/api/catalogos/areas', require('./routes/areas.routes'));
app.use('/api/catalogos/turnos', require('./routes/turnos.routes'));
app.use('/api/catalogos/cargos', require('./routes/cargos.routes'));
app.use('/api/catalogos/tipos-herramienta', require('./routes/tipos-herramienta.routes'));
app.use('/api/catalogos/ubicaciones', require('./routes/ubicaciones.routes'));
app.use('/api/catalogos/estados-herramienta', require('./routes/estados-herramienta.routes'));
app.use('/api/catalogos/motivos-baja', require('./routes/motivos-baja.routes'));
app.use('/api/catalogos/tipos-alerta', require('./routes/tipos-alerta.routes'));

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
