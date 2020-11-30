/**
 * Classe que conté tots els mètodes
 * i propietats necessàries per tal de
 * renderitzar els peixos
 */
class Fish {
  constructor(img, width, height, sk, opts = {}) {
    // La imatge del peix
    this.el = img;
    // La instància de p5 que ens dóna accés als mètodes
    this.sk = sk;

    /**
     * Variables de personalització.
     * En aquest cas no fan res perquè la speed es
     * determina automàticament de manera aleatoria,
     * però es podrien implementar fàcilment.
     */
    this.opts = {
      speed: 1,
      ...opts,
    };

    // Dimensions del canvas
    this.bounds = {
      width,
      height,
    };

    /**
     * State del peix
     * x, y:          Coordenades del peix
     * realX, realY:  Coordenades normalitzades del peix
     * flags:
     *  reverse:      Si el peix està anant en direcció contrària
     *                (de dreta a esquerra)
     */
    this.state = {
      x: 0,
      y: 0,
      realX: 0,
      realY: 0,
      flags: {
        reverse: false,
      },
    };

    // Inicialitzem el peix
    this.init();
  }

  /**
   * Mètode que determina principalment
   * la posició del peix al canvas de manera
   * aleatòria.
   */
  init() {
    const { state } = this;
    const { height } = this.bounds;
    const { sk } = this;
    // Randomitzem la y respecte les dimensions del canvas
    this.state.y = sk.random(0, height);

    // Determinem si començarà a esquerra o dreta
    const randX = sk.random([0, 1]);

    // Si comença a dreta
    if (randX === 1) {
      // Ho indiquem
      state.flags.reverse = true;

      /**
       * El peix haurà sofert un translate,
       * per tant hem de recalcular els límits
       * de coordenades tant a x com a y.
       * No són els límits del canvas normals.
       */
      const { xMax, yMin, yMax } = this.getRange();

      // Comença a la dreta de tot
      state.x = xMax;

      // Comença a una alçada aleatoria
      state.y = sk.random(yMin, yMax);
    }

    // Randomitzem la velocitat del peix
    this.opts.speed = sk.random(2, 4);
  }

  /**
   * Mètode que cridem des de draw i
   * que renderitza el peix al canvas.
   */
  display() {
    // Animem les coordenades del peix
    this.animate();

    const { x, y } = this.state;
    const { width, height } = this.bounds;
    const { sk } = this;

    /**
     * Si va de dreta a esquerra, el peix ha d'estar
     * voltejat horitzontalment per simular que va
     * en aquella direcció.
     * Si apliquem l'scale sense el translate, el
     * peix aniria a parar fora del canvas.
     */
    if (this.state.flags.reverse) {
      sk.translate(width / 2, height / 2);
      sk.scale(-1, 1);
      sk.image(this.el, x, y);
    } else {
      sk.image(this.el, x, y);
    }
  }

  /**
   * Mètode que s'encarrega d'animar la posició
   * del peix al canvas.
   */
  animate() {
    const { state } = this;
    const { opts } = this;
    const { sk } = this;
    const {
      xMin, xMax, yMin, yMax,
    } = this.getRange();

    // Fem moure el peix
    state.x += opts.speed;

    // Si arriba a la cantonada dreta del canvas
    if (!state.flags.reverse && state.x > xMax) {
      state.flags.reverse = true;

      /**
       * Cridem setPosition, que el posicionarà tenint en compte
       * que el peix ha patit un translate.
       */

      this.setPosition(true);
    }

    // Si arriba a la cantonada esquerra del canvas
    if (state.flags.reverse && state.x > xMin) {
      state.flags.reverse = false;

      this.setPosition(false);
    }

    /**
     * Aqui estem normalitzant les coordenades del peix
     * per tal de poder utilitzar-les a l'hora de calcular
     * colisions amb el narval.
     * El map retornarà les mateixes coordenades si el peix
     * està anant en direcció normal:
     * map(state.x, 0, 600, 0, 600);
     *
     * I si està anant en direcció contrària, les normalitzarà
     * map(state.x, 420, -450, 0, 600);
     */
    state.realX = sk.map(state.x, xMin, xMax, 0, this.bounds.width + this.el.width);
    state.realY = sk.map(state.y, yMin, yMax, 0, this.bounds.height - this.el.height);
  }

