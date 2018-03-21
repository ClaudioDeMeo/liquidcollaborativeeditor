const fs = require('fs');
const config = require('./config.js');
const prefix = config.PROJECTFOLDER;
var path = require('path');
var spawn = require('child_process').spawn;

module.exports = {
  compile : function(file){
    const debug = require('debug')('compiler');
    const compiler_config = JSON.parse(fs.readFileSync(config.COMPILER_FILE).toString());
    var cmd = null;
    var defaultcmd = null;
    if(compiler_config[file.language] && compiler_config[file.language].compiler){
      defaultcmd = compiler_config[file.language].compiler.default;
      if(file.os && compiler_config[file.language].compiler[file.os]){
        if(compiler_config[file.language].compiler[file.os].x64){
          cmd = compiler_config[file.language].compiler[file.os].x64;
        }else {
          cmd = compiler_config[file.language].compiler[file.os].x32;
        }
        if(file.arch){
          if(compiler_config[file.language].compiler[file.os][file.arch]){
            cmd = compiler_config[file.language].compiler[file.os][file.arch];
          }
        }
      }
      var end = file.name.lastIndexOf('.');
      var fname = path.join(prefix,file.room,file.name.substring(0, end != -1 ? end : file.name.length) + (file.os ? '-' + file.os : '') + (file.arch ? '-' + file.arch : '') + '.exe');
      var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
      flist[file.fid].compiled = fname;
      fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
      return Promise.resolve({
        default : defaultcmd ? spawn(defaultcmd,[path.join(prefix,file.room,file.name),'-o',fname]) : null,
        custom : cmd ? spawn(cmd,[path.join(prefix,file.room,file.name),'-o',fname]) : null
      });
    }else{
      return Promise.reject("compiler not found for " + file.lanugage);
    }
  },

  execute : function(file){
    const debug = require('debug')('executor');
    const compiler_config = JSON.parse(fs.readFileSync(config.COMPILER_FILE).toString());
    //controllare se esiste file compilato .exe
    if (compiler_config[file.language]){
      if(fs.existsSync(path.join(prefix,file.room,file.name.substring(0,file.name.lastIndexOf('.'))+'.exe'))){
        if (compiler_config[file.language].compiler){
          return Promise.resolve(spawn(path.join(prefix,file.room,file.name.substring(0,file.name.lastIndexOf('.'))+'.exe')));
        }else{//interpreter
          return Promise.resolve(spawn(compiler_config[file.language].interpreter + path.join(prefix,file.room,file.name)));
        }
      }else{
        return Promise.reject('file not found');
      }
    }else{
      return Promise.reject('can not execute ' + file.language);
    }
  }
}
