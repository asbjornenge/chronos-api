const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let raw = await crud.get(client, 'tasks')
  send(res, 200, raw.rows)
  await client.end()
}

module.exports.post = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let payload = await json(req)
  payload.created = new Date()
  payload.updated = new Date()
  let raw = await crud.post(client, 'tasks', payload)
  send(res, 200, raw.rows)
  await client.end()
}
