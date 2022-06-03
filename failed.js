const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  delete req.params.task
  let failedexecs = await client.query(`
  SELECT 
    execs.*,
    steps.id as stepid,
    steps.name AS "stepname",
    tasks.id AS "taskid",
    tasks.name AS "taskname"
  FROM 
    "execs"
  INNER JOIN steps ON execs.step = steps.id
  INNER JOIN tasks ON steps.task = tasks.id
  WHERE
    execs.exitcode != 0
  ORDER BY execs.time_end DESC
  LIMIT 20
  `).then(raw => raw.rows)
  send(res, 200, failedexecs)
  await client.end()
}