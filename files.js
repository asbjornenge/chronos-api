const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')
const fs = require('fs')

module.exports.get = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/secrets'
  let files = fs.readdirSync(folder)
  send(res, 200, files)
}

// module.exports.post = async function(req, res) {
//   let client = utils.getClient()
//   await client.connect()
//   let payload = await json(req)
//   payload.created = new Date()
//   payload.updated = new Date()
//   let raw = await crud.post(client, 'secrets', payload)
//   await client.end()
//   send(res, 200, raw.rows[0])
// }

// module.exports.del = async function(req, res) {
//   let client = utils.getClient()
//   await client.connect()
//   let raw = await crud.delete(client, 'secrets', req.params)
//   await client.end()
//   send(res, 200, {})
// }

// module.exports.put = async function(req, res) {
//   let client = utils.getClient()
//   await client.connect()
//   let payload = await json(req)
//   console.log(payload)
//   payload.updated = new Date()
//   let step = await crud.put(client, 'secrets', payload, req.params).then(raw => raw.rows[0])
//   await client.end()
//   send(res, 200, step)
// }