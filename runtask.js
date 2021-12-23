const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')
const schedule = require('./schedule')
//const { default: Task } = require('../chronos-app/src/screens/Task')


module.exports.get = async function (req, res) {
    let client = utils.getClient()
    await client.connect()
    await schedule.doRun(req.params.task, client)
    send(res, 200)
}
