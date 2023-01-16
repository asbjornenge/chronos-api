const { json, send } = require('micro')
const utils = require('./utils')
const schedule = require('./schedule')

module.exports.get = async function (req, res) {
    let client = utils.getClient()
    
    send(res, 200)
    await schedule.doRun(req.params.task, client)
    
}
