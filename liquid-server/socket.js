const fs = require('fs');
const config = require('./config');
const prefix = config.PROJECTFOLDER;
var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
var path = require('path');
var buffer = [];
module.exports = function(server){

  var io = require('socket.io')(server);
  // var p2p = require('socket.io-p2p-server').Server;
  // io.use(p2p);
  io.on('connection', function(socket){
    var fpath = null;
    console.log("new client: " + socket.id);

    //utils function
    // function getFile(fid){
    //   if (fs.existsSync(prefix + flist[fid].name) && flist[fid].room == socket.room){
    //     socket.fid = fid;
    //     var content = fs.readFileSync(prefix + flist[fid].name);
    //     if (content != '' && content != undefined && content != null){
    //       socket.emit('file',{'content' : content});
    //     }
    //   }else{
    //     socket.emit('error', {error: 'file not found'});
    //   }
    // }

    //new client connection
    socket.on('ready', function(msg){
      socket.join(msg.fid);
      socket.room = msg.fid;
      fpath = path.join(path.join(prefix,flist[socket.room].room),flist[socket.room].name);
      console.log('new participant: %s in room: %s request file: %s',socket.id,socket.room,fpath);
    });

    socket.on('disconnect',function(e){
      console.log('participant: %s disconnect because: %s',socket.id,e);
    });

    //get file
    // socketStream(socket).on('getfile', function(stream,fid){
    //   if (flist[fid]){
    //     getFile(fid);
    //   }
    // });

    //new data from client
    socket.on('data', function(data){
      console.log("data:",data);
      // console.log("room:",socket.room);
      // console.log("client list:");
      // console.log(io.in(socket.room).clients(function(e,clients){
      //   return clients.join('\n');
      // }));
      socket.broadcast.to(socket.room).emit('data',data);
      // socket.broadcast.to(socket.room).emit('feedback',data);
      // if (fs.existsSync(fpath)){
      //   var file = fs.openSync(fpath,'rs+');
      //   switch (data.action){
      //     case 'insert':
      //       content = fs.readFileSync(fpath).toString().substring(data.position);
      //       var text = data.text + content;
      //       fs.writeSync(file, text, data.position, 'utf8');
      //       break;
      //     case 'remove':
      //       content = fs.readFileSync(fpath).toString().substring(data.position.end);
      //       var text = data.text + content;
      //       fs.writeSync(file, text, data.position.start, 'utf8');
      //       break;
      //   }
      //   fs.close(file);
      //   socket.emit('ok');
      //   socket.broadcast.to(socket.room).emit('data', data);
      // }else{
      //   socket.broadcast.to(socket.room).emit('error', {error: 'file not found'});
      // }
    });

  });

}
