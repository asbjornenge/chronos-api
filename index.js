const { router, get, post, put, del } = require('microrouter')
const cors = require('micro-cors')()

var tasks = require('./tasks')

module.exports = cors(router(
  get('/tasks', tasks.get),
  post('/tasks', tasks.post),
  put('/tasks', tasks.put)
))
