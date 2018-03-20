var fs = require('fs');
module.exports = {
  //project folder
  PROJECTFOLDER : __dirname + '/projects/',

  //listo of project files
  FILELIST : __dirname + '/filelist.json',

  //listo of project files
  ROOMLIST : __dirname + '/roomlist.json',

  //file compiler config
  COMPILER_FILE: __dirname + '/compiler-config.json',

  //file buffer length
  HISTORY_LENGTH : 1000,

  //SSL
  httpsConfig : {
      key: fs.readFileSync(__dirname + '/ssl/keyfile.key'),
      cert: fs.readFileSync(__dirname + '/ssl/certfile.pem')
      //ca: fs.readFileSync('/etc/ssl/private/CAfile.pem')
  },

  //Protocol
  PROTOCOL : 'http',

  //HTTP/HTTPS local Server
  HTTP_PORT : 8040,
  HTTPS_PORT : 8140,

}
