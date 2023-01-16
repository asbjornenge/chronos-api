const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')
const schedule = require('./schedule')
const { createTask, updateTask } = require('./utils/socket')


module.exports.get = async function(req, res) {
  if (!new RegExp(/([1-9][0-9]*)|0/).test(req.params.id))  {
    send(res, 400, {"Message": "No valid task present"})
    return
  }
  let client = utils.getClient()
  
  let task = await client.query(`UPDATE "tasks" SET "acknowledged"='true' WHERE  "id"=${req.params.id};`).then(raw => raw.rows)
  
  send(res, 200, task)
}

module.exports.delete = async function(req, res) {
  if (!new RegExp(/([1-9][0-9]*)|0/).test(req.params.id))  {
    send(res, 400, {"Message": "No valid task present"})
    return
  }
  let client = utils.getClient()
  
  let task = await client.query(`UPDATE "tasks" SET "acknowledged"='false' WHERE  "id"=${req.params.id};`).then(raw => raw.rows)
  
  send(res, 200, task)
}