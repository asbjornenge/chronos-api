const { router, get, post, put, del } = require('microrouter')
const cors = require('micro-cors')()
var tasks = require('./tasks')

module.exports = cors(router(
  get('/tasks', tasks.get),
  put('/tasks', tasks.put),
  del('/tasks', tasks.del),
  post('/tasks', tasks.post)
))
