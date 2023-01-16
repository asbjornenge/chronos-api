const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  
  let tasks = await client.query(`select * from tasks where id = ${req.params.id} order by created DESC`)
                        .then(raw => raw.rows)
  let steps,execs = [] 
  for (task of tasks) {
    task.steps = await client.query(`select * from steps where task=${task.id} order by created`)
                        .then(raw => raw.rows)
    for (step of task.steps) {
      step.execs = await client.query(`select id, step, exitcode, time_start, time_end from execs where step=${step.id} order by time_end DESC limit 10`)
                        .then(raw => raw.rows)
    }
  }
  send(res, 200, tasks)
  
}