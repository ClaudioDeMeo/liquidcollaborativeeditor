const fs = require('fs');
const config = require('./config.js');
const prefix = config.PROJECTFOLDER;
var path = require('path');
var spawn= require('child_process').spawn;

module.exports = {
  compile : function(file){
    const debug = require('debug')('compiler');
    const compiler_config = JSON.parse(fs.readFileSync(config.COMPILER_FILE).toString());
    var comando = null;
    var comandoDefault = null;
    if(compiler_config[file.language] && compiler_config[file.language].compiler){
      comandoDefault = compiler_config[file.language].compiler.default;
      if(file.os && compiler_config[file.language].compiler[file.os]){
        if(compiler_config[file.language].compiler[file.os].x64){
          comando = compiler_config[file.language].compiler[file.os].x64;
        }else {
          comando = compiler_config[file.language].compiler[file.os].x32;
        }
        if(file.arch){
          if(compiler_config[file.language].compiler[file.os][file.arch]){
            comando = compiler_config[file.language].compiler[file.os][file.arch];
          }
        }
      }
      var end = file.name.lastIndexOf('.');
      var fname = path.join(prefix,file.room,file.name.substring(0, end != -1 ? end : file.name.length) + (file.os ? '-' + file.os : '') + (file.arch ? '-' + file.arch : '') + '.exe');
      return Promise.resolve({
        default : comandoDefault ? spawn(comandoDefault,[path.join(prefix,file.room,file.name),'-o',fname]) : null;
        custom : comando ? spawn(comando,[path.join(prefix,file.room,file.name),'-o',fname]) : null;
      });
    }else{
      return Promise.reject("compiler not found for " + file.lanugage);
    }
  },

  execute : function(file,callback){
    const debug = require('debug')('executor');
    //controllare se esiste file compilato .exe
    if(fs.existsSync(path.join(prefix,file.room,file.name.substring(0,file.name.lastIndexOf('.'))+'.exe'))){
      console.log('in esecuzione...');
      console.log(path.join(prefix,file.room,file.name.substring(0,file.name.lastIndexOf('.'))+'.exe'));

      //var child = spawn('docker', ['run', '-iv', path.join(prefix,file.room)+':/project', 'ubuntu:16.04', '/project/'+file.name.substring(0,file.name.lastIndexOf('.'))+'.exe']);
      var comando = path.join(prefix,file.room,file.name.substring(0,file.name.lastIndexOf('.'))+'.exe');
      //var child = spawn(comando, [], { stdio: 'inherit' });
      var child = spawn(comando);
      child.on('close',function(code,signal){
        console.log('execute close with '+`code ${code} and signal ${signal}`);
      });
      // child.stdin.pipe(process.stdin);
      // // child.stdout.pipe(process.stdout);
      // //
      child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
        // child.stdin.write('ciao\n');
        callback(`${data}`);
      });
      // process.stdout.on('data', (data) => {
      //   console.log(`process stdout:\n${data}`);
      //   //process.stdin.write('ciao\n');
      //   callback(`${data}`);
      // });
      // // //
      // process.stderr.on('data', (data) => {
      //   console.log(`process stderr:\n${data}`);
      //   callback(`${data}`);
      // });
      // child.stdin.write('\n');
      //process.stdin.pipe(child.stdin)

    }else {
      console.log('file eseguibile non trovato!')
    }
    callback && callback(false);
  }
}
