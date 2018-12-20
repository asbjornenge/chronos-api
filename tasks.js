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
  payload.paused = true
  payload.created = new Date()
  payload.updated = new Date()
  let raw = await crud.post(client, 'tasks', payload)
  send(res, 200, raw.rows[0])
  await client.end()
}

module.exports.put = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let payload = await json(req)
  if (!payload.criteria || Object.keys(payload.criteria).length === 0) 
    return send(res, 400, 'Missing required criteria')
  payload.values.updated = new Date()
  let raw = await crud.put(client, 'tasks', payload.values, payload.criteria)
  send(res, 200, raw.rows.length === 1 ? raw.rows[0] : raw.rows)
  await client.end()
}

module.exports.del = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  if (Object.keys(req.query).length === 0) 
    return send(res, 400, 'Missing required criteria')
  let raw = await crud.delete(client, 'tasks', req.query)
  send(res, 200)
  await client.end()
}
