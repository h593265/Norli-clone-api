const postgres = require('postgres');
require('dotenv').config();
const sql = postgres({
  ssl: { rejectUnauthorized: false },
    host                 : process.env.PG_HOST,            
    port                 : process.env.PG_PORT,          
    database             : process.env.PG_DATABASE,            
    username             : process.env.PG_USERNAME,           
    password             : process.env.PG_PASSWORD,           
   
  })

 


  module.exports = sql;