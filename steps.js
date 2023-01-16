const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  
  let steps = await crud.get(client, 'steps', req.params).then(raw => raw.rows)
  send(res, 200, !req.params.id ? steps : steps[0])
  
}

module.exports.post = async function(req, res) {
  let client = utils.getClient()
  
  let payload = await json(req)
  payload.created = new Date()
  payload.updated = new Date()
  let step = await crud.post(client, 'steps', Object.assign(payload,req.params)).then(raw => raw.rows[0])
  send(res, 200, step)
  
}

module.exports.put = async function(req, res) {
  let client = utils.getClient()
  
  let payload = await json(req)
  payload.updated = new Date()
  let step = await crud.put(client, 'steps', payload, req.params).then(raw => raw.rows[0])
  send(res, 200, step)
  
}

module.exports.del = async function(req, res) {
  let client = utils.getClient()
  
  let raw = await crud.delete(client, 'steps', req.params)
  send(res, 200, {})
  
}
