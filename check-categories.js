const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔍 Checking current categories...\n');
    
    const categories = await sql`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category
    `;
    
    console.log('Current categories in database:');
    categories.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.count} products`);
    });
    
    console.log('\n📝 If frontend expects hierarchical categories like "boker/krimboker",');
    console.log('   you need to update the database. Let me know what format you need!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
