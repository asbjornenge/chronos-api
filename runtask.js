const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')
const schedule = require('./schedule')


module.exports.get = async function (req, res) {
    let client = utils.getClient()
    await client.connect()
    let task = await crud.get(client, 'tasks', {id : req.params.task}).then(raw => raw.rows)
    await schedule.doRun(task, client)
    send(res, 200)
}