  /**
   * Mètode que determina la posició del peix un cop
   * arriba a una cantonada, depenent de si ha d'anar
   * a l'inversa o no.
   *
   * No l'incloem dins d'animate() perquè el range canvia
   * un cop flags.reverse canvia de valor.
   */
  setPosition(r) {
    const { state } = this;
    const { sk } = this;
    const {
      xMin, xMax, yMin, yMax,
    } = this.getRange();

    // Si va en reverse, el posem a la dreta de tot (xMax)
    if (r) {
      state.y = sk.random(yMin, yMax);
      state.x = xMax;
      this.opts.speed = sk.random(2, 4);
    } else {
      state.y = sk.random(yMin, yMax);
      // Si va normal, a l'esquerra de tot (xMin)
      state.x = xMin;
      this.opts.speed = sk.random(2, 4);
    }
  }

  /**
   * Aquest mètode és el més important a l'hora
   * de calcular la posició del peix, perquè
   * determina les coordenades equivalents a
   * l'eix inicial un cop es fa el translate.
   */
  getRange() {
    const { width, height } = this.bounds;
    const { reverse } = this.state.flags;

    /**
     * Si va al l'inversa, calculem quines serien les coordenades
     * vàlides per mostrar el peix dins del canvas.
     * Aqui un petit esquema que he realitzat per determinar-ho:
     *
     *    translate(width / 2, height / 2);
     *
     *    (0, 0) === ((width / 2) - el.width, (-height / 2)) === (420, -250)
     *    x = Min: (420), Max: (-450) = Min: (width / 2), Max: (-width / 2 - el.width)
     *    y = Min: (-250), Max: (220) = Min: (-height / 2), Max: (height / 2 - el.height)
     *
     * He arribat a aquestes conclusions després de realitzar
     * una prova amb un rectangle amb translate i scale(-1,1) i anar
     * movent-lo pel canvas fins a determinar per què eren aquelles coordenades.
     */
    if (reverse) {
      return ({
        xMin: (width / 2),
        xMax: -width / 2 - this.el.width,
        yMin: -height / 2,
        yMax: (height / 2) - this.el.height,
      });
    }

    // Si va normal, només retorna els rangs normals
    return ({
      xMin: 0,
      xMax: width + this.el.width,
      yMin: 0,
      yMax: height - this.el.height,
    });
  }

  /**
   * Mètode que reinicia un peix després de ser
   * menjat pel narval.
   */
  reset() {
    const { state } = this;
    const { height } = this.bounds;
    const { sk } = this;

    // Randomitzem la y respecte les dimensions del canvas
    this.state.y = sk.random(0, height);

    // Determinem si començarà a esquerra o dreta
    const randX = sk.random([0, 1]);

    // Si comença a dreta
    if (randX === 1) {
      // Ho indiquem
      state.flags.reverse = true;

      /**
       * El peix haurà sofert un translate,
       * per tant hem de recalcular els màxims
       * de coordenades tant a x com a y.
       * No són els límits del canvas en si.
       */
      const { xMax, yMin, yMax } = this.getRange();

      // Comença a la dreta de tot
      state.x = xMax;

      // Comença a una alçada aleatoria
      state.y = sk.random(yMin, yMax);
    } else {
      state.flags.reverse = false;

      // La y ha estat establerta al principi
      // Establim només la x a l'esquerra de tot
      state.x = -this.el.width;
    }

    // Randomitzem la velocitat del peix
    this.opts.speed = sk.random(2, 4);
  }

  /**
   * Mètode que ens retorna les coordenades
   * normalitzades del peix per tal de poder
   * calcular colisions amb el narval
   */
  getPos() {
    return {
      x: this.state.realX,
      y: this.state.realY,
    };
  }
}

export default Fish;
