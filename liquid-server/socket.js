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

  //OT Function
  function operationTransformation(data,fid,cb){
    fhistory[fid].buffer.filter(function(element){
      return element.position.start <= data.position.start;
    }).forEach(function(element){
      data.position.start += element.position.end - element.position.start;
      data.position.end += element.position.end - element.position.start;
    });
    cb && cb(data);
    return data;
  }

  var io = require('socket.io')(server);
  io.on('connection', function(socket){
    var fpath = null;
    console.log("new client: " + socket.id);

    //new client connection
    socket.on('ready', function(msg){
      socket.join(msg.fid);
      socket.room = msg.fid;
      if (flist[socket.room] && fhistory[socket.room]){
        fpath = path.join(path.join(prefix,flist[socket.room].room),flist[socket.room].name);
        console.log('new participant: %s in room: %s request file: %s',socket.id,socket.room,fpath);
        socket.emit('ok',{revision: fhistory[socket.room].buffer.length})
      }else{
        socket.emit('fileNotFound', {error: 'file not found'});
      }

    });

    socket.on('disconnect',function(e){
      console.log('participant: %s disconnect because: %s',socket.id,e);
    });

    socket.on('history', function(msg){
      if (fhistory[socket.room]){
        for (let i = msg.revision + 1; i < fhistory[socket.room].buffer.length; i++){
          socket.emit('data', fhistory[socket.room].buffer[i]);
        }
      }else{
        socket.emit('fileNotFound', {error: 'file not found'});
      }
    });

    //new data from client
    socket.on('data', function(data){
      console.log("data-in:",data);
      if (fs.existsSync(fpath) && fhistory[socket.room]){
        //Operation Transformation
        for (let i = data.lastRevision + 1; i< fhistory[socket.room].buffer.length; i++){
          var element = fhistory[socket.room].buffer[i];
          if (element.position.start <= data.position.start && data.author != element.author){
            data.position.start += element.position.end - element.position.start;
            data.position.end += element.position.end - element.position.start;
          }
        }
        data.lastRevision = fhistory[socket.room].buffer.length;
        //
        socket.emit('feedback',data);
        socket.broadcast.to(socket.room).emit('data', data);
        fhistory[socket.room].buffer.push(data);
        var file = fs.openSync(fpath,'rs+');
        var position = (data.action == 'insert') ? data.position.start : data.position.end;
        var content = fs.readFileSync(fpath).toString().substring(position);
        switch (data.action){
          case 'insert':
            var text = data.text + content;
            fs.writeSync(file, text, data.position.start, 'utf8');
            break;
          case 'remove':
            var text = content;
            fs.writeSync(file, text, data.position.start, 'utf8');
            break;
        }
        fs.close(file);
        //
        if (fhistory[socket.room].buffer.length >= config.HISTORY_LENGTH){
          fhistory[socket.room].buffer.shift();
        }
      }else{
        socket.emit('fileNotFound', {error: 'file not found'});
        if (fhistory[socket.room]){
          delete fhistory[socket.room];
        }
      }
    });

  });

}
