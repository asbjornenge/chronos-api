// const { router, get, post, put, del } = require('microrouter')
// const cors = require('micro-cors')()
const express = require('express')
const router = express.Router()

var tasks = require('./tasks')
var steps = require('./steps')
var execs = require('./execs')
var dashboard = require('./dashboard')
var schedule = require('./schedule')
var metrics = require('./metrics')
var runTask = require('./runtask')
var runStep = require('./runstep')
var secrets = require('./secrets')
var files = require('./files')
var failed = require('./failed')
const { requiresAuth } = require('express-openid-connect');
;

(async () => {
  await schedule.init()
})()


router.get('/', (req, res) => {
  res.writeHead(301,
    {Location: process.env['FRONT_URL'] || "http://localhost:3000"}
  );
  res.end();
})

//Execs
router.get('/tasks/:task/steps/:step/execs', execs.get),
router.get('/tasks/:task/steps/:step/execs/:id', execs.get),
router.put('/tasks/:task/steps/:step/execs/:id', execs.put),
router.delete('/tasks/:task/steps/:step/execs/:id', execs.del),
router.post('/tasks/:task/steps/:step/execs', execs.post),
router.get('/execs/failed', failed.get)

//steps
router.get('/tasks/:task/steps', steps.get),
router.get('/tasks/:task/steps/:id', steps.get),
router.put('/tasks/:task/steps/:id', steps.put),
router.delete('/tasks/:task/steps/:id', steps.del),
router.post('/tasks/:task/steps', steps.post),

//tasks
router.get('/tasks', tasks.get),
router.get('/tasks/:id', tasks.get),
router.put('/tasks/:id', tasks.put),
router.delete('/tasks/:id', tasks.del),
router.post('/tasks', tasks.post),

//dashboard
router.get('/dashboard' ,dashboard.get),
router.get('/dashboard/task/:task', dashboard.taskDashboard)

//metrics
router.get('/metrics', metrics.get),

//live execution
router.get('/run/:task/steps/:id', runStep.get),
router.get('/run/:task', runTask.get),

//secrets
router.get('/secrets', secrets.get),
router.post('/secrets', secrets.post),
router.delete('/secrets/:id', secrets.del),
router.put('/secrets/:id', secrets.put),

//files
router.get('/files', files.get),
router.delete('/files/:file', files.del),
router.delete('/files/*', files.del),
router.post('/files/:file', files.post),
router.post('/files/*', files.post)

module.exports = router
