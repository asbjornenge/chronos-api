const { router, get, post, put, del } = require('microrouter')
const cors = require('micro-cors')()
var tasks = require('./tasks')
var steps = require('./steps')
var execs = require('./execs')
var dashboard = require('./dashboard')

module.exports = cors(router(
  get('/tasks/:task/steps/:step/execs', execs.get),
  get('/tasks/:task/steps/:step/execs/:id', execs.get),
  put('/tasks/:task/steps/:step/execs/:id', execs.put),
  del('/tasks/:task/steps/:step/execs/:id', execs.del),
  post('/tasks/:task/steps/:step/execs', execs.post),
  get('/tasks/:task/steps', steps.get),
  get('/tasks/:task/steps/:id', steps.get),
  put('/tasks/:task/steps/:id', steps.put),
  del('/tasks/:task/steps/:id', steps.del),
  post('/tasks/:task/steps', steps.post),
  get('/tasks', tasks.get),
  get('/tasks/:id', tasks.get),
  put('/tasks/:id', tasks.put),
  del('/tasks/:id', tasks.del),
  post('/tasks', tasks.post),
  get('/dashboard', dashboard.get)
))
