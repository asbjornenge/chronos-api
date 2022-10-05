const {send, buffer } = require('micro')
const fs = require('fs')
const { resolve, dirname, basename } = require('path')
const path = require('path')
const { readdir } = require('fs').promises

module.exports.get = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  
  if (fs.existsSync(folder)) {
    //let files = fs.readdirSync(folder)
    let response = []
    let files = []
    for await(const f of getFiles(folder)) {
      files.push(f)
    }
    files.forEach(e => {
      let subfolder = (dirname(e))
      response.push({
          name: basename(e),
          subfolder: subfolder.length <= folder.length ? null: basename(subfolder),
          folder: dirname(e),
          fullname: e,
          lastwrite: (fs.statSync(e)).mtime
      })
    })
    send(res, 200, JSON.stringify(response))
  }
  else {
    send(res, 200, JSON.stringify([]))
  }
}

module.exports.del = async function(req, res) {
  let folder = process.env['FILES_PATH'] || '/files'
  //check if the filename is an uriencoded string or normal variable.
  if (!!req.params[0]) {
    //folder = path.join(folder, req.params[0])
    if (!fs.existsSync(folder)) {
      send(res, 400, {ERROR: "No such subfolder"})
      return 
    }
  }
  let actualfilename
  if (typeof req.params.file !== "undefined") {
    actualfilename = folder + '/' + req.params.file
  }
  else {
    actualfilename = folder + '/' + decodeURIComponent(req.params[0])
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
    var actualfilename = folder + '/' + decodeURIComponent(req.params[0])
    var shortname = decodeURIComponent(req.params[0])
  }
  if (!fs.existsSync(folder)) {
    send(res, 500, {ERROR: "Unable to list directory"})
    return
  }

  if (!fs.existsSync(path.dirname(actualfilename))) {
    send(res, 400, {ERROR: "Parent folder does not exist"})
    return
  }

  if (actualfilename.length > 2) {
    if (fs.existsSync(actualfilename)) {
        send(res, 400, {ERROR: "Duplicate"})
        return
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

async function* getFiles(dir, depth=1) {
  const dirents = await readdir(dir, { withFileTypes: true})
  depth--
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name)
    if (dirent.isDirectory() && depth >= 0) {
      yield* getFiles(res, depth)
    } else {
      if (!dirent.isDirectory()) { yield res }
    }
  }
}