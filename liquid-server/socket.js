const fs = require('fs');
const config = require('./config');
const prefix = config.PROJECTFOLDER;
var path = require('path');

module.exports = function(server){

  //
  var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());

  //Object buffer {fid:{buffer:[],busy:Boolean}}
  var fhistory = {};
  for (let key in flist){
    fhistory[key] = {
      buffer : [],
      busy : false
    };
  }

  //FILELIST Observer
  fs.watchFile(config.FILELIST,function(curr,prev){
    if (curr.mtime != prev.mtime){
      var newflist = JSON.parse(fs.readFileSync(config.FILELIST).toString());

      //add new file buffer
      for (let key in newflist){
        if (!fhistory[key]){
          fhistory[key] = {
            buffer : [],
            busy : false
          };
          delete flist[key];
        }
      }

      //remove file buffer if file is deleted
      for(let key in flist){
        delete fhistory[key];
      }
      flist = newflist;
    }
  });

  var io = require('socket.io')(server);

  io.on('connection', function(socket){
    var fpath = null;
    console.log("new client: " + socket.id);

    //new client connection
    socket.on('ready', function(msg){
      socket.join(msg.fid);
      socket.room = msg.fid;
      if (flist[socket.room] && fhistory[socket.room]){
        fpath = path.join(prefix,flist[socket.room].room,flist[socket.room].name);
        console.log('new participant: %s in room: %s request file: %s',socket.id,socket.room,fpath);
        socket.emit('ok',{revision: fhistory[socket.room].buffer.length})
      }else{
        console.log("ready: file not found");
        socket.emit('fileNotFound', {error: 'file not found'});
      }

    });

    socket.on('disconnect',function(e){
      console.log('participant: %s disconnect because: %s',socket.id,e);
      if(!io.sockets.adapter.rooms[socket.room]){
        fhistory[socket.room] = {
          buffer : [],
          busy : false
        };
      }
    });

    socket.on('history', function(msg){
      if (fhistory[socket.room]){
        for (let i = msg.revision + 1; i < fhistory[socket.room].buffer.length; i++){
          socket.emit('data', fhistory[socket.room].buffer[i]);
        }
      }else{
        console.log('history: file not found');
        socket.emit('fileNotFound', {error: 'file not found'});
      }
    });

    //new data from client
    socket.on('data', function(data){
      console.log("data-in:",data);
      if (fs.existsSync(fpath) && fhistory[socket.room]){
        for (let i = data.lastRevision + 1; i< fhistory[socket.room].buffer.length; i++){
          var element = fhistory[socket.room].buffer[i];
          if (element.position.start <= data.position.start && data.author != element.author){
            switch (element.action) {
              case "insert":
                data.position.start += element.position.end - element.position.start;
                data.position.end += element.position.end - element.position.start;
                break;
              case "remove":
                data.position.start -= element.position.end - element.position.start;
                data.position.end -= element.position.end - element.position.start;
                break;
            }
          }
        }
        data.lastRevision = fhistory[socket.room].buffer.length;
        //
        console.log("data-out:",data);
        socket.emit('feedback',data);
        socket.broadcast.to(socket.room).emit('data', data);
        fhistory[socket.room].buffer.push(data);
        switch (data.action){
          case 'insert':
            var content = fs.readFileSync(fpath).toString();
            var text = content.substring(0,data.position.start) + data.text + content.substring(data.position.start);
            fs.writeFileSync(fpath,text);
            break;
          case 'remove':
            var content = fs.readFileSync(fpath).toString();
            var text =  content.substring(0,data.position.start) + content.substring(data.position.end);
            fs.writeFileSync(fpath,text);
            break;
        }
      }else{
        console.log("data: file not found");
        socket.emit('fileNotFound', {error: 'file not found'});
        if (fhistory[socket.room]){
          delete fhistory[socket.room];
        }
      }
    });

  });

}
