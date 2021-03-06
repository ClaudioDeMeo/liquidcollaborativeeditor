const fs = require('fs');
const config = require('./config.js');
const prefix = config.PROJECTFOLDER;
const path = require('path');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

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
      var defaultFname = path.join(prefix,file.room,file.name.substring(0, end != -1 ? end : file.name.length) + '.exe');
      var fname = path.join(prefix,file.room,file.name.substring(0, end != -1 ? end : file.name.length) + (file.os ? '-' + file.os : '') + (file.arch ? '-' + file.arch : '') + '.exe');
      var defaultProcess = defaultcmd ? spawn(defaultcmd,[path.join(prefix,file.room,file.name),'-o', defaultFname]) : null;
      if (file.os && file.os=='linux' && file.arch && file.arch=='x64'){
        cmd = null;
      }
      var custom = cmd ? spawn(cmd,[path.join(prefix,file.room,file.name),'-o',fname]) : null;
      // if (default){
      //   default.on('exit', function(code){
      //     //IDEA comprimere file per download
      //   });
      // }
      // if (custom){
      //   custom.on('exit', function(code){
      //     //IDEA comprimere file per download
      //   });
      // }
      return Promise.resolve({
        default : defaultProcess,
        custom : custom
      });
    }else{
      return Promise.reject("compiler not found for " + file.language);
    }
  },

  execute : function(file){
    const debug = require('debug')('executor');
    const compiler_config = JSON.parse(fs.readFileSync(config.COMPILER_FILE).toString());
    if (compiler_config[file.language]){
      if (compiler_config[file.language].compiler){
        var fname = file.name.substring(0,file.name.lastIndexOf('.') != -1 ? file.name.lastIndexOf('.') : file.name.length)+'.exe';
        if(fs.existsSync(path.join(prefix,file.room,fname))){
          try {
            return Promise.resolve(spawn('docker',['run','-iv',path.join(prefix,file.room) + ':/project', 'ubuntu:16.04', '/project/'+fname]));
          } catch (e) {
            return Promise.reject('exec error' + e);
          }
        }else{
          return Promise.reject('file not found');
        }
      }else{//interpreter
        if (fs.existsSync(path.join(prefix,file.room,file.name))){
          try {
            return Promise.resolve(spawn('docker',['run','-itv',path.join(prefix,file.room) + ':/project', 'ubuntu:16.04', compiler_config[file.language].interpreter + ' /project/'+ file.name]));
          } catch (e) {
            return Promise.reject('exec error' + e);
          }
        }else{
          return Promise.reject('file not found');
        }
      }
      // var fname = file.name.substring(0,file.name.lastIndexOf('.') != -1 ? file.name.lastIndexOf('.') : file.name.length)+'.exe';
      // if(fs.existsSync(path.join(prefix,file.room,fname))){
      //   if (compiler_config[file.language].compiler){
      //     return Promise.resolve(spawn(path.join(prefix,file.room,fname)));
      //   }else{//interpreter
      //     return Promise.resolve(spawn(compiler_config[file.language].interpreter + path.join(prefix,file.room,file.name)));
      //   }
      // }else{
      //   return Promise.reject('file not found');
      // }
    }else{
      return Promise.reject('can not execute ' + file.language);
    }
  }
}
