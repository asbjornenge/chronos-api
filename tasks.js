const { json, send } = require('micro')
const utils = require('./utils')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let raw = await client.query(`select * from tasks`)
  send(res, 200, raw.rows)
  await client.end()
}
