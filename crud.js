var pg = require('pg')
var builder = require('mongo-sql')

module.exports.get = async function get(client, table, criteria, helpers={}) {
  var query = builder.sql(Object.assign({
    type: 'select',
    table: table,
    where: criteria
  }, helpers))
  return await client.query(query.toString(), query.values)
}

module.exports.post = async function (client, table, object) {
  var query = builder.sql({
    type: 'insert',
    table: table,
    values: object
  })
	return await client.query(query.toString() + ' RETURNING *', query.values)
}

module.exports.put = async function (client, table, values, criteria) {
  var query = builder.sql({
    type: 'update',
    table: table,
    updates: values,
    where: criteria 
  })
  return await client.query(query.toString() + 'RETURNING *', query.values)
}

module.exports.delete = async function (client, table, criteria) {
  var query = builder.sql({
    type: 'delete',
    table: table,
    where: criteria
  })
  return await client.query(query.toString(), query.values)
}
