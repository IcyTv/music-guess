#!/usr/bin/env node

//Custom libs
const ms = require('./assets/libs/media-server.js');
const auth = require('./assets/libs/auth-server');
const hs = require('./assets/libs/highscore-server.js');
const rsa = require("node-rsa");
const parser = new (require("argparse").ArgumentParser)({
  version: 'alpha 0.0.1',
  addHelp: true,
  description: 'Server-side for MusicGuess'
});

parser.addArgument(["-f", "--fastboot"], {
  action: "storeTrue",
  help: "Enable fastboot"
});

parser.addArgument(["-m, --media"], {
  action: "storeTrue",
  help: "Enable media server"
});

parser.addArgument(["-a", "--auth"], {
  action: "storeTrue",
  help: "Enable Authentication server"
});

parser.addArgument(["-hi", "--highscore"], {
  action: "storeTrue",
  help: "Enable highscore server"
});

parser.addArgument(["-e", "--every"], {
  action: "storeTrue",
  help: "Enable all servers"
});

let args = parser.parseArgs();

console.log(new rsa().generateKeyPair().encrypt("HELLO"));
console.log(new rsa().generateKeyPair().sign("HELLO"));

//Media Server
if(args.media || args.every){
  ms.getMusic('./assets/music/', args.fastboot).then((m) => ms.getServer(m));
}

//Auth Server
if(args.auth || args.every){
  auth.initSql().then(() => {
    auth.initAuth();
  }).catch((err) => console.log(err));
}
//Highscore Server
if(args.highscore || args.every){
  hs.startServer();
}
