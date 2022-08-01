let io;
exports.socketConnection = (server) => {
  io = require('socket.io')(server, {cors: {
    origin: process.env['FRONT_URL'] || "http://localhost:3000",
    credentials: true
  }});
  io.on('connection', (socket) => {
    console.log(`Client connected [id=${socket.id}]`);
    socket.on('disconnect', () => {
      console.info(`Client disconnected [id=${socket.id}]`);
    });
    socket.on("tJoin", (d) => {
      socket.join(d)
    })
    socket.on("tLeave", (d) => {
      socket.leave(d)
    })
  });
};

exports.createTask = (task) => {
  io.emit('taskCreate', task)
}

exports.updateTask = (task) => {
  io.emit('taskUpdate', task)
}

exports.runTask = (task) => {
  io.emit('runTask', task)
}

exports.endTask = (task) => {
  io.emit('endTask', task)
}

exports.tSocket = (path, type, message) => {
  io.to(path).emit(type, message)
}