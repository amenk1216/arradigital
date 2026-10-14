/**
 * Database Seed Script for ARRA DIGITAL
 * Run via: npm run seed
 */
const db = require('../server/db');

console.log('--- ARRA DIGITAL DATABASE STATUS ---');
console.log('Public Settings:', db.getPublicSettings());
console.log('Total Products:', db.getAllProductsAdmin().length);
console.log('Total Published Content:', db.getAllPublishedContent().length);
console.log('Dashboard Metrics:', db.getDashboardMetrics());
console.log('Database initialized successfully at data/arra_digital.db');
