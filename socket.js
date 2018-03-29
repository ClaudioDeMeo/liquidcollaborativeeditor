const debug = require('debug')('server:socket');
const fs = require('fs');
const config = require('./config');
const prefix = config.PROJECTFOLDER;
const path = require('path');
const compiler = require('./compiler.js');

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
  // function operationTransformation(data,fid,cb){
  //   fhistory[fid].buffer.filter(function(element){
  //     return element.position.start <= data.position.start;
  //   }).forEach(function(element){
  //     data.position.start += element.position.end - element.position.start;
  //     data.position.end += element.position.end - element.position.start;
  //   });
  //   cb && cb(data);
  //   return data;
  // }

  var io = require('socket.io')(server);
  // var p2p = require('socket.io-p2p-server').Server;
  // io.use(p2p);
  io.on('connection', function(socket){
    var fpath = null;
    var writer = "";
    var executor = null;
    debug("new client: " + socket.id);

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
      writer = msg.writer;
      if (flist[socket.room] && fhistory[socket.room]){
        fpath = path.join(prefix,flist[socket.room].room,flist[socket.room].name);
        debug('new participant: %s (id %s) in room: %s request file: %s', writer , socket.id,socket.room,fpath);
        socket.emit('ok',{revision: fhistory[socket.room].buffer.length})
      }else{
        debug("ready: file " + socket.room +  " not found");
        socket.emit('fileNotFound', {error: 'file not found'});
      }
    });

    socket.on('disconnect',function(e){
      debug('participant: %s disconnect because: %s',socket.id,e);
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
        debug('history: file not found');
        socket.emit('fileNotFound', {error: 'file not found'});
      }
    });

    socket.on('changeLanguage',function(data){
      if (flist[socket.room]){
        debug('changeLanguage',data);
        flist[socket.room].language = data.newLanguage;
        fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
        socket.broadcast.to(socket.room).emit('changeLanguage', data);
      }
    });
    //get file
    // socketStream(socket).on('getfile', function(stream,fid){
    //   if (flist[fid]){
    //     getFile(fid);
    //   }
    // });

    //new data from client
    socket.on('data', function(data){
      // debug("data-in:",data);
      var log = data;
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
        data.writer = writer;
        data.lastRevision = fhistory[socket.room].buffer.length;
        //
        // debug("data-out:",data);
        log.author = data.author;
        log.newPosition = data.position;
        debug('data:', log);
        socket.emit('feedback',data);
        socket.broadcast.to(socket.room).emit('data', data);
        fhistory[socket.room].buffer.push(data);
        var operation = data;
        // var file = fs.openSync(fpath,'rs+');
        // var position = (operation.action == 'insert') ? operation.position.start : operation.position.end;
        // var content = fs.readFileSync(fpath).toString().substring(position);
        switch (operation.action){
          case 'insert':
            // var content = fs.readFileSync(fpath).toString().substring(operation.position.start);
            var content = fs.readFileSync(fpath).toString();
            var text = content.substring(0,operation.position.start) + operation.text + content.substring(operation.position.start);
            fs.writeFileSync(fpath,text);
            // fs.writeSync(file, text, operation.position.start, 'utf8');
            break;
          case 'remove':
            // var content = fs.readFileSync(fpath).toString().substring(operation.position.end);
            var content = fs.readFileSync(fpath).toString();
            var text =  content.substring(0,operation.position.start) + content.substring(operation.position.end);
            fs.writeFileSync(fpath,text);
            // fs.writeSync(file, content, operation.position.start, 'utf8');
            break;
        }
        // fs.close(file);
        //
        // if (fhistory[socket.room].buffer.length >= config.HISTORY_LENGTH){
        //   fhistory[socket.room].buffer.shift();
        // }
      }else{
        debug("data: file not found");
        socket.emit('fileNotFound', {error: 'file not found'});
        if (fhistory[socket.room]){
          delete fhistory[socket.room];
        }
        // socket.broadcast.to(socket.room).emit('error', {error: 'file not found'});
      }
    });

    socket.on('compile', function(msg){
      debug('request for compile:', msg);
      compiler.compile(msg.file)
      .then(function(proc){
        if (proc.default){
          proc.default.stdout.on('data', function(data){
            debug('compiler default output:', data.toString());
            socket.emit('compilerOutput', {default: data.toString()});
          });
          proc.default.stderr.on('data', function(err){
            debug('compiler default error:', err.toString());
            socket.emit('compilerError', {error: err.toString()});
          });
          proc.default.on('exit', function(code){
            debug('compiler default exit:', code.toString());
            socket.emit('compilerFinish', {default: code.toString(), exit: true});
          });
          proc.default.on('close', function(code){
            debug('compiler default close:', code.toString());
            socket.emit('compilerFinish', {default: code.toString(), exit: false});
          });
          if (msg.author){
            socket.broadcast.to(socket.room).emit('compilerEvent', {author: msg.author});
          }
        }
        if (proc.custom){
          proc.custom.stdout.on('data', function(data){
            debug('compiler custom output:', data.toString());
            socket.emit('compilerOutput', {custom: data.toString()});
          });
          proc.custom.stderr.on('data', function(err){
            debug('compiler custom error:', err.toString());
            socket.emit('compilerError', {error: err.toString()});
          });
          proc.custom.on('exit', function(code){
            debug('compiler custom exit:', code.toString());
            socket.emit('compilerFinish', {custom: code.toString()});
          });
          proc.custom.on('close', function(code){
            debug('compiler custom close:', code.toString());
            socket.emit('compilerFinish', {custom: code.toString()});
          });
        }
      })
      .catch(function(err){
        debug('compiler error:', err);
        socket.emit("compilerError", {error: err});
      });
    });

    socket.on('run', function(msg){
      debug('request for execute:', flist[socket.room]);
      compiler.execute(flist[socket.room])
      .then(function(proc){
        executor = proc;
        executor.stdout.on('data', function(data){
          debug('exec output:', data.toString());
          socket.emit('execOutput', {output: data.toString()});
        });
        executor.stderr.on('data', function(data){
          debug('exec err output:', data.toString());
          socket.emit('execOutput', {error: data.toString()});
        });
        executor.on('exit', function(code){
          debug('exec exit:', code.toString());
          socket.emit('execFinish', {code: code.toString()});
        });
        executor.on('close', function(code){
          debug('exec close:', code.toString());
          socket.emit('execFinish', {code: code.toString()});
        });
      })
      .catch(function(err){
        debug('executor error:', err);
        socket.emit("execError", {error: err});
      });
    });

    socket.on('execInput', function(msg){
      if (executor){
        executor.stdin.setEncoding('utf-8');
        executor.stdin.write(msg.input + '\n');
        executor.stdin.end();
      }else{
        socket.emit("execErorr", {error: 'process stopped'});
      }
    });

  });

}
