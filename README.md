# Liquid Collaborative Editor

An experimental collaborative editor based on Liquid philosophy that allow developers to work together in video conference, share code and testing the software directly on the server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

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
Config the file "config.js".

Install new compiler on the server and add it in the file "compiler-config.json".

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

* [Polymer](https://www.polymer-project.org/2.0/start/) - The web framework used
* [ACE](https://ace.c9.io/) - Library for code editor
* [Janus](https://janus.conf.meetecho.com/docs/) - SFU Server for video conference

## Authors

* **Claudio De Meo** - *Initial work* - [cdemeo](https://github.com/ClaudioDeMeo)
* **Nicola Siena** - *Initial work* - [nicolasiena91](https://github.com/nicolasiena91)

See also the list of [contributors](https://github.com/ClaudioDeMeo/liquidcollaborativeeditor/contributors) who participated in this project.