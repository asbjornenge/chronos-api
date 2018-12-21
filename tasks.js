const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let tasks = await crud.get(client, 'tasks', req.params).then(raw => raw.rows)
  if (req.query.steps) {
    for (task of tasks) {
      task.steps = await crud.get(client, 'steps', { task: task.id }).then(raw => raw.rows)
      if (req.query.execs) {
        let num_execs = parseInt(req.query.execs)
        for (step of task.steps) {
          step.execs = await client.query(`select * from execs where step=${step.id} order by time_end DESC limit ${num_execs}`)
            .then(raw => raw.rows)
        }
      }
    }
  }
  send(res, 200, !req.params.id ? tasks : tasks[0])
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
  payload.updated = new Date()
  let raw = await crud.put(client, 'tasks', payload, req.params)
  send(res, 200, raw.rows.length === 1 ? raw.rows[0] : raw.rows)
  await client.end()
}

module.exports.del = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let raw = await crud.delete(client, 'tasks', req.params)
  send(res, 200)
  await client.end()
}
