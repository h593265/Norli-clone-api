const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Source: Neon
const neonUrl = process.env.DATABASE_URL;
const neonSql = neon(neonUrl);

// Destination: Render PostgreSQL
const renderUrl = 'postgresql://norlidb:vQyRK1MzeBlKgfnch4x5SljlusopLbpL@dpg-d4pbq91r0fns739bcepg-a.frankfurt-postgres.render.com/norlidb';
const renderSql = neon(renderUrl);

(async () => {
  try {
    console.log('🚀 Starting migration from Neon to Render PostgreSQL...\n');
    
    // Step 1: Create tables in Render
    console.log('📋 Creating tables in Render...');
    
    await renderSql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Users table created');
    
    await renderSql`
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
    `;
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
        await renderSql`
          INSERT INTO products (title, description, price, category, image_url, discount, stock)
          VALUES (
            ${product.title},
            ${product.description},
            ${product.price},
            ${product.category},
            ${product.image_url},
            ${product.discount},
            ${product.stock || 0}
          )
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(`✓ Inserted ${products.length} products`);
    }
    
    if (users.length > 0) {
      for (const user of users) {
        await renderSql`
          INSERT INTO users (username, password, email)
          VALUES (
            ${user.username},
            ${user.password},
            ${user.email}
          )
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(`✓ Inserted ${users.length} users`);
    }
    
    // Step 4: Verify migration
    console.log('\n✅ Verifying migration...');
    const renderProducts = await renderSql`SELECT COUNT(*) as count FROM products`;
    const renderUsers = await renderSql`SELECT COUNT(*) as count FROM users`;
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Products: ${renderProducts[0].count}`);
    console.log(`   Users: ${renderUsers[0].count}`);
    
    // Test category
    const testCategory = await renderSql`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category
    `;
    console.log(`\n📁 Categories:`);
    testCategory.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} products`);
    });
    
    console.log('\n✓✓✓ Migration completed successfully! ✓✓✓');
    console.log('\n📝 Next steps:');
    console.log('   1. Update DATABASE_URL in Render dashboard');
    console.log('   2. Redeploy your service');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  }
})();
