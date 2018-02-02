const fs = require('fs');
const NodeID3 = require('node-id3');
const express = require('express');
const request = require('request');
const log = new (require("./log-lib.js"))("MEDIA", 1, "./logfile.log");

let songpath;

function getMusic(s, fb){
    return new Promise((resolve, reject) => {
      let music = {};
      if(fb && fs.existsSync("./assets/libs/fastboot.json")){
        log.info("Fastbooting");
        music = fs.readFileSync("./assets/libs/fastboot.json");
        resolve(JSON.parse(music));
      } else {
        if(fb){
          log.warning("Could not fastboot due to non-existant file");
        }
      songpath = s;
      fs.readdir(songpath , (err, genres) => {
        log.info("Scanning Music");
        for(let genre in genres){
          music[genres[genre]] = {};
          music[genres[genre]]['full'] = {};
          music[genres[genre]]['names'] = [];
          fs.readdir(songpath + genres[genre], (err2, songs) => {
            for(let song in songs){
              //console.log(songs[song]);
              log.info("Scanned song " + songs[song]);
              music[genres[genre]]['names'].push(songs[song]);
              let tags = NodeID3.read(songpath + genres[genre] + '/' + songs[song]);
              music[genres[genre]]['full'][songs[song]] =  tags;
          }});
        }});
        fs.writeFile("./assets/libs/fastboot.json", JSON.stringify(music), "utf-8", (err) => {
          if(err) log.error(err,msg);
          log.info("Fastboot file updated");
        });
      resolve(music);
    }
  });
}


function getServer(music, port){
  const app = express();
  const router = express.Router();
  const server = app.listen(port || 3000, listen);
  const io = require('socket.io')(server);
  // Set up the serve

  // This call back just tells us that the server has started
  function listen() {
    var host = server.address().address;
    var port = server.address().port;
    //console.log('App listening at http://' + host + ':' + port);
    log.info("Server starting at " + host + ":" + port);
  }

  app.use(express.static('public'));

  io.sockets.on('connection',
    // We are given a websocket object in our function
    function(socket) {
      //console.log("We have a new client: " + socket.id);
      log.info("Connection", socket.id);
      let genre;

      socket.on('possible', (genre_) => {
        //console.log(socket.id + ': requested possible for genre: ' + genre_);
        log.info("Requested genre " + genre_, socket.id);
        socket.emit('allpossible', music[genre_]['names']);
        genre = genre_;
      });

      socket.on('disconnect', function() {
        //console.log("Client " + socket.id + " has disconnected");
        log.info("Disconnect", socket.id);
      });

      socket.on('get-album-art', (artist, album) => {
        router.get('/image/' + socket.id, (req, res) => {
          let spath = './assets/pictures/' + req.query.name + '.jpg'
          const stat = fs.statSync(spath);
          const fileSize = stat.size;
          const range = req.headers.range;
          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
              ? parseInt(parts[1], 10)
              : fileSize-1
            const chunksize = (end-start)+1;
            const file = fs.createReadStream(spath, {start, end});
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': 'image/jpg'
            }
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'image/jpg'
            };
            res.writeHead(200, head);
            fs.createReadStream(spath).pipe(res);
          }
        });
      });

      socket.on('request-data', (song) => {
        log.info("Requested data", socket.id);
        socket.emit('return-data', song, music[genre]['full'][song]);
      });

      socket.on('request-song', (song) => {

        router.get('/music/' + socket.id, function(req, res) {
          //console.log(song);
          log.info("Requested song " + song, socket.id);
          song = req.query.song;
          let spath = songpath + genre + '/' + song;
          const stat = fs.statSync(spath);
          const fileSize = stat.size;
          const range = req.headers.range;
          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
              ? parseInt(parts[1], 10)
              : fileSize-1
            const chunksize = (end-start)+1;
            const file = fs.createReadStream(spath, {start, end});
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': 'audio/mp3'
            }
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'audio/mp3'
            };
            res.writeHead(200, head);
            fs.createReadStream(spath).pipe(res);
          }
        });
        app.use('/', router);
      })
    }
  );

  app.use('/music', router);


  var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){

      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };
  return io;
}

module.exports ={
  getServer,
  getMusic
};
