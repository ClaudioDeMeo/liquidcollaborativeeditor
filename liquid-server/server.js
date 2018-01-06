const config = require('./config');
const fs = require('fs');
const formidable = require('formidable');
const express = require('express');
const prefix = config.PROJECTFOLDER;
var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
var app = express();
var path = require('path');
var randomstring = require("randomstring");

//run janus
const spawn = require('child_process').spawn;
var janus = spawn('janus');
// janus.stdout.on('data', (data) => {
//   console.log(`${data}`);
// });

//server
var http = null;
var https = null;
var server = null;
var port = (config.PROTOCOL == 'https') ? config.HTTPS_PORT : config.HTTP_PORT;
if (config.PROTOCOL == 'https'){
  https = require('https');
  server = https.createServer(config.httpsConfig, app).listen(port);
}else{
  http = require('http');
  server = http.createServer(app).listen(port);
}

require('./socket')(server);

console.log('server listen on port ' + port);

//get file list
app.get('/list/:room', function(req,res){
  res.json({
    list: Object.entries(flist).filter(function(element){
      return element[1].room = req.params.room;
    }).map(function(element){
      var el = element[1];
      el['fid'] = element[0];
      return el;
    }),
  });
});

//upload file
app.post('/upload',function(req, res){
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.encoding = 'utf-8';
  form.uploadDir = prefix;
  var fdata = {
    name: "",
    language: "",
    room: "",
  };
  form.on('field',function(field,value){
    switch(field){
      case 'language':
        fdata.language = value;
        break;
      case 'room':
        fdata.room = value;
        form.uploadDir = path.join(prefix,value);
        break;
    }
  });
  form.on('file', function(field, file) {
    if (!fs.existsSync(form.uploadDir)){
      fs.mkdirSync(form.uploadDir);
    }
    fs.rename(file.path, path.join(form.uploadDir, file.name));
    fdata.name = file.name;
    var index = Object.keys(flist).find(function(element){
      return (flist[element].name == fdata.name) && flist[element].room == fdata.room;
    });
    if (index == undefined){
      var fid = "";
      do {
        fid = randomstring.generate();
      }while(flist[fid]);
      flist[fid] = fdata;
      fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
    }else{
      res.status(406);
      res.end("file already exist");
    }
  });
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
    res.status(500);
    res.end();
  });
  form.on('end', function() {
    res.status(200);
    res.end();
  });
  form.parse(req);
});

//delete file
app.post('/delete', function(req,res){
  if (flist[req.body.fid]){
    var file = path.join(prefix,flist[req.body.fid].name);
    if (fs.existsSync(file)){
      fs.unlinkSync(file);
      delete flist[req.body.fid];
      fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
    }
  }
});

app.use('/liquidproject', express.static(__dirname + '/liquidproject'));
