const { neon } = require('@neondatabase/serverless');
const { Pool } = require('pg');
require('dotenv').config();

// Check if using Render PostgreSQL or Neon
const isRenderPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com');

let sql;

if (isRenderPostgres) {
  // Use standard pg library for Render PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Wrapper to match Neon's tagged template syntax
  sql = async (strings, ...values) => {
    const query = strings.reduce((acc, str, i) => {
      return acc + str + (values[i] !== undefined ? `$${i + 1}` : '');
    }, '');
    
    const result = await pool.query(query, values);
    return result.rows;
  };
} else {
  // Use Neon driver for Neon database
  // COMPLETELY disable all caching - deployed at 2025-12-06
  sql = neon(process.env.DATABASE_URL, {
    fetchConnectionCache: false,
    fullResults: false,
    arrayMode: false,
    fetchOptions: {
      cache: 'no-store'
    }
  });
}

module.exports = sql;