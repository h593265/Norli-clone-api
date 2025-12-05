const { neon } = require('@neondatabase/serverless');
const { Client } = require('pg');
require('dotenv').config();

// Source: Neon
const neonUrl = process.env.DATABASE_URL;
const neonSql = neon(neonUrl);

// Destination: Render PostgreSQL
const renderClient = new Client({
  connectionString: 'postgresql://norlidb:vQyRK1MzeBlKgfnch4x5SljlusopLbpL@dpg-d4pbq91r0fns739bcepg-a.frankfurt-postgres.render.com/norlidb',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🚀 Starting migration from Neon to Render PostgreSQL...\n');
    
    // Connect to Render
    console.log('🔌 Connecting to Render PostgreSQL...');
    await renderClient.connect();
    console.log('✓ Connected to Render\n');
    
    // Step 1: Create tables in Render
    console.log('📋 Creating tables in Render...');
    
    await renderClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');
    
    await renderClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(255),
        image_url TEXT,
        discount DECIMAL(5, 2),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Products table created');
    
    // Step 2: Fetch data from Neon
    console.log('\n📥 Fetching data from Neon...');
    const products = await neonSql`SELECT * FROM products ORDER BY id`;
    console.log(`✓ Found ${products.length} products`);
    
    const users = await neonSql`SELECT * FROM users ORDER BY id`;
    console.log(`✓ Found ${users.length} users`);
    
    // Step 3: Insert data into Render
    console.log('\n📤 Inserting data into Render PostgreSQL...');
    
    if (products.length > 0) {
      for (const product of products) {
        await renderClient.query(
          `INSERT INTO products (title, description, price, category, image_url, discount, stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [
            product.title,
            product.description,
            product.price,
            product.category,
            product.image_url,
            product.discount,
            product.stock || 0
          ]
        );
      }
      console.log(`✓ Inserted ${products.length} products`);
    }
    
    if (users.length > 0) {
      for (const user of users) {
        await renderClient.query(
          `INSERT INTO users (username, password, email)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [user.username, user.password, user.email]
        );
      }
      console.log(`✓ Inserted ${users.length} users`);
    }
    
    // Step 4: Verify migration
    console.log('\n✅ Verifying migration...');
    const productCount = await renderClient.query('SELECT COUNT(*) as count FROM products');
    const userCount = await renderClient.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Products: ${productCount.rows[0].count}`);
    console.log(`   Users: ${userCount.rows[0].count}`);
    
    // Test category
    const categories = await renderClient.query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category
      ORDER BY category
    `);
    console.log(`\n📁 Categories:`);
    categories.rows.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} products`);
    });
    
    console.log('\n✓✓✓ Migration completed successfully! ✓✓✓');
    console.log('\n📝 Next steps:');
    console.log('   1. Update DATABASE_URL in Render dashboard to:');
    console.log('      postgresql://norlidb:vQyRK1MzeBlKgfnch4x5SljlusopLbpL@dpg-d4pbq91r0fns739bcepg-a.frankfurt-postgres.render.com/norlidb');
    console.log('   2. Service will auto-redeploy');
    console.log('   3. Test the API!');
    
    await renderClient.end();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await renderClient.end();
  }
})();
