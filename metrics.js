const prom = require('prom-client')
const parser = require('cron-parser')
const utils = require('./utils')

var exec_success = new prom.Counter({
  name: 'chronos_exec_success',
  help: '# Successful backup execs',
})
var exec_error = new prom.Counter({
  name: 'chronos_exec_error',
  help: '# Errors in backup execs',
})

var exec_failed = new prom.Gauge({
  name: 'chronos_exec_nontriggered',
  help: '# Enabled jobs not executed within treshold',
})

const getFailedExecs = async function () {
  var errors = 0
  //checks that the requested jobs has been executed, to validate scheduler.
  let client = utils.getClient()
  await client.connect()
  //check for exit code...
  let tasks = await client.query(`select * from tasks order by created DESC`)
                        .then(raw => raw.rows)
  for (task of tasks) {
    task.steps = await client.query(`select * from steps where task=${task.id} order by created limit 1`)
                        .then(raw => raw.rows)
    for (step of task.steps) {
      step.execs = await client.query(`select * from execs where step=${step.id} order by time_end DESC limit 1`)
                        .then(raw => raw.rows)
    }
  }

  for (task of tasks) {
    if (!task.paused) {
      //only check runing tasks, and check execution timestamps against cron
      try {
        var lastScheduled = parser.parseExpression(task.cron).prev()
        var executiontimeout = 0
        for (step of task.steps) {
          executiontimeout += step.timeout
        }
        var execdonetime = new Date(lastScheduled._date)
        execdonetime += executiontimeout

        if (Date.now < execdonetime) {
          //the execution could possibly still be processing. check the previous one

          let prev2 = lastScheduled.prev()

          if (task.steps[0].execs[0].time_end < prev2._date) {
            
            errors += 1
          }
        }
        else {
          if (task.steps[0].execs[0].time_end < lastScheduled._date) {

            errors += 1
          }
        }
      }
      catch (err) {
        console.log("ERROR: prom", err)
      }
      
    }
  }
  return(errors)
}

var get = async function(req, res) {
  res.setHeader('Content-Type', prom.register.contentType)
  let failedExecs = await getFailedExecs()
  exec_failed.set(failedExecs)
  res.end(prom.register.metrics())
}

module.exports = {
  get,
  exec_success,
  exec_error,
  exec_failed
}
