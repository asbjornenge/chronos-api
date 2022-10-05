const {send, buffer } = require('micro')
const fs = require('fs')


module.exports.get = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  if (fs.existsSync(folder)) {
    let files = fs.readdirSync(folder, { withFileTypes: true})
    let response = []
    files
      .filter(f => f.isDirectory())
      .forEach(e => {
      response.push({
          folderName: e.name,
          parent: folder,
          fullname: folder + '/' + e.name
      })
    })
    send(res, 200, JSON.stringify(response))
  }
  else {
    send(res, 200, JSON.stringify([]))
  }
}

// module.exports.del = async function(req, res) {
//   let folder = process.env['FILES_PATH'] || '/files'
//   //check if the filename is an uriencoded string or normal variable.
//   if (typeof req.params.file !== "undefined") {
//     var actualfilename = folder + '/' + req.params.file
//   }
//   else {
//     var actualfilename = folder + '/' + decodeURIComponent(req.params._)
//   }
//   if (actualfilename.length > 2 && fs.existsSync(actualfilename)) {
//     fs.unlinkSync(actualfilename)
//     console.log("Deleted:", actualfilename)
//     send(res, 200, {})
//   }
//   else {
//     send(res, 400, {ERROR: "No such file"})
//   }
// }

module.exports.post = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  //check if the filename is an uriencoded string or normal variable.
  if (typeof req.params.directory !== "undefined") {
    var actualfilename = folder + '/' + req.params.directory
    var shortname = req.params.directory
  }
  else {
    var actualfilename = folder + '/' + decodeURIComponent(req.params._)
    var shortname = decodeURIComponent(req.params._)
  }
  if (!fs.existsSync(folder)) {
    send(res, 500, {ERROR: "Unable to write to folder"})
    return
  }

  if (actualfilename.length > 2) {
    if (fs.existsSync(actualfilename)) {
        send(res, 400, {ERROR: "Duplicate"})
    }
    else {
        //fs.writeFileSync(actualfilename, (await buffer(req)), 'binary')
        fs.mkdirSync(actualfilename)
        console.log("Added:", actualfilename)
        let rest = {
            folderName: shortname,
            folder: folder,
            fullname: actualfilename
        }
        send(res, 200, JSON.stringify(rest))
    }
  }
  else {
    send(res, 400, {ERROR: "No such folder"})
  }
}