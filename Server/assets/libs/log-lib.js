//CUSTOM LOGGING MODULE BY @IcyTv

const fs = require("fs");

let reset_color = "\x1b[0m";

//Custom String formatting
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var args = ("string" === typeof arguments[0] || "number" === typeof arguments[0]) ? Array.prototype.slice.call(arguments) : arguments[0];
        for (let key of Object.keys(args)) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

class log{
  constructor(execs, lvl, loggingFile, form){
    this.format = form || '[{color}{status}{reset_color}]: {executing_script} - {time}: {client_id}{message}';
    this.logFile = loggingFile || "C:/logfile.log";
    this.starttime = new Date();
    this.execscript = execs;
    this.level = lvl;

    this.logFileStream = fs.createWriteStream(this.logFile, {flags: "a"});
    //console.log(logFileStream);
    this.logConsole = new console.Console(this.logFileStream, this.logFileStream);
    if(this.execscript == "Main" || this.execscript == "Server"){
      logConsole.log("Starting new Instance at " + this.starttime.toLocaleString() + "\n");
      this.info("Server is starting");


      process.stdin.resume();//so the program will not close instantly

      function exitHandler(options, err) {
        if(options.force){
          this.logConsole.log("Force quit");
          console.log("Force quit");
        }
          if (options.cleanup){
            this.logConsole.log('');
            this.logFileStream.close();
          }
          if (err) console.log(err.stack);
          if (options.exit) process.exit();
      }

      //do something when app is closing
      process.on('exit', exitHandler.bind(null,{cleanup:true, exit:true}));

      //catches ctrl+c event
      process.on('SIGINT', exitHandler.bind(null, {cleanup:true, force:true, exit:true}));

      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
      process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

      //catches uncaught exceptions
      process.on('uncaughtException', exitHandler.bind(null, {cleanup:true, force:true, exit:true}));

    }
  }
  info(msg, client_id){
    let color = "\x1b[90m";
    client_id = client_id || "";
    if(client_id != ""){client_id += ": "}
    let out = this.format.formatUnicorn({executing_script: this.execscript, status: "INFO", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
    console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
    if(this.level <= 0){
      this.logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
    }
  }
  warning(msg, client_id){
    let color = "\x1b[93m";
    client_id = client_id || "";
    if(client_id != ""){client_id += ": "}
    let out = this.format.formatUnicorn({executing_script: this.execscript, status: "WARNING", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
    console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
    if(this.level <= 1) {
      this.logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
    }
  }
  error(msg, client_id){
    let color = "\x1b[91m";
    client_id = client_id || "";
    if(client_id != ""){client_id += ": "}
    let out = this.format.formatUnicorn({executing_script: this.execscript, status: "ERROR", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
    console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
    if(this.level <= 2){
      this.logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
    }
  }
  critical(msg, client_id){
    let color = "\x1b[31m";
    client_id = client_id || "";
    if(client_id != ""){client_id += ": "}
    let out = this.format.formatUnicorn({executing_script: this.execscript, status: "CRITICAL", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
    console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
    this.logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
  }
}










//END CLEANUP
// process.stdin.resume();//so the program will not close instantly
//
// function exitHandler(options, err) {
//     if (options.cleanup){
//       logConsole.log('');
//       logFileStream.close();
//     }
//     if (err) console.log(err.stack);
//     if (options.exit) process.exit();
// }
//
// //do something when app is closing
// process.on('exit', exitHandler.bind(null,{cleanup:true, exit:true}));
//
// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, {cleanup:true, exit:true}));
//
// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
//
// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {cleanup:true,exit:true}));



// let format = '[{color}{status}{reset_color}]: {executing_script} - {time}: {client_id}{message}';
// let logFile = "C:/logfile.log";
// let starttime;
// let execscript;
// let level;
//
//
//
// function setup(execs, lvl, loggingFile, form){
//   execscript = execs;
//   level = lvl;
//   logFile = loggingFile || logFile;
//   logFileStream = fs.createWriteStream(logFile, {flags: "a"});
//   //console.log(logFileStream);
//   logConsole = new console.Console(logFileStream, logFileStream);
//   format = form || format;
//   starttime = new Date();
//   if(execscript == "Main" || execscript == "Server"){
//     logConsole.log("Starting new Instance at " + starttime.toLocaleString() + "\n");
//     info("Server is starting");
//   }
// }
//
// //LOGGING MODES
// function info(msg, client_id){
//   let color = "\x1b[90m";
//   client_id = client_id || "";
//   if(client_id != ""){client_id += ": "}
//   let out = format.formatUnicorn({executing_script: execscript, status: "INFO", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
//   console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
//   if(level <= 0){
//     logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
//   }
// }
// function warning(msg, client_id){
//   let color = "\x1b[93m";
//   client_id = client_id || "";
//   if(client_id != ""){client_id += ": "}
//   let out = format.formatUnicorn({executing_script: execscript, status: "WARNING", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
//   console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
//   if(level <= 1) {
//     logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
//   }
// }
// function error(msg, client_id){
//   let color = "\x1b[91m";
//   client_id = client_id || "";
//   if(client_id != ""){client_id += ": "}
//   let out = format.formatUnicorn({executing_script: execscript, status: "ERROR", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
//   console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
//   if(level <= 2){
//     logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
//   }
// }
// function critical(msg, client_id){
//   let color = "\x1b[31m";
//   client_id = client_id || "";
//   if(client_id != ""){client_id += ": "}
//   let out = format.formatUnicorn({executing_script: execscript, status: "CRITICAL", time: new Date().toLocaleTimeString(), message: msg, "client_id": client_id});
//   console.log(out.formatUnicorn({"color": color, "reset_color": reset_color}));
//   logConsole.log(out.formatUnicorn({"color": "", "reset_color": ""}));
// }

//setup("Main",1, "./logfile.log");

module.exports = log;
