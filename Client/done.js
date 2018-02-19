function setup(){
  document.getElementById('Replay').addEventListener('click', () => document.location.replace("game.html"));
  let head = document.getElementById('ScoreTxt');
  let sco = document.getElementById('Score');
  let token = document.cookie.split(';')[0].split('=')[1];
  let name = document.cookie.split(';')[1].split('=')[1];

  let ip = self.location.hostname;

  let authSocket = io.connect('http://' + ip + ':4000', {'secure': true});
  let highSocket = io.connect('http://' + ip + ':5000');

  httpGet(document.getElementById("scriptJS").src, 'text', false, function(response) {
    authSocket.emit("hash-confirm", CryptoJS.MD5(response.trim()).toString(), "done.js");
  });

  authSocket.on("confirm-hash", (conf) => {
    if(conf.err){
      sco.style.color = "red";
      sco.innerHTML = "Hash confirm failed. Please don't change this file!";
      return;
    }
  });


  authSocket.on('token-confirmation', (work) => {
    if(work){
      console.log('Token confirmed');
      worked();
    } else {
      console.log('Wrong token');
      window.location.replace('index.html');
    }
  });
  sleep(500).then(() => {
    console.log('Checking token');
    authSocket.emit('confirm-token', name, bigInt(token,32).add(bigInt(authSocket.id.replace(/\W+/g, "").replace(/_/g, ''), 64)).toString(32));
  });

  function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function worked() {
    highSocket.emit('set-name', name);
    highSocket.on("name-set", () => {
      console.log("Name is set");
      highSocket.emit("top-5");
    });
    highSocket.on("return-top-5", (top) => {
      console.log(top);
      head.innerHTML = "Your score is";
      sco.innerHTML = "" + document.cookie.split(';')[2].split('=')[1];

      let tbl = document.getElementById('ScoreTbl');
      let tcols = tbl.getElementsByTagName('tr');

      let once = false;

      for(let i in tcols){
        if(i==0){continue}
        try{
          if(top[i-1].name == name && top[i-1].score == document.cookie.split(';')[2].split('=')[1] && !once){
            tcols[i].getElementsByTagName('td')[0].style.fontWeight = "bold";
            tcols[i].getElementsByTagName('td')[1].style.fontWeight = "bold";
            once = true;
          }
          tcols[i].getElementsByTagName('td')[0].innerHTML = top[i-1].name;
          tcols[i].getElementsByTagName('td')[1].innerHTML = top[i-1].score;
        }
        catch(err){
          tcols[i].hidden = true;
        }
      }


    });
    highSocket.on('score-confirm', (ret) => {
      if(ret.type == 'err') {
        console.log(ret.msg);
        head.innerHTML = ret.msg;
      } else {
        if(ret.type == 'highscore') {
          head.innerHTML = "You have a new highscore of";
          sco.innerHTML = "" + ret.score;
        } else {
          head.innerHTML = "Your score is";
          sco.innerHTML = "" + ret.score;
        }
      }
    });
  }
}
