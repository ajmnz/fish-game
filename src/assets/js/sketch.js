import './p5.sound';
import Fish from './fish';
import VT323 from '../fonts/VT323-Regular.ttf';
import background from '../img/background.jpg';

// Propietats del canvas
const canvas = {
  parent: document.querySelector('#canvas'),
  width: 600,
  height: 250,
};

/**
 * Definició dels peixos
 * image:   Imatge del peix
 * obj:     Placholder per l'objecte creat
 * points:  Puntuació al menjar-lo
 * sound:   Só a reproduir en ser menjat
 */
const elements = [
  {
    image: require('../img/fishTile_075.png'),
    obj: null,
    points: 5,
    sound: require('../sound/confirmation_003.ogg'),
  },
  {
    image: require('../img/fishTile_076.png'),
    obj: null,
    points: 1,
    sound: require('../sound/confirmation_001.ogg'),
  },
  {
    image: require('../img/fishTile_080.png'),
    obj: null,
    points: 1,
    sound: require('../sound/confirmation_001.ogg'),
  },
  {
    image: require('../img/fishTile_092.png'),
    obj: null,
    points: -1,
    sound: require('../sound/back_003.ogg'),
  },
  {
    image: require('../img/fishTile_100.png'),
    obj: null,
    points: -5,
    sound: require('../sound/error_007.ogg'),
  },
];

/**
 * Controla la pantalla del joc
 * 0: Start
 * 1: Game
 * 2: Game Over
 */
let screen = 0;
setTimeout(() => {
  screen = 1;
}, 1000);
/**
 * Instància que controla totes
 * les propietats del canvas generat
 * per p5. És inicialitzat a index.js
 */
