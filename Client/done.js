function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function setup(){
  document.getElementById('Replay').addEventListener('click', () => document.location.replace("game.html"));
  let head = document.getElementById('ScoreTxt');
  let sco = document.getElementById('Score');
  let token = document.cookie.split(';')[0].split('=')[1];
  let name = document.cookie.split(';')[1].split('=')[1];

  let authSocket = io.connect('http://192.168.1.14:4000', {'secure': true});
  let highSocket = io.connect('http://192.168.1.14:5000');

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

  function worked() {
    console.log(name);
    highSocket.emit('set-name', name);
    highSocket.on('name-set', () => {
      let score = document.cookie.split(';')[2].split('=')[1];
      highSocket.emit('score', score);
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
