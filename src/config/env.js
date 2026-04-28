'use strict';

require('dotenv').config();

const REQUIRED = [
  'PORT',
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`[env] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV,
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
};
