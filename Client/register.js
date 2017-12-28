function setup() {
  let name, pw, cpw;
  let errormsg;
  let socket;
  let g, p, xa, ya, yb, secret;

  socket = io.connect('http://192.168.1.14:4000');
  DH();
  name = document.getElementById('username');
  pw = document.getElementById('password');
  cpw = document.getElementById('confirm-pw');
  errormsg = document.getElementById('error-msg');
  document.getElementById('submit-btn').addEventListener('click', submit);
  socket.on('register-confirm', () => {
    document.cookie = "token=" + secret.toString(32) + ";domain=;path=/";
    document.cookie = "name=" + name.value + ";domain=;path=/";
    window.location.replace('game.html');
  });

  function submit() {
    if(secret == undefined) {
      errormsg.style.color = 'red';
      errormsg.innerHTML = "We are still establishing a secure connection";
    }
    else if(pw.value != cpw.value){
      errormsg.style.color = "red";
      errormsg.innerHTML = "Passwords don't match!";
    } else {
      let salt = ("0000000" + Math.floor(Math.random() * (Math.pow(10, 12)-Math.pow(10,8)) + Math.pow(10,8)).toString(16)).slice(-9, -1).toUpperCase();
      let algo = CryptoJS.algo.SHA256.create();
      algo.update(pw.value, 'utf-8');
      algo.update(salt, 'utf-8');
      let encyptpw = secret.add(bigInt(algo.finalize().toString(), 32));

      socket.emit('register', name.value, encyptpw.toString(32), salt);
    }
  }
  function DH() {
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

    socket.emit("request-gp");
    xa = bigInt.randBetween("1e77", "1e78");
  }
}

function keyPressed() {
  if(keyCode == RETURN){
    submit();
  }
}
