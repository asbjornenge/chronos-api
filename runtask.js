const { json, send } = require('micro')
const utils = require('./utils')
const schedule = require('./schedule')

module.exports.get = async function (req, res) {
    let client = utils.getClient()
    await client.connect()
    send(res, 200)
    await schedule.doRun(req.params.task, client)
    await client.end()
}
