function setup(){
  let socket;
  let g, p, xa, ya, yb, secret;

  let pwfield;
  let nmfield;
  let txt;

  let ip = self.location.hostname;

  document.addEventListener('keypress', enterPress);

  if(document.cookie.split(';')[0].split('=')[1]){
    window.location.href = 'game.html';
  }
  document.getElementById("submit-btn").addEventListener("click", clicked);
  txt = document.getElementById('wait-txt');
  nmfield = document.getElementById('username');
  pwfield = document.getElementById('password');

  socket = io.connect("http://" + ip + ":4000", {'secure': true});

  socket.emit("hash-confirm", CryptoJS.MD5(setup.toString().trim()).toString(), "login.js");

  socket.on("confirm-hash", (conf) => {
    if(conf.err){
      txt.style.color = "red";
      txt.innerHTML = "Hash confirm failed. Please don't change this file!";
      return;
    }
  });

  //Socket.on events
  socket.on("return-gp", (g_, p_) => {
    console.log("g, p returned");
    g = bigInt(g_);
    p = bigInt(p_);
    ya = g.modPow(xa, p);
    socket.emit("key", ya);
  });
  socket.on("return-key", (yb_) => {
    yb = bigInt(yb_);
    secret = yb.modPow(xa, p);
  });
  socket.on("logged-in", (ret) => {
    if(ret == 'logged-in'){
      console.log('logged in');
      document.cookie = "token=" + secret.toString(32) + ";domain=;path=/";
      document.cookie = "name=" + nmfield.value + ";domain=;path=/";
      window.location.replace("game.html");
    } else {
      console.log(ret);
      txt.innerHTML = ret;
    }
  });

  socket.on('return-salt', (salt, err) => {
    console.log('returned salt');
    if(err) {
      console.log(err);
      txt.style.color = "red";
      txt.innerHTML = "No account with the name \"" + nmfield.value + "\" found!";
    } else {
      let algo = CryptoJS.algo.SHA256.create();
      algo.update(pwfield.value, 'utf-8');
      algo.update(salt, 'utf-8');
      let tmppw = algo.finalize().toString();
      let encyptpw = secret.add(bigInt(tmppw, 32));
      console.log('epw = ' + encyptpw.toString(32));
      socket.emit('login', encyptpw.toString(32));
    }
  });


  //DH Workflow
  socket.emit("request-gp");
  xa = bigInt.randBetween("1e77", "1e78");


  function sleep(time){
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  function enterPress(event) {
    if(event.key == 'Enter'){
      clicked();
    }
  }

  function login(){
    if(pwfield.value.length < 8){
      txt.style.color = "red";
      txt.innerHTML = "Password too short!";
    }else if(nmfield.value.length < 4){
      txt.style.color = "red";
      txt.innerHTML = "Username too short!";
    } else {
      console.log('login');
      socket.emit('request-salt', nmfield.value);
    }
  }

  function clicked(){
    console.log("clicked");
    if(secret != undefined){
      console.log("Logging in");
      txt.innerHTML = "Logging in";
      txt.style.color = "#009400";
      login();
    } else {
      txt.style.color = "red";
      txt.innerHTML = "Please wait while we are establishing a secure connection";
      sleep(500).then(wait);
      function wait(){
        if(secret == undefined){
        } else {
          txt.innerHTML = "Now try to login";
          txt.style.color = "009400";
          login();
        }
      }
      sleep(500).then(wait);
    }
  }
}
