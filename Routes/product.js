const sql = require('../db');
const express = require("express");
const router = express.Router();


router.get('/getbycategory', async (req, res) => {
  console.log('🔵 REQUEST RECEIVED: /products/getbycategory');
  console.log('📋 Query params:', req.query);
  
  try {
    const { category, limit = 20, page = 1 } = req.query; 
    const offset = (page - 1) * limit; 

    if (!category) {
      console.log('❌ No category provided');
      return res.status(400).json({ error: 'Category is required' });
    }

    console.log(`🔍 Fetching category: ${category}, limit: ${limit}, page: ${page}`);
    console.log('💾 About to query database...');

    // Set a timeout for the database query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
        console.log('⏱️ Database query TIMEOUT after 25 seconds');
        reject(new Error('Database query timeout'));
      }, 25000)
    );

    const queryPromise = sql`
      SELECT * FROM (
        SELECT * 
        FROM products
        WHERE category = ${category} OR category LIKE ${category + '/%'}
        ORDER BY id
      ) sub
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset};
    `.then(result => {
      console.log('✅ Database query completed');
      return result;
    });

    const products = await Promise.race([queryPromise, timeoutPromise]);

    console.log(`✓ Found ${products.length} products, sending response`);
    res.status(200).json(products);
  } catch (error) {
    console.error('❌ ERROR in /getbycategory:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});


router.get('/getonsale', async (req, res) => {
  try {
   
    const products = await sql`
      SELECT * FROM (
        SELECT * FROM products
        WHERE discount is not NULL
      ) AS onsale`;

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query; 

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    
    const products = await sql`
      SELECT * FROM products
      WHERE LOWER(title) LIKE ${'%' + query.toLowerCase() + '%'}
      OR LOWER(description) LIKE ${'%' + query.toLowerCase() + '%'}
      OR LOWER(category) LIKE ${'%' + query.toLowerCase() + '%'};
    `;

    
  

    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products by search query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;


router.get('/getbyid/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${id};
    `;
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product[0]);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/getbytitle/', async (req, res) => {
  const  {idname}  = req.query;
  
  try {
    const product = await sql`
      SELECT * FROM products WHERE idname = ${idname};
    `;
    if (product.length === 0) {
      
      return res.status(410).json({ error: `Product not found with  ${idname} ` });
    }
    res.status(200).json(product[0]);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/getfive', async (req, res) => {
  try {
    const { category } = req.query;

   
    const products = await sql`
      SELECT * FROM (
        SELECT *,
          ROW_NUMBER() OVER (ORDER BY id) AS row_num
        FROM products
        WHERE SPLIT_PART(category, '/', 1) = ${category} OR category LIKE ${category + '/%'}
      ) sub
      WHERE row_num <= 5
    `;

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Debug endpoint to check what categories exist
router.get('/debug/categories', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Fetching all categories');
    const categories = await sql`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category
    `;
    res.status(200).json({
      totalCategories: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
