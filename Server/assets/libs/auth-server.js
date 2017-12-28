const sql = require('./sql-lib.js');
const AES = require('crypto-js/aes');
const CryptoJS = require('crypto-js');
const express = require('express');
const bigInt = require('big-integer');
const app = express();


let ps = "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"
      + "29024E088A67CC74020BBEA63B139B22514A08798E3404DD"
      + "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245"
      + "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED"
      + "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D"
      + "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F"
      + "83655D23DCA3AD961C62F356208552BB9ED529077096966D"
      + "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B"
      + "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9"
      + "DE2BCBF6955817183995497CEA956AE515D2261898FA0510"
      + "15728E5A8AACAA68FFFFFFFFFFFFFFFF";

const p = bigInt(ps , 16);
let g = bigInt(2);

function initAuth() {
  const server = app.listen(4000, listen);
  function listen() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Server listening at http://" + host + ":" + port);
  }

  const io = require('socket.io')(server);

  io.sockets.on('connection', (socket) => {
    console.log("New client: " + socket.id);
    const xb = bigInt.randBetween("1e77", "1e78");
    const yb = g.modPow(xb, p);
    let secret;
    let uname;

    socket.on('request-salt', (name) => {
      console.log('Client ' + socket.id + ': requested salt');
      sql.lookup('username', name).then((res) => {
        uname = name
        socket.emit('return-salt', res[0].salt, null);
      }).catch((err) => {
        socket.emit('return-salt', null, err);
        console.log('error: ' + err);
      });
    });
    socket.on("request-gp", () => {
      socket.emit("return-gp", g, p);
    });
    socket.on("key", (ya) => {
      socket.emit("return-key", yb);
      ya = bigInt(ya);
      secret = ya.modPow(xb, p);
    });
    socket.on('login', (pw) => {
      let unencrypt = bigInt(pw, 32).subtract(secret);
      sql.lookup('username', uname)
        .then((result) => {
          if(bigInt(result[0].password, 32).eq(unencrypt)){
            console.log('Correct password');
            console.log(uname);
            sql.insert('username', uname, 'token', secret.toString(32), true).then(() => {
              socket.emit('logged-in', 'logged-in');
            });
          } else {
            console.log('Wrong password');
            socket.emit('logged-in', 'Wrong password');
          }
        }).catch(() => {
          socket.emit('logged-in', 'No account found');
        });
    });
    socket.on('register', (nm, pw, salt) => {
      console.log(salt);
      pw = bigInt(pw, 32);
      let unencrypt = pw.subtract(secret);
      sql.add('users', [nm, unencrypt.toString(32), salt, secret.toString(32)]);
      console.log('Registered in: ' + socket.id);
      socket.emit('register-confirm');
    });
    socket.on('total-disconnect', ()=> {
      sql.insert('username', uname, 'token', null);
      sql.insert('username', uname, 'session_score', null);
    });
    socket.on('confirm-token', (name, encrToken) => {
      console.log('Confirming token for ' + socket.id);
      let token = bigInt(encrToken, 32).subtract(bigInt(socket.id.replace(/\W+/g, "").replace(/_/g, ''), 64));
      sql.lookup('username', name).then((res) => {
        if(token.eq(bigInt(res[0].token, 32))) {
          console.log('Confirmed token for ' + socket.id);
          socket.emit('token-confirmation', true);
        } else {
          console.log('token failed');
          console.log(token);
          console.log(secret);
          socket.emit('token-confirmation', false);
        }
      }).catch((err) => console.log(err));
    });
  });
}

function initSql() {
  return new Promise((resolve, reject) => {
    sql.reset().then(() => {
      sql.start().then(() => {
        resolve();
      });
    });
  });
}


module.exports = {
  initAuth,
  initSql
}
