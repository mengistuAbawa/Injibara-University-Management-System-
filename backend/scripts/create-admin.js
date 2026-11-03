const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local'), override: false });

const bcrypt = require('bcryptjs');
const db = require('../config/db');

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function required(name, argumentName = name) {
  const value = readArgument(argumentName) || process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing --${argumentName}.`);
  }
  return String(value).trim();
}

async function main() {
  try {
    const username = required('ADMIN_USERNAME', 'username').toUpperCase();
    const email = required('ADMIN_EMAIL', 'email').toLowerCase();
    const password = required('ADMIN_PASSWORD', 'password');
    const firstName = readArgument('first-name') || process.env.ADMIN_FIRST_NAME || 'System';
    const lastName = readArgument('last-name') || process.env.ADMIN_LAST_NAME || 'Administrator';

    if (password.length < 8) {
      throw new Error('Admin password must be at least 8 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.query(
      `INSERT INTO users (username, first_name, last_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         password_hash = EXCLUDED.password_hash,
         role = 'admin',
         is_active = TRUE`,
      [username, firstName, lastName, email, passwordHash]
    );

    console.log(`Admin account ready: ${username} (${email})`);
  } catch (error) {
    console.error(`Unable to create admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
