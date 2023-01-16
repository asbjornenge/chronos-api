const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  
  delete req.params.task
  let execs = await crud.get(client, 'execs', req.params).then(raw => raw.rows)
  send(res, 200, !req.params.id ? execs : execs[0])
  
}

module.exports.post = async function(req, res) {
  let client = utils.getClient()
  
  delete req.params.task
  let payload = await json(req)
  payload.created = new Date()
  payload.updated = new Date()
  let exec = await crud.post(client, 'execs', Object.assign(payload,req.params)).then(raw => raw.rows[0])
  send(res, 200, exec)
  
}

module.exports.put = async function(req, res) {
  let client = utils.getClient()
  
  delete req.params.task
  let payload = await json(req)
  payload.updated = new Date()
  let exec = await crud.put(client, 'execs', payload, req.params).then(raw => raw.rows[0])
  send(res, 200, exec)
  
}

module.exports.del = async function(req, res) {
  let client = utils.getClient()
  
  delete req.params.task
  await crud.delete(client, 'execs', req.params)
  send(res, 200)
  
}
