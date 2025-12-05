const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('📝 Updating categories to match frontend format...\n');
    
    // Update krimboker to boker/krimboker
    const result = await sql`
      UPDATE products 
      SET category = 'boker/krimboker' 
      WHERE category = 'krimboker'
    `;
    
    console.log(`✓ Updated ${result.length} products to 'boker/krimboker'`);
    
    // Verify the update
    const categories = await sql`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category
    `;
    
    console.log('\n✓ Current categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.count} products`);
    });
    
    console.log('\n✓✓✓ Database updated! Frontend should now work.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
