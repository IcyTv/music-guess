//Importing requirements
const AES = require('crypto-js/aes');
const CryptoJS = require('crypto-js');
const express = require('express');
const bigInt = require('big-integer');
const fs = require("fs");

//Importing Custom Libraries
const sql = require('./sql-lib.js');
const log = new (require("./log-lib.js"))('AUTH', 0, "./logfile.log");

//Initializing Express App
const app = express();

const access = ["done.js", "game.js", "login.js", "register.js"];

//Public Variables for Diffie-Hellmann
const ps = "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"
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
const g = bigInt(2);

function initAuth() {
  //Starting express server
  const server = app.listen(4000, listen);
  function listen() {
    let host = server.address().address;
    let port = server.address().port;
    log.info("Starting Server at " + host + ":" + port);
  }

  //Starting I/O Connection
  const io = require('socket.io')(server);

  //Defining Socket connection
  io.sockets.on('connection', (socket) => {
    log.info("Connection established", socket.id);
    //Private Server Key
    const xb = bigInt.randBetween("1e77", "1e78");
    //Public Server Key
    const yb = g.modPow(xb, p);
    let secret;
    let uname;

    //Client requests Salt
    socket.on('request-salt', (name) => {
      log.info("Salt requested", socket.id);
      sql.lookup('username', name).then((res) => {
        //Seting Username for Socket Connection
        uname = name;
        //Serving Salt to user
        socket.emit('return-salt', res[0].salt, null);
      }).catch((err) => {
        //Returning Error to User
        socket.emit('return-salt', null, err);
        log.error(err, socket.id);
      });
    });
    socket.on("hash-confirm", (hash, page) => {
      fs.exists("../../../Client/htdocs/" + page, (err) => {
        if(!err && access.includes(page)) {
          fs.readFile("../Client/htdocs/" + page, (err, fc) => {
            if(err){
              log.error("Error while reading file", socket.id);
              socket.emit('confirm-hash', {err: "Wrong hash"});
            } else if(hash == CryptoJS.MD5(fc.toString().trim()).toString()){
              log.info("Hash confirmed", socket.id);
              socket.emit("confirm-hash", {confirmation: true});
            } else {
              log.warning("Wrong hash", socket.id);
              socket.emit("confirm-hash", {err: "Wrong hash"});
            }
          });
        } else {
          log.warning("Access denied to " + page, socket.id);
          socket.emit("confirm-hash", {err:"Access denied"});
        }
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
            //console.log('Correct password');
            //console.log(uname);
            log.info("Correct Password", socket.id);
            log.info("Username set to " + uname, socket.id);
            sql.insert('username', uname, 'token', secret.toString(32), true).then(() => {
              socket.emit('logged-in', 'logged-in');
            });
          } else {
            // console.log('Wrong password');
            log.warning("Wrong Password", socket.id);
            socket.emit('logged-in', 'Wrong password');
          }
        }).catch(() => {
          socket.emit('logged-in', 'No account found');
        });
    });
    socket.on('register', (nm, pw, salt) => {
      pw = bigInt(pw, 32);
      let unencrypt = pw.subtract(secret);
      sql.add('users', [nm, unencrypt.toString(32), salt, secret.toString(32)]);
      // console.log('Registered in: ' + socket.id);
      log.info("Registered", socket.id);
      socket.emit('register-confirm');
    });
    socket.on('total-disconnect', ()=> {
      log.info("Total Disconnect", socket.id);
      sql.insert('username', uname, 'token', null);
      sql.insert('username', uname, 'session_score', null);
    });
    socket.on('confirm-token', (name, encrToken) => {
      log.info('Confirming token', socket.id);
      let token = bigInt(encrToken, 32).subtract(bigInt(socket.id.replace(/\W+/g, "").replace(/_/g, ''), 64));
      sql.lookup('username', name).then((res) => {
        console.log(res[0].token);
        console.log(token.toString(32));
        if(token.eq(bigInt(res[0].token, 32))) {
          log.info("Token confirmed", socket.id);
          socket.emit('token-confirmation', true);
        } else {
          log.warning("Token failed", socket.id);
          socket.emit('token-confirmation', false);
        }
      }).catch((err) => log.error(err, socket.id));
    });
  });
}

function initSql() {
  return new Promise((resolve, reject) => {
    sql.start().then(() => {
      resolve();
    });
  });
}


module.exports = {
  initAuth,
  initSql
}
