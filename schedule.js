const hash = require('object-hash')
const schedule = require('node-schedule')
const utils = require('./utils')
const crud = require('./crud')

let schedules = {}

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

const run = async function(date) {
  // TODO: Wrap in try/cath ??
  console.log(`Running job ${date} for ${this.task.id}`)
  let client = utils.getClient()
  await client.connect()
  let task = await crud.get(client, 'tasks', { id: this.task.id }).then(raw => raw.rows)
  task = task[0]
  if (task.paused) throw new Error(`Task ${task.id} tried to run even if task if paused`)
  let steps = await crud.get(client, 'steps', { task: task.id }).then(raw => raw.rows)
  for (step of steps) {
    console.log(`EXEC: ${step.command} | TASK: ${task.name}`)
  }
  await client.end()
}

const scheduleTask = (task) => {
  let taskHash = getTaskHash(task)
  schedules[task.id] = {
    hash: taskHash,
    job: schedule.scheduleJob(task.cron, run.bind({task: { id: task.id, hash: taskHash }}))
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
      schedules[task.id].job.cancel()
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
  remove
}
