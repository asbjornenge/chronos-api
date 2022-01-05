const {send, buffer } = require('micro')
const fs = require('fs')

module.exports.get = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  let files = fs.readdirSync(folder)
  let response = []
  files.forEach(e => {
    response.push({
        name: e,
        folder: folder,
        fullname: folder + '/' + e
    })
  })
  send(res, 200, JSON.stringify(response))
}

module.exports.del = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  //check if the filename is an uriencoded string or normal variable.
  if (typeof req.params.file !== "undefined") {
    var actualfilename = folder + '/' + req.params.file
  }
  else {
    var actualfilename = folder + '/' + decodeURIComponent(req.params._)
  }
  if (actualfilename.length > 2 && fs.existsSync(actualfilename)) {
    fs.unlinkSync(actualfilename)
    console.log("Deleted:", actualfilename)
    send(res, 200, {})
  }
  else {
    send(res, 400, {ERROR: "No such file"})
  }
}

module.exports.post = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  //check if the filename is an uriencoded string or normal variable.
  if (typeof req.params.file !== "undefined") {
    var actualfilename = folder + '/' + req.params.file
    var shortname = req.params.file
  }
  else {
    var actualfilename = folder + '/' + decodeURIComponent(req.params._)
    var shortname = decodeURIComponent(req.params._)
  }
  if (actualfilename.length > 2) {
    if (fs.existsSync(actualfilename)) {
        send(res, 400, {ERROR: "Duplicate"})
    }
    else {
        fs.writeFileSync(actualfilename, (await buffer(req)), 'binary')
        console.log("Added:", actualfilename)
        let rest = {
            name: shortname,
            folder: folder,
            fullname: actualfilename
        }
        send(res, 200, JSON.stringify(rest))
    }
  }
  else {
    send(res, 400, {ERROR: "No such file"})
  }
}