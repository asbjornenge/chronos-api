const { Pool } = require('pg')

let pool = new Pool({
  host:     process.env['DB_HOST'] || '127.0.0.1',
  port:     process.env['DB_PORT'] || 5432,
  user:     process.env['DB_USER'] || 'chronos',
  password: process.env['DB_PASS'] || 'chronos',
  database: process.env['DB_NAME'] || 'chronos'
})

pool.on("error", async (e) => {
  console.log("Error in communication with the PG")
  throw e
})

module.exports.getClient = function() {
  return pool
}