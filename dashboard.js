const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')

module.exports.get = async function(req, res) {
  let client = utils.getClient()
  await client.connect()
  let tasks = await client.query(`
    SELECT 
    t.*,
    ARRAY(
      SELECT 
        (s.id)
      FROM steps AS s
      WHERE s.task = t.id
      GROUP BY s.id
    ) AS steps,
    ARRAY(
      SELECT
        DISTINCT ON(e.step)
        e.exitcode
      FROM steps AS s
      JOIN execs AS e ON e.step = s.id
      WHERE s.task = t.id
      GROUP BY e.step, e.time_start, e.exitcode
      ORDER BY e.step, e.time_start DESC
    ) AS exitcode,
    ARRAY(
      SELECT
        DISTINCT ON(e.step)
        e.time_start
      FROM steps AS s
      JOIN execs AS e ON e.step = s.id
      WHERE s.task = t.id
      GROUP BY e.step, e.time_start, e.exitcode
      ORDER BY e.step, e.time_start DESC
    ) AS last
  FROM 
    tasks AS t
  GROUP BY t.id
  ORDER BY t.created DESC
  `).then(raw => raw.rows)
  send(res, 200, tasks)
  await client.end()
}

module.exports.taskDashboard = async function (req, res) {
  let client = utils.getClient()
  await client.connect()
  let tid = req.params.task
  try {
    let base = await client.query(`select * from tasks where id = ${tid}`).then(raw => raw.rows)
    base = base[0]
    base.steps = await client.query(`select * from steps where task=${tid} order by created`)
                        .then(raw => raw.rows)
    for (step of base.steps) {
      step.execs = await client.query(`select * from execs where step=${step.id} order by time_end DESC limit 10`)
                        .then(raw => raw.rows)
    }
    res.status(200).send(base)
  }
  catch (e) { 
    send(res, 404, "Not found")
  }
  await client.end()
}