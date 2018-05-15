# Liquid Collaborative Editor

An experimental collaborative editor based on Liquid philosophy that allow developers to work together in video conference, share code and testing the software directly on the server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

The server-side of this project was made in Node.js so at first you should install Node.js following the instruction descripted at the web page https://nodejs.org/en/download/package-manager

As an alternative to npm you can install the yarn package manager:
On Debian or Ubuntu Linux, you can install Yarn via our Debian package repository. You will first need to configure the repository:

```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
```

Then you can simply:

```
sudo apt-get update && sudo apt-get install yarn
```

The client-side is made with a Polymer framework, so in order to install the dependencies you can install bower:

```
sudo npm i -g bower
```

Install docker in order tho allow remote execution of file by the users https://docs.docker.com/install/

### Installing

Clone the repository and go into project direcoty:

```
git clone https://github.com/ClaudioDeMeo/liquidcollaborativeeditor
cd liquidcollaborativeeditor
```

install the server:

```
yarn
```
or
```
npm install
```

install the client:

```
cd liquidproject
bower install
```
Config the file "config.js" in order to change the follow parameters:
```
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

```

Install new compiler on the server and add it in the file "compiler-config.json" following this structure:
```
{
  "language": {
    "compiler": {
      "default": "default_compiler_command",
      "windows": {
        "x32": "command_for_compile_in_windows_x32",
        "x64": "command_for_compile_in_windows_x64"
      },
      "linux": {
        "x32": "command_for_compile_in_linux_x32",
        "x64": "command_for_compile_in_linux_x64"
      }
    },
    "interpreter": "interpreter_command"
  }
}

```

## Running the server

Run the server with node:

```
node server.js
```

or run the server in debug mode:

```
yarn run debug
```
or
```
npm run debug
```
Open your browser and go on http://localhost:8040.

## Built With

* [Node.js](https://nodejs.org/en/) - Server implementation
* [Express.js](http://expressjs.com/) - Web app framework for Node.js
* [Socket.io](https://socket.io/) - WebSocket framework for Node.js
* [Janus](https://janus.conf.meetecho.com/docs/) - SFU Server for video conference
* [Polymer](https://www.polymer-project.org/2.0/start/) - The web framework used
* [ACE](https://ace.c9.io/) - Library for code editor

## Authors

* **Claudio De Meo** - *Initial work* - [cdemeo](https://github.com/ClaudioDeMeo)
* **Nicola Siena** - *Initial work* - [nicolasiena91](https://github.com/nicolasiena91)

See also the list of [contributors](https://github.com/ClaudioDeMeo/liquidcollaborativeeditor/contributors) who participated in this project.