const sketch = (s) => {
  let font;
  let bestScore;

  /**
   * Retorna la millor puntuació de l'usuari
   * en cas que existeixi a localStorage,
   * sinó retorna 0.
   */
  const getBest = () => {
    if (localStorage.getItem('bestScore') !== null) {
      return localStorage.bestScore;
    }
    return 0;
  };

  let bgImage;
  /**
   * Precarrega les instàncies de cada objecte
   * amb les seves imatges i els seus sons.
   * També carrega la font a utilitzar i la
   * imatge de background i recupera
   * la millor puntuació.
   */
  s.preload = () => {
    elements.forEach((el) => {
      s.loadImage(el.image, (img) => {
        /**
         * Creem una nova instància de cada peix,
         * passant la imatge, les proporcions del canvas
         * i s, que ens dóna accés als mètodes de p5.
         */
        el.obj = new Fish(img, canvas.width, canvas.height, s);
        el.image = img;
      });
      el.sound = s.loadSound(el.sound);
    });

    font = s.loadFont(VT323);

    bestScore = getBest();

    bgImage = s.loadImage(background);
  };

  let cursorImg;

  /**
   * Mètode que insereix el canvas dins d'un div
   * propi, canvia el tipus de cursor
   * i carrega la imatge del narval.
   */
  s.setup = () => {
    // Inserim el canvas dins del nostre div
    const myCanvas = s.createCanvas(canvas.width, canvas.height);
    myCanvas.parent('canvas');

    s.cursor(s.CROSS);
    cursorImg = s.loadImage(require('../img/narwhal.png'));
  };

  /**
   * Funció que s'encarrega de mostrar
   * la pantalla d'inici. Va lligada
   * amb l'screen 0.
   */
  const start = () => {
    s.background(bgImage);

    s.fill('#FFF');
    s.textFont(font);
    s.textAlign(s.CENTER, s.CENTER);
    s.textSize(30);
    s.text('Ready to eat some fish?', 300, 35);

    s.textSize(15);
    s.text('Eat as much fish as you can in 1 minute', 300, 65);

    let i = 0;
    let x;
    let y;

    // Mostrem els peixos i la puntuació de cada
    elements.forEach((el) => {
      i += 1;
      x = i * 35 + 180;
      y = 105;

      s.image(el.image, x, y, 25, 25);
      s.textAlign(s.LEFT);
      s.text(el.points, x + 8, y + 40);
    });

    s.textFont('Georgia');
    s.textSize(13);
    s.text('🏆', 20, 24);
    s.textFont(font);
    s.textSize(20);
    s.text(`Best: ${bestScore}`, 40, 20);

    s.noStroke();
    s.rectMode(s.CENTER);
    s.fill(0, 0, 0, 150);
    s.rect(300, 205, 110, 40);

    s.textAlign(s.CENTER, s.CENTER);
    s.textSize(20);
    s.fill('#FFF');
    s.text('START', 286, 203);
    s.textSize(20);
    s.textFont('Georgia');
    s.text('🦈', 330, 207);
  };

  /**
   * Controlen les coordenades de
   * la imatge del narval
   */
  let cx = s.width / 2;
  let cy = s.height / 2;

  // Contador dels punts
  let globalPoints = 0;

  // Indicador del límit de temps (en segons)
  let countdown = 59;

  /**
   * Funció que s'encarrega de mostrar
   * el joc. Va lligada a l'screen 1.
   */
  const game = () => {
    s.imageMode(s.CORNER);
    s.background(bgImage);
    s.imageMode(s.CENTER);
    /**
     * Utilitzem la interpolació linial per tal d'aconseguir
     * que el narval segueixi el cursor, però de manera retrassada.
     * Passem les coordenades del narval, juntament amb les del ratolí
     * amb una amount força baixa per tal d'aconseguir un delay més
     * alt.
     */
    cx = s.lerp(cx, s.mouseX, 0.02);
    cy = s.lerp(cy, s.mouseY, 0.02);

    /**
     * Iterem els elements per tal de cridar el mètode
     * display, que mostrarà el peix en qüestió.
     */
    elements.forEach(({ obj, points, sound }) => {
      /**
       * Com que l'element quan va en direcció
       * contrària utilitza translate, fem un push
       * i pop perquè no afecti als demés elements i
       * es reiniciï l'eix de coordenades.
       */
      s.push();
      obj.display();
      s.pop();

      /**
       * Cridem el mètode getPos, que ens retornarà les
       * coordenades normalitzades independentment
       * del translate de l'element.
       */
      const { x, y } = obj.getPos();

      /**
       * Comprovem que la distància del narval sigui
       * menor a 35px (l'amplada d'aquest), per tal de
       * determinar que hi ha una colisió.
       */
      if (s.int(s.dist(cx, cy, x, y)) < 35) {
        /*
         * Si els punts són negatius,
         * mantingue-ho a 0 per evitar puntuacions negatives.
         */
        globalPoints += points;
        if (globalPoints <= 0) {
          globalPoints = 0;
        }

        // Reinicialitza el peix un cop atrapat
        obj.reset();

        /* Si ens hem menjat el peix globus o
         * l'esquelet, mostra un frame amb el background
         * vermell.
         */
        if (Math.sign(points) === -1) {
          s.background(255, 0, 0, 90);
        }

        // Reprodueix el so associat amb el peix
        sound.play();
      }
    });

    /**
     * Renderitzem la imatge del narval
     * després de la dels peixos perquè sempre
     * estigui sobreposat a aquests.
     */
    s.imageMode(s.CENTER);
    s.image(cursorImg, cx, cy);

    // Mostrem els punts i el record personal
    s.textAlign(s.LEFT);
    s.textFont(font);
    s.textSize(20);
    s.fill('#FFF');
    s.text(`POINTS: ${globalPoints}`, 20, 24);
    s.textSize(15);
    // Si els punts són més grans que el record personal, sincronitza'ls
    if (globalPoints > bestScore) bestScore = globalPoints;
    s.text(`BEST: ${bestScore}`, 20, 45);

    // Mostrem el temps de partida restant
    s.textAlign(s.RIGHT);
    s.textSize(20);
    s.text(`00:${countdown < 10 ? `0${countdown}` : countdown}`, 580, 24);
  };

  /**
   * Funció que s'encarrega de mostrar
   * la pantalla de Game Over, un cop
   * ha finalitzat el temps.
   * Va lligada a l'screen 2.
   */
  const gameOver = () => {
    s.imageMode(s.CORNER);
    s.background(bgImage);
    s.fill('#FFF');
    s.textFont(font);
    s.textAlign(s.CENTER, s.CENTER);
    s.textSize(30);
    s.text('GAME OVER!', 300, 85);

    s.textSize(15);
    s.text(`${globalPoints} points, not bad!`, 300, 115);
    s.text('Fancy another game?', 300, 130);

    s.textAlign(s.LEFT);
    s.textFont('Georgia');
    s.textSize(13);
    s.text('🏆', 20, 24);
    s.textFont(font);
    s.textSize(20);
    s.text(`Best: ${bestScore}`, 40, 20);

    s.noStroke();
    s.rectMode(s.CENTER);
    s.fill(0, 0, 0, 90);
    s.rect(300, 175, 110, 40);

    s.textAlign(s.CENTER, s.CENTER);
    s.textSize(20);
    s.fill('#FFF');
    s.text('START', 286, 173);
    s.textSize(20);
    s.textFont('Georgia');
    s.text('🦈', 330, 177);
  };

  /**
   * El mètode draw de p5 només
   * evalua a quina screen ens trobem
   * i renderitza la funció adequada per a cada.
   */
  s.draw = () => {
    switch (screen) {
      case 1:
        game();
        break;
      case 2:
        gameOver();
        break;
      default:
        start();
    }
  };

  /**
   * Funció que inicialitza la conta
   * enrere del temps de partida.
   */
  const setCountdown = () => {
    /**
     * Interval que corre cada 1 segon i
     * s'atura un cop arribem a 0.
     */
    const interval = setInterval(() => {
      countdown -= 1;

      if (countdown === 0) {
        clearInterval(interval);
        // Un cop s'acaba el temps, enviem a Game Over
        screen = 2;
        /**
         * Ens assegurem que el rècord de l'usuari
         * està sincronitzat amb el de localStorage
         */
        localStorage.bestScore = bestScore;
      }
    }, 1000);
  };

  /**
   * Mètode de p5 que determina la pantalla
   * a la que ens trobem quan es fa clic.
   */
  s.mousePressed = () => {
    /**
     * Si estem a la pantalla d'inici,
     * inicia el joc canviant a pantalla 1
     */
    if (screen === 0) {
      screen = 1;
      // Inicia el temps de partida
      setCountdown();

      // En canvi, si estem a la de Game Over
    } else if (screen === 2) {
      // Reinicia el contador de temps
      countdown = 59;
      // Reincia els punts de partida
      globalPoints = 0;
      // Desa la millor puntuació a localStorage
      bestScore = localStorage.bestScore;
      // Envia a la pantalla del joc
      screen = 1;
      // Reincia el contador de temps
      setCountdown();
    }
  };
};

export default sketch;
