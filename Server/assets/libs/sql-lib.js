const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const sqlString = require('sqlstring');
let db = new sqlite3.Database('./assets/libs/db.sql');
const fs = require('fs');

let cmd = 'CREATE TABLE IF NOT EXISTS users (\n';
 cmd += 'id INTEGER PRIMARY KEY AUTOINCREMENT,\n';
 cmd += 'username VARCHAR(64) NOT NULL,\n';
 cmd += 'password VARCHAR(32) NOT NULL,\n';
 cmd += 'salt VARCHAR(16) NOT NULL,\n'
 cmd += 'token VARCHAR(1000)\n';
 cmd += ');'

let highcmd = 'CREATE TABLE IF NOT EXISTS highscore (\n';
 highcmd += 'name VARCHAR(64),\n';
 highcmd += 'score INTEGER\n';
 highcmd += ');';

function start() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(cmd);
      db.run(highcmd);
    });
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
  if(table == "users"){
    db.prepare('INSERT INTO ' + table + ' VALUES (NULL, ?, ?, ?, ?)')
    .run(items[0], items[1], items[2], items[3]);
  } else if(table == "highscore"){
    db.prepare('INSERT INTO ' + table + ' VALUES (?,?)')
    .run(items[0], items[1]);
  }
}

function insert(skey, sval, rkey, rval, pr, table) {
  table = table || "users";
  return new Promise((resolve, reject) => {
    db.prepare('UPDATE ' + table + ' SET ' + rkey + ' =  ? WHERE ' + skey + ' = ?;')
     .run(rval, sval);
    resolve();
  });
}

function close(){
  db.serialize(() => {
    db.close();
  });
}

function lookup(key, nm, table) {
  table = table || "users";
  return new Promise((resolve, reject) => {
    //console.log('SELECT * FROM users WHERE ' + key + ' = "' + nm + '";');
    db.all('SELECT * FROM ' + table + ' WHERE ' + key + ' = "' + nm + '";', (err, row) => {
      if(err){
        //console.log(err);
        reject(err);
      } else if(row == undefined){
        //console.log('No values found');
        reject('NO VALUES FOUND');
      } else {
        resolve(row);
      }
    });
  }
)}

function select(ord_by) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM highscore ORDER BY ' + ord_by + ' desc', (err, row) => {
      if(err) {
        //console.log(err);
        reject(err);
      } else if(row == undefined){
        //console.log('No values found');
        reject('NO VALUES FOUND');
      } else {
        resolve(row);
      }
    });
  });
}

function reset(){
  return new Promise((resolve, reject) => {
    fs.unlink('./db.sql', (err) => {
    if(err){
      reject(err);
    } else {
      //console.log('reset');
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
  //log,
  add,
  lookup,
  insert,
  select
}
