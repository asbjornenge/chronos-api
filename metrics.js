const prom = require('prom-client')

var exec_success = new prom.Counter({
  name: 'chronos_exec_success',
  help: '# Successful backup execs',
})
var exec_error = new prom.Counter({
  name: 'chronos_exec_error',
  help: '# Errors in backup execs',
})

var get = async function(req, res) {
  res.setHeader('Content-Type', prom.register.contentType)
  res.end(prom.register.metrics())
}

module.exports = {
  get,
  exec_success,
  exec_error
}
