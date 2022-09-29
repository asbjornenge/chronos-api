const hash = require('object-hash')
const schedule = require('node-schedule')
const { exec, spawn } = require('child-process-async')
const utils = require('./utils')
const crud = require('./crud')
const { updateTask, createTask, tSocket, runTask, endTask } = require('./utils/socket.js')

let schedules = {}

const replaceAll = (str, find, replace) =>  {
  if (typeof str !== "undefined") {
    return str.replace(new RegExp(find, 'g'), replace);
  }
  else {
    return str
  }
}

const getTaskHash = (task) => {
  let _task = Object.assign({}, task)
  delete _task.created
  delete _task.updated
  _task.steps.forEach(s => {
    delete s.created
    delete s.updated
  })
  return hash(_task)
}

const run = async function(task) {
  // TODO: Wrap in try/cath ??
  let client = utils.getClient()
  await client.connect()
  let etask = await crud.get(client, 'tasks', { id: this.task.id }).then(raw => raw.rows)
  etask = etask[0]
  if (etask.paused) throw new Error(`Task ${etask.id} tried to run even if task if paused`)
  await doRun(etask.id, client)
  await client.end()
}

const doRun = async function(taskid, client) {
  let steps = await crud.get(client, 'steps', { task: taskid }, { order: { 'sort_order': 'asc' } }).then(raw => raw.rows)
  let task = await client.query(`select * from tasks where id = ${taskid}`).then(raw => raw.rows)
  
  let setAknowledge = await client.query(`UPDATE "public"."tasks" SET "acknowledged"='false' WHERE  "id"=${taskid};`)
  runTask(task)
  for (let step of steps) {
    await doStep(client, step)
  }
  endTask(task)
}

const doStep = async function(client, step) {
  console.log(`Running step ${step.name} with id ${step.id}`)
  let secrets = await crud.get(client, 'secrets').then(raw => raw.rows)
  var _stdout, _stderr, exitcode;
  var notDone = true
  var time_start = new Date()

  //replaces the secret values with actual secrets.
  secrets.forEach(s => step.command = replaceAll(step.command, '{{' + s.name + "}}", s.secretvalue))

  let cExec = await crud.post(client, 'execs', {
    step: step.id,
    stdout: "",
    stderr: "",
    time_start: time_start,
    completed: false
  }).then((e) => e.rows[0])


  tSocket(`/task/${step.task}`, "newExec", cExec)
  
  

  await new Promise( async (resolve, reject) => {
    try {
      let ex = spawn(step.command, {
        timeout: step.timeout,
        shell: true
      });

      ex.stdout.on('data', (d) => {
        if (typeof _stdout === "undefined") _stdout = ""
        if (typeof d !== "undefined") {
          _stdout = _stdout + d.toString()
        }
        cExec.stdout = _stdout
        tSocket(`/task/${step.task}`, "updateExec", cExec)
      })

      ex.stderr.on('data', (d) => {
        if (typeof _stderr === "undefined") _stderr = ""
        if (typeof d !== "undefined") {
          _stderr = _stderr + d.toString()
          cExec.stdErr = _stderr
          tSocket(`/task/${step.task}`, "updateExec", cExec)
        }
      })
      ex.on('exit', function (e) {
        console.log(`${step.id } exited with code ${e}`)
        //ls.stdin.pause()
        ex.stdout.destroy()
        ex.stderr.destroy()
        ex.stdin.destroy()
        ex.kill('SIGTERM')
        ex.kill('SIGINT')
        ex.kill()
        //console.log(ex)
        //console.log(ls)
      })
      ex.on('close', async (c) => {
        exitcode = c
        if (typeof exitcode === "undefiend") {
          exitcode = 1
        }
        if (exitcode === null) { 
          exitcode = 124
          if (typeof _stderr === "undefined") _stderr = ""
          _stderr = _stderr + `The command timed out after ${step.timeout / 1000} seconds.`
        }
        notDone = false

        let time_end = new Date()

        if (step.stdoutregex !== null && exitcode === 0) {
          re = new RegExp(step.stdoutregex)
          if (!re.test(_stdout)) {
            console.log(`Step ${step.name} returned exitcode 0 but failed the regex check`)
            exitcode = 1
          }
        }
        secrets.forEach(s => _stderr = replaceAll(_stderr, s.secretvalue, '{{' + s.name + "}}"))
        secrets.forEach(s => _stdout = replaceAll(_stdout, s.secretvalue, '{{' + s.name + "}}"))
        try {
          let nExec = await crud.put(client, 'execs', {
            stdout: _stdout || "",
            stderr: _stderr || "",
            exitcode: exitcode,
            time_end: time_end,
            completed: true
          }, {
            id: cExec.id,
            step: step.id
          }).then((r) => r.rows[0])


          tSocket(`/task/${step.task}`, "updateExec", nExec)
          resolve()
        }
        catch (e) {
          console.log("Failed to insert into the DB")
          console.log("Step:", step.id)
          console.log("STDERR", _stderr)
          console.log("STDOUT", _stdout)
          console.log("ERROR", e)
          resolve()
        }
      })
      ex.on('error', (e) => {
        console.log("UNKNOWN", e)
      })
    }
    catch (e) {
      console.log(`Step ${step.id} failed.`)
      exitcode = e.code
      try {
        let nExec = await crud.put(client, 'execs', {
          id: cExec.id,
          stdout: _stdout || "",
          stderr: _stderr || "",
          exitcode: exitcode,
          time_end: time_end,
          completed: true
        },{
          id: cExec.id,
          step: step.id
        }).then((r) => r.rows[0])

        tSocket(`/task/${step.task}`, "updateExec", nExec)
      }
      catch (e) {
        console.log("Failed to insert into the DB")
        console.log("Step:", step.id)
        console.log("STDERR", _stderr)
        console.log("STDOUT", _stdout)
        console.log("ERROR", e)
      }
      resolve()
    }
  })
}

