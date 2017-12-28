const express = require('express');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./assets/libs/db.sql');
const fs = require('fs');

let cmd = 'CREATE TABLE IF NOT EXISTS users (\n';
 cmd += 'id INTEGER PRIMARY KEY AUTOINCREMENT,\n';
 cmd += 'username VARCHAR(64) NOT NULL,\n';
 cmd += 'password VARCHAR(32) NOT NULL,\n';
 cmd += 'salt VARCHAR(16) NOT NULL,\n'
 cmd += 'token VARCHAR(1000),\n';
 cmd += 'highscore INTEGER,\n';
 cmd += 'session_score INTEGER\n';
 cmd += ');'


function start() {
  return new Promise((resolve, reject) => {
    db.serialize(() => db.run(cmd));
    resolve();
  });
}

function log(){
  console.log('LOGGING');
  db.each('SELECT * FROM users', (err, row) => {
    console.log('\n--------------------------\n');
    for(key of Object.keys(row)){
      console.log('  ' + key + ': ' + row[key]);
    }
  });

}


function add(table, items){
  db.prepare('INSERT INTO ' + table + ' VALUES (NULL, ?, ?, ?, ?, NULL, NULL)')
  .run(items[0], items[1], items[2], items[3]);
}

function insert(skey, sval, rkey, rval, pr) {
  if(pr){
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.prepare('UPDATE users SET ' + rkey + ' = "' + rval + '" WHERE "' + skey + '" = "' + sval + '";')
          .run();
        });
        resolve();
    });
  } else {
    db.prepare('UPDATE users SET ' + rkey + ' = "' + rval + '" WHERE "' + skey + '" = "' + sval + '";')
      .run();
  }
}

function close(){
  db.serialize(() => {
    db.close();
  });
}

function lookup(key, nm) {
  return new Promise((resolve, reject) => {
    console.log('SELECT * FROM users WHERE ' + key + ' = "' + nm + '";');
    db.all('SELECT * FROM users WHERE ' + key + ' = "' + nm + '";', (err, row) => {
      if(err){
        console.log(err);
        reject(err);
      } else if(row == undefined){
        console.log('No values found');
        reject('NO VALUES FOUND');
      } else {
        resolve(row);
      }
    });
  }
)}


function reset(){
  return new Promise((resolve, reject) => {
    fs.unlink('./db.sql', (err) => {
    if(err){
      reject(err);
    } else {
      console.log('reset');
    }
    });
    db = new sqlite3.Database('./assets/libs/db.sql');
    resolve();
  });
}

module.exports = {
  start,
  close,
  reset,
  log,
  add,
  lookup,
  insert
}
