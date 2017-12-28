const sql = require('./sql-lib.js');
const express = require('express');
const app = express();
const server = app.listen(5000, listen);
const io = require('socket.io')(server);

function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://' + host + ':' + port);
}


function initSql() {
  sql.start().then(() => {
    startServer();
  });
}

function startServer() {
  app.use(express.static('public'));

  io.on('connection', (socket) => {
    console.log('New client: ' + socket.id);
    let name;
    let scorec = 0;

    socket.on('set-name', (name_) => {
      name = name_;
      socket.emit('name-set');
    });

    socket.on('score', (score) => {
      scorec += 1;
      if(!name){
        socket.emit('score-confirm', {'type': 'error', 'msg': 'No name set!'});
      } else if(!score){
        socket.emit('score-confirm', {'type': 'error', 'msg': 'No score set!'});
      } else {
        sql.lookup('username', name).then((row) => {
          row = row[0];
          if(row.highscore && row.highscore < score){
            sql.insert('username', name, 'highscore', score);
            socket.emit('score-confirm', {'type': 'highscore', 'score': score});
          } else if(!row.highscore) {
            sql.insert('username', name, 'highscore', score);
            socket.emit('score-confirm', {'type': 'highscore', 'score': score});
          } else {
            sql.insert('username', name, 'session_score', score);
            socket.emit('score-confirm', {'type': 'score', 'score': score});
          }
        });
      }
    });
    socket.on('request-score', () => {
      if(!name){
        socket.emit('return-score', {'type': 'error', 'msg': 'No name set!'});
      } else {
        sql.lookup('username', name).then((res) => {
          res = res[0];
          if(scorec < 1) {
            if(res.highscore) {
              socket.emit('return-score', {'type': 'highscore', 'score': res.highscore});
            } else {
              socket.emit('return-score', {'type': 'error', 'msg': 'No score defined!'});
            }
          } else {
            if(res.highscore && res.session_score) {
              socket.emit('return-score', [{'type': 'highscore', 'score': res.highscore}, {'type': 'score', 'score': res.session_score}]);
            } else if(res.highscore && !res.session_score) {
              socket.emit('return-score', {'type': 'highscore', 'score': res.highscore});
            } else if(!res.highscore && res.session_score) {
              socket.emit('return-score', {'type': 'score', 'score': res.session_score});
            } else {
              socket.emit('return-score', {'type': 'error', 'msg': 'No scores found!'});
            }
          }
        });
      }
    });
  });
}

module.exports = {
  initSql,
  startServer
}
