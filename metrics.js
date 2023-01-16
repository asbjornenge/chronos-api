const prom = require('prom-client')
const parser = require('cron-parser')
const utils = require('./utils')

var exec_success = new prom.Gauge({
  name: 'chronos_exec_success',
  help: '# Successful backup execs',
  labelNames: ['task', 'step', 'taskId', 'stepId']
})
var exec_error = new prom.Gauge({
  name: 'chronos_exec_error',
  help: '# Errors in backup execs',
  labelNames: ['task', 'step', 'taskId', 'stepId']
})

var exec_failed = new prom.Gauge({
  name: 'chronos_exec_nontriggered',
  help: '# Enabled jobs not executed within treshold, indicates issues with the scheduler.',
  labelNames: ['task', 'step', 'taskId', 'stepId']
})

var exec_awaiting = new prom.Gauge({
  name: 'chronos_exec_awaiting',
  help: "Execs waiting initial execution",
  labelNames: ['task', 'taskid']
})

const getPromPayload = (step,task, value = 1) => {
  return {
    "labelNames": {
      "task": task.name,
      "taskId": task.id,
      "step": step.name,
      "stepId": step.id
    },
    "value": value
  }
}

const setPromLabels = (prom, payload) => {
  prom.set({...payload.labelNames}, payload.value)
}

const getExecStatus = async function () {
  let successExecs = []
  let nonExecutedExecs = []
  let failedExecs = []
  let awaitingInit = []
  //checks that the requested jobs has been executed, to validate scheduler.
  let client = utils.getClient()
  
  //check for exit code...
  let tasks = await client.query(`select * from tasks where acknowledged is not true order by created DESC`)
                        .then(raw => raw.rows)
  for (task of tasks) {
    task.steps = await client.query(`select * from steps where task=${task.id} order by created`)
                        .then(raw => raw.rows)
    for (step of task.steps) {
      step.execs = await client.query(`select * from execs where step=${step.id} AND completed=TRUE order by time_end DESC limit 1`)
                        .then(raw => raw.rows)
    }
  }

  for (task of tasks) {
    if (!task.paused) {
      let lastScheduled  
      try {
        lastScheduled = new Date(parser.parseExpression(task.cron).prev()._date)
      }
      catch (e) {
        console.log("Error parsing cron on '" + task.name + "'")
      }

      if (null !== lastScheduled && task.pauseToggeled > lastScheduled) {
        awaitingInit.push({
          "labelNames": {
            "task": task.name,
            "taskId": task.id
          },
          "value": 1
        })
        continue
      }
      for (step of task.steps) {
        if (typeof(step.execs[0]) === "undefined") {
          //check if task was recently resumed
          failedExecs.push(getPromPayload(step, task))    
        }
        else {
          if (step.execs[0]?.exitcode === 0) {

            successExecs.push(getPromPayload(step, task))
          }
          else {
            failedExecs.push(getPromPayload(step, task))
          }
        }
      }

      if (task.steps[0].execs.length === 0) { continue }
      //only check runing tasks, and check execution timestamps against cron
      try {
        var lastScheduled2 = parser.parseExpression(task.cron).prev()
        var executiontimeout = 0
        for (step of task.steps) {
          executiontimeout += step.timeout
        }
        var execdonetime = new Date(lastScheduled2._date)
        execdonetime += executiontimeout

        if (Date.now < execdonetime) {
          //the execution could possibly still be processing. check the previous one

          let prev2 = lastScheduled2.prev()

          if (task.steps[0].execs[0].time_end < prev2._date) {
            //console.log("Non executed task", task)
            nonExecutedExecs.push(getPromPayload(step, task))
          }
        }
        else {
          if (task.steps[0].execs[0].time_end < lastScheduled2._date) {
            nonExecutedExecs.push(getPromPayload(step, task))
            //console.log("Non Executed task", task)
          }
        }
      }
      catch (err) {
        console.log("ERROR: prom", err)
      }
    }
  }
  successExecs.map(s => setPromLabels(exec_success, s))
  nonExecutedExecs.map(s => setPromLabels(exec_failed, s))
  failedExecs.map(s => setPromLabels(exec_error, s))
  awaitingInit.map(s => setPromLabels(exec_awaiting, s))
}

var get = async function(req, res) {
  res.setHeader('Content-Type', prom.register.contentType)
  exec_failed.reset()
  exec_success.reset()
  exec_error.reset()
  exec_awaiting.reset()

  await getExecStatus()
  res.end(prom.register.metrics())
}

module.exports = {
  get,
  exec_success,
  exec_error,
  exec_failed
}