const scheduleTask = (task) => {
  let taskHash = getTaskHash(task)
  schedules[task.id] = {
    hash: taskHash,
    job: schedule.scheduleJob(task.cron, run.bind({task: {id: task.id}}))
  }
}

const init = async () => {
  let client = utils.getClient()
  await client.connect()
  let tasks = await crud.get(client, 'tasks').then(raw => raw.rows)
  tasks = tasks.filter(t => !t.paused)
  for (let task of tasks) {
    task.steps = await crud.get(client, 'steps', { task: task.id }).then(raw => raw.rows)
    scheduleTask(task)
  }
  await client.end()
}

const update = async (id) => {
  let client = utils.getClient()
  await client.connect()
  let task = await crud.get(client, 'tasks', { id: id }).then(raw => raw.rows)
  task = task[0]
  task.steps = await crud.get(client, 'steps', { task: id }).then(raw => raw.rows)
  let taskHash = getTaskHash(task)
  if (task.paused && schedules[task.id] != undefined) {
    console.log('Task paused, removing...')
    schedules[task.id].job.cancel()
    delete schedules[task.id]
  }
  if (!task.paused && schedules[task.id] == undefined) {
    console.log('Task un-paused, adding...')
    scheduleTask(task)
  }
  if (!task.paused && schedules[task.id] != undefined) {
    if (taskHash != schedules[task.id].hash) {
      console.log('Task changed, reinstalling...')
      try {
        schedules[task.id].job.cancel()
      }
      catch (err) {
        console.error(err)
      }
      scheduleTask(task)
    }
  }
  await client.end()
}

const remove = async (id) => {
  if (schedules[id] != undefined) {
    schedules[id].job.cancel()
    delete schedules[id]
  }
}

module.exports = {
  init,
  update,
  remove,
  doRun,
  doStep,
  getTaskHash,
}
