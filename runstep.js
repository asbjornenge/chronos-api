const { json, send } = require('micro')
const utils = require('./utils')
const crud = require('./crud')
const schedule = require('./schedule')


module.exports.get = async function (req, res) {
    let client = utils.getClient()
    
    let step = await crud.get(client, 'steps', req.params).then(raw => raw.rows)
    send(res, 200)
    await schedule.doStep(client, step[0])
    
}
