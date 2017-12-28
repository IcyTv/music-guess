//Custom libs
const ms = require('./assets/libs/media-server.js');
const auth = require('./assets/libs/auth-server');
const hs = require('./assets/libs/highscore-server.js');

let songpath = './assets/music/'

//Media Server
ms.getMusic(songpath).then((m) => ms.getServer(m));

//Auth Server
auth.initSql().then(() => {
  console.log('Initialized sql db');
  auth.initAuth();
}).catch((err) => console.log(err));

//Highscore Server
hs.initSql();
hs.startServer();
