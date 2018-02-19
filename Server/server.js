#!/usr/bin/env node


const http = require('http');
const fs = require('fs');
const jsObfuscator = require('js-obfuscator');
const log = new (require("./assets/libs/log-lib.js"))("MAIN", 0, "./logfile.log");

const options = {
  keepLinefeeds:      false,
  keepIndentations:   false,
  encodeStrings:      false,
  encodeNumbers:      false,
  moveStrings:        false,
  replaceNames:       false,
  variableExclusions: [ '^_get_', '^_set_', '^_mtd_' ]
};

const include = ["login.js", "done.js", "register.js", "game.js"];


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

let exec = false;

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

parser.addArgument(["-s", "--server"], {
  action: "storeTrue",
  help: "Enable the http server"
});

parser.addArgument(["-e", "--every"], {
  action: "storeTrue",
  help: "Enable all servers"
});

let args = parser.parseArgs();
// console.log(new rsa().generateKeyPair().encrypt("HELLO"));
// console.log(new rsa().generateKeyPair().sign("HELLO"));

//Media Server
if(args.media || args.every){
  ms.getMusic('./assets/music/', args.fastboot).then((m) => ms.getServer(m));
  exec = true;
}

//Auth Server
if(args.auth || args.every){
  auth.initSql().then(() => {
    auth.initAuth();
  }).catch((err) => console.log(err));
  exec = true;
}
//Highscore Server
if(args.highscore || args.every){
  hs.startServer();
  exec = true;
}

if(args.server || args.every){
  log.info("Starting http server at ::::8000");
  http.createServer((req, res) => {
    if(req.url === "/"){
      req.url = "/index.html";
    } if(req.url.slice(1,-1).indexOf("/") > 0){
      // res.statusCode = 403;
      // res.write("Forbidden");
      // res.end();
      // return;
    }

    log.info("Requested " + req.url);
    if(req.url.endsWith(".js") && include.indexOf(req.url.replace("/", "").trim()) > -1){
      fs.readFile('../Client' + req.url, 'utf-8', function(err, data){

        if(err){
          info.warning(err);
        } else {
          //res.writeHead(200, {'Content-Type': 'text/html'});
          jsObfuscator(data, options).then((obscure) => {
            log.info("Success in obscuring js");
            //console.log(obscure);
            res.write(obscure);
            res.end();
          }).catch((err) => {
            log.error(err);
          });
        }
      });
    } else {
      fs.readFile("../Client" + req.url, "utf-8", (err, data) => {
        if(err){
          res.statusCode = 404;
          res.write("Not found");
          res.end();
        } else {
          res.write(data);
          res.end();
        }
      });
    }
  }).listen(8000);
  exec = true;
}


if(!exec){
  console.log("Please supply arguments. To get help type -h");
}
