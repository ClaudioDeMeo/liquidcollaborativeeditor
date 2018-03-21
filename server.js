const debug = require('debug')('server');
const config = require('./config');
const fs = require('fs');
const formidable = require('formidable');
const express = require('express');
const bodyParser = require('body-parser');
const prefix = config.PROJECTFOLDER;
// var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
var app = express();
var path = require('path');
var randomstring = require("randomstring");

//run janus
// const spawn = require('child_process').spawn;
// var janus = spawn('janus');
// janus.stdout.on('data', (data) => {
//   debug(`${data}`);
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
debug("create server:", config.PROTOCOL);

function auth(room,password){
  var rlist = JSON.parse(fs.readFileSync(config.ROOMLIST).toString());
  return rlist[room] && rlist[room].password == password;
}

//real-time comunication
require('./socket')(server);
console.log('server ' + config.PROTOCOL + ' listen on port ' + port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//get file list
app.post('/list/:room', function(req,res){
  var rlist = JSON.parse(fs.readFileSync(config.ROOMLIST).toString());
  if (rlist[req.params.room]){
    if (auth(req.params.room,req.body.password)){
      var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
      res.json({
        list: Object.entries(flist).filter(function(element){
          return element[1].room == req.params.room;
        }).map(function(element){
          var el = element[1];
          el['fid'] = element[0];
          return el;
        })
      });
    }else{
      res.status(401);
      res.end("Unauthorized");
    }
  }else{
    res.status(204);
    res.end("Room not found");
  }
});

app.get('/info/:fid', function(req, res){
  var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
  if (flist[req.params.fid]){
    res.json(flist[req.params.fid]);
  }else{
    res.status(404);
    res.end();
  }
});

//download a file
app.post('/download/:fid', function(req,res){
  var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
  var fid = req.params.fid;
  if (flist[fid]){
    if (auth(flist[fid].room,req.body.password)){
      var fpath = path.join(prefix,flist[fid].room,flist[fid].name);
      if (!fs.existsSync(fpath)){
        fpath = path.join(prefix,'empty.file');
      }
      res.download(fpath,flist[fid].name,function(err){
        if (err){
          res.status(500);
          res.end("Error");
        }else {
          res.status(200);
          res.end("Ok");
        }
      });
    }else{
      res.status(401);
      res.end("Unauthorized");
    }
  }else{
    res.status(404);
    res.end("File not found");
  }
});

//create new file
app.post('/newfile',function(req,res){
  var rlist = JSON.parse(fs.readFileSync(config.ROOMLIST).toString());
  var fdata = {
    name : req.body.name,
    language : req.body.language,
    room : req.body.room
  };
  var password = req.body.password;
  if (!rlist[fdata.room]){
    rlist[fdata.room] = {
      password: password
    };
  }
  if (rlist[fdata.room].password == password){
    var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
    var index = Object.keys(flist).find(function(element){
      return (flist[element].name == fdata.name) && flist[element].room == fdata.room;
    });
    if (index === undefined){
      var fid = "";
      do {
        fid = randomstring.generate();
      }while(flist[fid]);
      flist[fid] = fdata;
      if (!fs.existsSync(path.join(prefix,fdata.room))){
        fs.mkdirSync(path.join(prefix,fdata.room));
      }
      fs.writeFileSync(path.join(prefix,fdata.room,fdata.name),"");
      fs.writeFileSync(config.ROOMLIST,JSON.stringify(rlist));
      fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
      res.status(200);
      res.end("File added");
    }else{
      res.status(406);
      res.end("file already exist");
    }
  }else{
    res.status(401);
    res.end("Unauthorized");
  }

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
  var password = null;
  form.on('field',function(field,value){
    switch(field){
      case 'language':
        fdata.language = value;
        break;
      case 'room':
        fdata.room = value;
        form.uploadDir = path.join(prefix,value);
        break;
      case 'password':
        password = value;
        break;
    }
  });
  form.on('file', function(field, file) {
    var rlist = JSON.parse(fs.readFileSync(config.ROOMLIST).toString());
    var tempRoom = {
      password: password,
    };
    if (tempRoom.password == password){
      if (!fs.existsSync(form.uploadDir)){
        fs.mkdirSync(form.uploadDir);
      }
      fs.rename(file.path, path.join(form.uploadDir, file.name));
      fdata.name = file.name;
      var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
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
        if (!rlist[fdata.room]){
          rlist[fdata.room] = tempRoom;
          fs.writeFileSync(config.ROOMLIST,JSON.stringify(rlist));
        }
      }else{
        res.status(406);
        res.end("file already exist");
      }
    }else{
      res.status(401);
      res.end("Unauthorized")
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
  var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
  if (flist[req.body.fid]){
    if (auth(flist[req.body.fid].room,req.body.password)){
      var file = path.join(prefix,flist[req.body.fid].room,flist[req.body.fid].name);
      if (fs.existsSync(file)){
        fs.unlinkSync(file);
        var fileexe = path.join(prefix,flist[req.body.fid].room,flist[req.body.fid].compiled;
        if (flist[req.body.fid].compiled && fs.existsSync(fileexe)){
          fs.unlinkSync(fileexe);
        }
        if(fs.readdirSync(path.join(prefix,flist[req.body.fid].room)).length == 0){
          fs.rmdirSync(path.join(prefix,flist[req.body.fid].room));
        }
      }
      var room = flist[req.body.fid].room;
      delete flist[req.body.fid];
      fs.writeFileSync(config.FILELIST,JSON.stringify(flist));
      var rlist = JSON.parse(fs.readFileSync(config.ROOMLIST).toString());
      var finRoom = Object.entries(flist).filter(function(element){
        return element[1] && element[1].room == room;
      }).length;
      if (finRoom == 0){
        delete rlist[room];
      }
      fs.writeFileSync(config.ROOMLIST,JSON.stringify(rlist));
      res.status(200);
      res.end("Ok");
    }else{
      res.status(401);
      res.end("Unauthorized");
    }
  }else{
    res.status(404);
    res.end("File not Found");
  }
});

app.post('/downloadexe/:fid', function(req,res){
  var flist = JSON.parse(fs.readFileSync(config.FILELIST).toString());
  var fid = req.params.fid;
  if (flist[fid]){
    if (auth(flist[fid].room,req.body.password)){
      var fpath = path.join(prefix,flist[fid].room,flist[fid].compiled);
      res.download(fpath,flist[fid].compiled,function(err){
        if (err){
          res.status(500);
          res.end("Error");
        }else {
          res.status(200);
          res.end("Ok");
        }
      });
    }else{
      res.status(401);
      res.end("Unauthorized");
    }
  }else{
    res.status(404);
    res.end("File not found");
  }
});

app.use(express.static('liquidproject', { fallthrough: true }));

app.use(function(req, res){
    res.sendFile(__dirname + '/liquidproject/index.html');
});
