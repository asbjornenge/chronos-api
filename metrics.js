const prom = require('prom-client')
const parser = require('cron-parser')
const utils = require('./utils')

var exec_success = new prom.Gauge({
  name: 'chronos_exec_success',
  help: '# Successful backup execs',
})
var exec_error = new prom.Gauge({
  name: 'chronos_exec_error',
  help: '# Errors in backup execs',
})

var exec_failed = new prom.Gauge({
  name: 'chronos_exec_nontriggered',
  help: '# Enabled jobs not executed within treshold, indicates issues with the scheduler.',
})

const getExecStatus = async function () {
  let successExecs = 0
  let nonExecutedExecs = 0
  let failedExecs = 0
  //checks that the requested jobs has been executed, to validate scheduler.
  let client = utils.getClient()
  await client.connect()
  //check for exit code...
  let tasks = await client.query(`select * from tasks order by created DESC`)
                        .then(raw => raw.rows)
  for (task of tasks) {
    task.steps = await client.query(`select * from steps where task=${task.id} order by created`)
                        .then(raw => raw.rows)
    for (step of task.steps) {
      step.execs = await client.query(`select * from execs where step=${step.id} order by time_end DESC limit 1`)
                        .then(raw => raw.rows)
    }
  }

  for (task of tasks) {
    if (!task.paused) {
      for (step of task.steps) {
        if (typeof(step.execs) === "undefined") {
          failedExecs += 1
        }
        else {
          if (step.execs[0].exitcode === 0) {
            successExecs += 1
          }
          else {
            failedExecs += 1
          }
        }
      }

      if (task.steps[0].execs.length === 0) { continue }
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
            
            nonExecutedExecs += 1
          }
        }
        else {
          if (task.steps[0].execs[0].time_end < lastScheduled._date) {

            nonExecutedExecs += 1
          }
        }
      }
      catch (err) {
        console.log("ERROR: prom", err)
      }
    }
  }
  await client.end()
  return({
    success:  successExecs, 
    error:    failedExecs, 
    failed:   nonExecutedExecs 
  })
}

var get = async function(req, res) {
  res.setHeader('Content-Type', prom.register.contentType)
  let status = await getExecStatus()
  exec_failed.set(status.failed || 0)
  exec_success.set(status.success || 0)
  exec_error.set(status.error || 0)
  res.end(prom.register.metrics())
}

module.exports = {
  get,
  exec_success,
  exec_error,
  exec_failed
}
