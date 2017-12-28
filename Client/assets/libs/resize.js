let maxftsize = 900;
let minftsize = 30;
let fscalefactor = 0.05;
let albumimg;
let imgsfactor = 0.15;

function windowResized(){
  //Dynamic fontsize
  let fontsz = windowWidth * fscalefactor;
  if(fontsz > maxftsize){
    fontsz = maxftsize;
  } else if(fontsz < minftsize){
    fontsz = minftsize;
  }
  for(btn of ansbtns){
    btn.style.fontSize = fontsz + 'px';
  }

  //Dynamic img size
  let s = windowWidth*imgsfactor;
  albumimg.width = s;
  albumimg.height = s;
}


const isMobile = {
    getUserAgent: () => {
        return navigator.userAgent;
    },
    Android: function() {
        return /Android/i.test(isMobile.getUserAgent()) && !isMobile.Windows();
    },
    BlackBerry: function() {
        return /BlackBerry|BB10|PlayBook/i.test(isMobile.getUserAgent());;
    },
    iPhone: function() {
        return /iPhone/i.test(isMobile.getUserAgent()) && !isMobile.iPad() && !isMobile.Windows();
    },
    iPod: function() {
        return /iPod/i.test(isMobile.getUserAgent());
    },
    iPad: function() {
        return /iPad/i.test(isMobile.getUserAgent());
    },
    iOS: function() {
        return (isMobile.iPad() || isMobile.iPod() || isMobile.iPhone());
    },
    Opera: function() {
        return /Opera Mini/i.test(isMobile.getUserAgent());
    },
    Windows: function() {
        return /Windows Phone|IEMobile|WPDesktop/i.test(isMobile.getUserAgent());
    },
    KindleFire: function() {
        return /Kindle Fire|Silk|KFAPWA|KFSOWI|KFJWA|KFJWI|KFAPWI|KFAPWI|KFOT|KFTT|KFTHWI|KFTHWA|KFASWI|KFTBWI|KFMEWI|KFFOWI|KFSAWA|KFSAWI|KFARWI/i.test(isMobile.getUserAgent());
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};
