import { readFile } from 'node:fs/promises';
import { database } from '../server/analytics-db.js';
const sql = database();
const schema = await readFile(new URL('../database/analytics.sql', import.meta.url), 'utf8');
const statements = schema.replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
await sql.transaction(statements.map(statement => sql.query(statement)));
console.log('Tabela e índices do analytics preparados.');
