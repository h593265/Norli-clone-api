const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔌 Connecting to Neon database...');
    const result = await sql`SELECT NOW() as current_time, COUNT(*) as product_count FROM products`;
    console.log('✓ Database connected and active!');
    console.log(`Server time: ${result[0].current_time}`);
    console.log(`Total products: ${result[0].product_count}`);
    
    // Now check the category
    const categoryCheck = await sql`SELECT DISTINCT category FROM products LIMIT 5`;
    console.log('\nCategories in database:');
    categoryCheck.forEach(row => console.log(`  - ${row.category}`));
    
    console.log('\n✓ Database is now active for ~5 minutes');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
