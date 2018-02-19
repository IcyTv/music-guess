const sql = require('./sql-lib.js');
const express = require('express');
const app = express();
const log = new (require("./log-lib"))("HIGHSCORE", 1, "./logfile.log");

function initSql() {
  sql.start().then(() => {
    startServer();
  });
}

function startServer() {
  const server = app.listen(5000, listen);
  const io = require('socket.io')(server);
  app.use(express.static('public'));
  function listen() {
    var host = server.address().address;
    var port = server.address().port;
    //console.log('App listening at http://' + host + ':' + port);
    log.info("Starting at " + host + ":" + port);
  }

  io.on('connection', (socket) => {
    log.info("Connection", socket.id);
    let name;

    socket.on('set-name', (name_) => {
      name = name_;
      log.info("Name set to " + name, socket.id);
      socket.emit('name-set');
    });

    socket.on('score', (score) => {
      if(!name){
        socket.emit('score-confirm', {'type': 'error', 'msg': 'No name set!'});
      } else if(!score){
        socket.emit('score-confirm', {'type': 'error', 'msg': 'No score set!'});
      } else {
        sql.add("highscore", [name, score]);
        log.info("New score = " + score + " for " + name, socket.id);
        socket.emit('score-confirm', {'type': "score", 'score': score});
      }
    });
    socket.on('top-5', () => {
      sql.select("score").then((rows) => {
        socket.emit("return-top-5", rows.slice(0, 5));
      })
      .catch((err) => {
        socket.emit("return-top-5", {error: err});
        log.error(err, socket.id);
      });
    });
  });
}

module.exports = {
  initSql,
  startServer
}
