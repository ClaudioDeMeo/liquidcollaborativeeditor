const fs = require('fs');
const config = require('./config');
const prefix = config.PROJECTFOLDER;
var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());

module.exports = function(server){

  var io = require('socket.io')(server);
  var p2p = require('socket.io-p2p-server').Server;
  io.use(p2p);
  io.on('connection', function(socket){

    console.log("new client: " + socket.id);

    //utils function
    function getFile(fid){
      if (fs.existsSync(prefix + flist[fid].name) && flist[fid].room == socket.room){
        socket.fid = fid;
        var content = fs.readFileSync(prefix + flist[fid].name);
        if (content != '' && content != undefined && content != null){
          socket.emit('file',{'content' : content});
        }
      }else{
        socket.emit('error', {error: 'file not found'});
      }
    }

    //new client connection
    socket.on('ready', function(msg){
      console.log('new participant: %s in room: %s', socket.id, msg.room);
      socket.join(msg.room);
      socket.room = msg.room;
      // if (flist[msg.fid]){
      //   getFile(msg.fid);
      // }
    });

    //get file
    socketStream(socket).on('getfile', function(stream,fid){
      if (flist[fid]){
        getFile(fid);
      }
    });

    //new data from client
    socket.on('data', function(data){
      if (fs.existsSync(prefix + flist[socket.fid].name) && flist[socket.fid].room == socket.room){
        var file = fs.openSync(prefix + flist[socket.fid].name,'rs+');
        switch (data.action){
          case 'write':
            content = fs.readFileSync(prefix + flist[socket.fid].name).toString().substring(data.position);
            var text = data.text + content;
            fs.writeSync(file, text, data.position, 'utf-8');
            break;
          case 'delete':
            content = fs.readFileSync(prefix + flist[socket.fid].name).toString().substring(data.position.end);
            var text = data.text + content;
            fs.writeSync(file, text, data.position.start, 'utf-8');
            break;
        }
        fs.close(file);
        socket.emit('ok');
        socket.broadcast.to(socket.room).emit('data', data);
      }else{
        socket.broadcast.to(socket.room).emit('error', {error: 'file not found'});
      }
    });

  });

}
