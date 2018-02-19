function setup(){
  window.ansbtns = [];
  let answer = "";
  let socket;
  let possible = [];
  let player;
  let dataCollection = {};
  let wrong = [];
  let feedback;
  let timer;
  let score = 0;
  let stop = 1;
  let params;
  let genre;
  let first = true;
  let token;
  let authSocket;
  let highSocket;

  let ip = self.location.hostname;


  authSocket = io.connect('http://' + ip + ':4000', {'secure':true});
  highSocket = io.connect('http://' + ip + ':5000');
  //Logging in

  httpGet(document.getElementById("scriptJS").src, 'text', false, function(response) {
    console.log(response);
    authSocket.emit("hash-confirm", CryptoJS.MD5(response.trim()).toString(), "game.js");
  });

  authSocket.on("confirm-hash", (conf) => {
    if(conf.err){
      console.log("Hash failed");
      debugger;
      window.location.replace("index.html");
    }
  });

  try {
    token = document.cookie.split(';')[0].split('=')[1];
    if(token == undefined){
      window.location.replace('index.html');
    }
  } catch(err) {
    console.log(err);
    sleep(1000).then(() => window.location.replace('index.html'), 500);
  }
  sleep(500).then(() => {
    let name = document.cookie.split(';')[1].split('=')[1];
    authSocket.emit('confirm-token', name, bigInt(token,32).add(bigInt(authSocket.id.replace(/\W+/g, "").replace(/_/g, ''), 64)).toString(32));
  });

  window.albumimg = document.getElementById('album');
  socket = io.connect('http://'+ ip + ':3000');

  params = getURLParams();

  if(params.genre){
    genre = params.genre;
  } else {
    genre = '80s';
  }

  player = document.getElementById('player');

  let pb = document.getElementById('play');
  let p = navigator.userAgent.toLowerCase();
  if(!isMobile.any()){
    stop = 0;
    pb.style.display = 'none';
  }
  pb.addEventListener('click', () => {
    player.play();
    stop = 1;});
  ansbtns = document.getElementsByClassName('btn-answer');
  ansbtns = Array.from(ansbtns);
  windowResized();

  for(btn of ansbtns){
    btn.addEventListener('click', wrapper(btn));
  }

  socket.on('allpossible', (data) => {
    possible = data;
    reupdate();
  });
  socket.on('return-data', (song, data) => {
    dataCollection[song] = data;
    if(Object.keys(dataCollection).length >= 4){
      cont();
    }
  });
  authSocket.on('token-confirmation', (worked) => {
    if(worked){
      console.log('Token confirmed');
    } else {
      console.log('Wrong token');
      window.location.replace('index.html');
    }
  });

  socket.emit('possible', genre);

  move();

  function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function reupdate(){
    stop = 0;
    dataCollection = {};
    answer = possible[floor(random(0, possible.length))];
    socket.emit('request-data', answer);
    wrong = [];
    while(wrong.length < 3){
      let poss = possible[floor(random(0, possible.length))];
      if(poss == answer || wrong.indexOf(poss) != -1){
        continue;
      }
      wrong.push(poss);
      socket.emit('request-data', poss);
    }
    socket.emit('request-song', answer);
  }

  function cont(){
    if(Object.keys(dataCollection).length < 4){
      sleep(500).then(cont);
      console.log('Sleeping');
    } else {
      try {
        socket.emit('get-album-art', dataCollection[answer].artist, dataCollection[answer].album);
      } catch(err){
        console.log(err);
        //cont();
      }
      player.src = 'http://' + ip + ':3000/music/' + socket.id + '?song=' + encodeURIComponent(answer);
      let unused = ansbtns.slice();
      let ansart = dataCollection[answer].artist;
      let abtn = unused.splice(floor(random(0, unused.length)), 1)[0];
      abtn.value = ansart;
      if(ansart.length > 20){
        ansart = ansart.slice(0,20);
      }
      abtn.innerText = ansart;
      for(btn of unused){
        let tmp = wrong.splice(floor(random(0, wrong.length)), 1)[0];
        let r = dataCollection[tmp].artist;
        btn.value = r;
        if(r.length > 20){
          r = r.slice(0,20);
        }
        btn.innerText = r;
      }
      window.albumimg.src = 'http://' + ip + ':3000/image/' + socket.id + '?name=' + genre;
      if(isMobile.any() && first){
      } else {
        stop = 1;
      }
      first = false;
    }
  }

  function answered(val){
    if(feedback == null){
      feedback = document.getElementById('Identifier');
    }
    if(val.value == dataCollection[answer].artist){
      feedback.innerHTML = 'RIGHT';
      feedback.style.color = '#00FF00';
      score++;
      timer = 0;
      reupdate();
    }else{
      timer += 15*floor(score/3+1);
      feedback.innerHTML = 'WRONG';
      feedback.style.color = '#FF0000';
    }
  }

  function wrapper(value){
    return function(){
      answered(value);
    }
  }


  function move() {
    let bar = document.getElementById('Timer');
    timer = 1;
    let id = setInterval(frame, 10);
    function frame(){
      if(timer >= 100){
        clearInterval(id);
        console.log('done');
        bar.style.width = '100%';
        for(btn of ansbtns){
          btn.disabled = true;
        }
        sleep(1000).then(() => {
          highSocket.emit("set-name", document.cookie.split(';')[1].split('=')[1]);
          highSocket.on('name-set', () => {
            highSocket.emit('score', score);
            document.cookie = 'score=' + score + ';domain=;path=/';
            document.location.replace('done.html');
          });
        });
      } else if(timer < 0){
        timer = 0;
      } else {
        timer += 0.1*((score/3)+1) * stop;
        bar.style.width = timer + '%';
      }
    }
  }
}
