const { Client } = require('pg')

module.exports.getClient = function() {
  return new Client({
    host:     process.env['DB_HOST'] || '192.168.68.110',
    port:     process.env['DB_PORT'] || 5432,
    user:     process.env['DB_USER'] || 'chronos',
    password: process.env['DB_PASS'] || 'chronos',
    database: process.env['DB_NAME'] || 'chronos'
  })
}
