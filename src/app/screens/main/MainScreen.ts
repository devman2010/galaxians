import {
  AnimatedSprite,
  Assets,
  BitmapFont,
  BitmapText,
  Container,
  Graphics,
  Sprite,
  TextStyle,
  TexturePool,
  Ticker
} from "pixi.js";
import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { CreateEnemyWave, enemyMap } from "../enemy/CreateEnemyWave";
import { StarBackground } from "./StarBackground";
import { PlayerShipMove } from "../player/PlayerShipMove";
import { PlayerShip } from "../player/PlayerShip";
import { EnemyAnimatedSprite } from "../enemy/EnemyAnimatedSprite";
import { EnemyAttackController } from "../enemy/EnemyAttackController";
import {ENEMY_STATE, ENEMY_TYPE} from "../enemy/EnemyData";
import Stats from "stats.js";
import { rectsIntersect } from "./EnemyShipCollision";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];
  public enemyWave: EnemyAnimatedSprite[];
  public mainContainer: Container;
  public dirToggle = false;
  public starBg: StarBackground;
  private paused = false;
  public keys: Record<string, boolean> = {};
  public playerShip: PlayerShip;
  public enemyAttackController: EnemyAttackController;
  public stats: Stats;
  private score = 0;
  private highScore = 0;
  private waveNumber = 1;
  private waveResetTimer = 0;
  private waveResetDelay = 1.0;
  private readonly highScoreKey = "galaxians-high-score";
  private credits = 0;
  private lives = 3;
  private gameStarted = false;
  private hudContainer: Container;
  private scoreLabel: BitmapText;
  private scoreValue: BitmapText;
  private highScoreLabel: BitmapText;
  private highScoreValue: BitmapText;
  private playerLabel: BitmapText;
  private playerValue: BitmapText;
  private creditLabel: BitmapText;
  private creditValue: BitmapText;
  private startPromptText: BitmapText;
  private controlPromptText: BitmapText;
  private playerLifeIcons: Sprite[] = [];
  private enemyMissileSpawnTimer = 0;
  private creditPressedLastFrame = false;
  private startPressedLastFrame = false;
  private playerRespawnTimer = 0;
  private playerShipExploding = false;
  private leftHeld: boolean = false;
  private rightHeld: boolean = false;
  // iPad soft-keyboard helpers
  private kbOverlay?: HTMLDivElement;
  private kbInput?: HTMLInputElement;
  // Active player missiles (sprite + speed)
  public playerMissiles: { gfx: Sprite; speed: number }[] = [];
  // Active enemy missiles (sprite + speed + drift)
  public enemyMissiles: {
    gfx: Sprite;
    speed: number;
    velocityX: number;
    velocityY: number;
  }[] = [];
  // Active explosions (gfx, life elapsed, duration)
  public explosions: { gfx: Graphics; life: number; duration: number }[] = [];
  // Track space key to fire once per press
  private spacePressedLastFrame: boolean = false;
  // Todo: Clean up
  constructor() {
    super();
    // Force nearest neighbor sampling for pixel-art look
    TexturePool.textureOptions.scaleMode = "nearest"; // Set the scale mode to nearest for pixel art
    // mainContainer holds the low-res scene content (rendered offscreen)
    this.mainContainer = new Container();
    const background = new Graphics()
      .rect(0, 0, this.WIDTH, this.HEIGHT)
      .fill("black"); // Fill the rectangle with a red color
    this.mainContainer.addChild(background);
    this.starBg = new StarBackground(this.WIDTH, this.HEIGHT, 100, 0.6);
    this.mainContainer.addChild(this.starBg);
    this.enemyWave = CreateEnemyWave.createWave(enemyMap);

    // Render the game scene directly to the stage. The render-to-texture path was
    // producing a blank screen in practice, so we keep the low-resolution playfield
    // and apply pixelated scaling via canvas CSS instead.
    this.addChild(this.mainContainer);

    // Only call resize with valid engine screen dimensions; fall back to window size
    let sw = engine().screen.width;
    if (!(sw > 0)) sw = window.innerWidth;
    let sh = engine().screen.height;
    if (!(sh > 0)) sh = window.innerHeight;
    this.resize(sw, sh);

    this.highScore = Number(localStorage.getItem(this.highScoreKey) ?? 0);
    this.hudContainer = new Container();
    // Create bitmap font for crisp pixel text (generated at runtime)
    try {
      (BitmapFont as any).from(
        "arcade",
        new TextStyle({
          fill: "#ffffff",
          fontSize: 8,
          fontFamily: "monospace",
          fontWeight: "bold",
          letterSpacing: 1
        }),
        { chars: (BitmapFont as any).ASCII }
      );
    } catch {
      /* ignore */
    }

    this.scoreLabel = new (BitmapText as any)("1UP", {
      fontName: "arcade",
      fontSize: 7
    });
    this.scoreLabel.tint = 0xffffff;
    this.scoreValue = new (BitmapText as any)("0", {
      fontName: "arcade",
      fontSize: 12
    });
    this.scoreValue.tint = 0xff0000;
    this.highScoreLabel = new (BitmapText as any)("HIGH SCORE", {
      fontName: "arcade",
      fontSize: 7
    });
    this.highScoreLabel.tint = 0xffffff;
    this.highScoreValue = new (BitmapText as any)(String(this.highScore), {
      fontName: "arcade",
      fontSize: 12
    });
    this.highScoreValue.tint = 0xff0000;
    this.playerLabel = new (BitmapText as any)("LIVES", {
      fontName: "arcade",
      fontSize: 7
    });
    this.playerLabel.tint = 0xffffff;
    this.playerValue = new (BitmapText as any)("3", {
      fontName: "arcade",
      fontSize: 12
    });
    this.playerValue.tint = 0xff0000;
    this.creditLabel = new (BitmapText as any)("CREDIT", {
      fontName: "arcade",
      fontSize: 7
    });
    this.creditLabel.tint = 0xffffff;
    this.creditValue = new (BitmapText as any)("0", {
      fontName: "arcade",
      fontSize: 12
    });
    this.creditValue.tint = 0xff0000;

    this.scoreLabel.x = 10;
    this.scoreLabel.y = 4;
    this.scoreValue.x = 10;
    this.scoreValue.y = 13;
    this.highScoreLabel.x = 136;
    this.highScoreLabel.y = 4;
    this.highScoreValue.x = 150;
    this.highScoreValue.y = 13;
    this.creditLabel.x = 10;
    this.creditLabel.y = 232;
    this.creditValue.x = 54;
    this.creditValue.y = 232;
    this.playerLabel.x = 160;
    this.playerLabel.y = 232;
    this.playerValue.x = 200;
    this.playerValue.y = 232;
    this.playerLabel.visible = false;
    this.playerValue.visible = false;

    for (let i = 0; i < 3; i++) {
      const lifeShip = new PlayerShip(0, 0);
      lifeShip.scale.set(0.5);
      lifeShip.x = 172 + i * 12;
      lifeShip.y = 244;
      this.playerLifeIcons.push(lifeShip);
      this.hudContainer.addChild(lifeShip);
    }

    this.hudContainer.addChild(
      this.scoreLabel,
      this.scoreValue,
      this.highScoreLabel,
      this.highScoreValue,
      this.creditLabel,
      this.creditValue,
      this.playerLabel,
      this.playerValue
    );
    this.mainContainer.addChild(this.hudContainer);

    this.startPromptText = new (BitmapText as any)(
      "PRESS '1' TO INSERT CREDIT",
      {
        fontName: "arcade",
        fontSize: 8,
        align: "center"
      }
    );
    // center it using pivot (BitmapText doesn't have anchor)
    this.startPromptText.pivot.set(
      this.startPromptText.width / 2,
      this.startPromptText.height / 2
    );
    this.startPromptText.x = this.WIDTH / 2;
    this.startPromptText.y = 120;
    this.startPromptText.visible = true;

    this.controlPromptText = new (BitmapText as any)(
      "SHIP CONTROLS\nO FOR LEFT AND P FOR RIGHT\nSPACE TO FIRE",
      {
        fontName: "arcade",
        fontSize: 8,
        align: "center",
        wordWrap: true,
        wordWrapWidth: this.WIDTH - 8,
        lineHeight: 10
      }
    );
    this.controlPromptText.pivot.set(
      this.controlPromptText.width / 2,
      this.controlPromptText.height / 2
    );
    this.controlPromptText.x = this.WIDTH / 2;
    this.controlPromptText.y = 138;
    this.controlPromptText.visible = true;
    this.mainContainer.addChild(this.startPromptText, this.controlPromptText);

    this.playerShip = new PlayerShip(this.WIDTH / 2, this.HEIGHT - 16);
    this.mainContainer.addChild(this.playerShip);
    this.resetWave();
    this.enemyAttackController = new EnemyAttackController(
      this.enemyWave,
      this.playerShip
    );
    this.setAttractMode();
    this.updateScoreHud();
    this.registerEvents();
    this.stats = new Stats();
    this.stats.showPanel(2);
    document.body.appendChild(this.stats.dom);
    // Init iPad keyboard helper (shows overlay in portrait to open soft keyboard)
    try {
      this.initKeyboardForiPad();
    } catch {
      /* ignore */
    }
  }

  public registerEvents() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      const mapped = this.mapDirectionalKey(e.key);
      if (mapped) {
        this.keys[mapped] = true;
      }

      // explicit held-key flags for O/P for robust held behavior (works on iPad/desktop)
      const k = (e.key || "").toLowerCase();
      if (k === "o") this.leftHeld = true;
      if (k === "p") this.rightHeld = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      const mapped = this.mapDirectionalKey(e.key);
      if (mapped) {
        this.keys[mapped] = false;
      }

      const k = (e.key || "").toLowerCase();
      if (k === "o") this.leftHeld = false;
      if (k === "p") this.rightHeld = false;
    });
  }

  private mapDirectionalKey(key: string): "ArrowLeft" | "ArrowRight" | null {
    const normalized = key.toLowerCase();
    if (
      normalized === "o" ||
      normalized === "arrowleft" ||
      normalized === "keyo" ||
      normalized === "<"
    ) {
      return "ArrowLeft";
    }
    if (
      normalized === "p" ||
      normalized === "arrowright" ||
      normalized === "keyp" ||
      normalized === ">"
    ) {
      return "ArrowRight";
    }
    return null;
  }

  public updatePlayerShipPosition(_time: Ticker) {
    let direction = "";

    if (this.leftHeld || this.keys["ArrowLeft"]) {
      direction = "left";
    } else if (this.rightHeld || this.keys["ArrowRight"]) {
      direction = "right";
    }
    if (direction !== "") {
      PlayerShipMove.movePlayerShip(
        this.playerShip,
        direction,
        1,
        0,
        this.WIDTH,
        _time.deltaTime
      );
    }
  }

  /** The width and height of the screen */
  get WIDTH() {
    return 224;
  }

  get HEIGHT() {
    return 256;
  }

  /** Update the screen */
  public update(_time: Ticker) {
    if (this.paused) return;
    this.stats.begin();

    if (this.playerRespawnTimer > 0) {
      this.playerRespawnTimer = Math.max(
        0,
        this.playerRespawnTimer - _time.deltaTime / 60
      );
      if (this.playerRespawnTimer === 0) {
        this.playerShip.visible = true;
        this.playerShip.x = this.WIDTH / 2;
        this.playerShip.y = this.HEIGHT - 16;
        this.playerShipExploding = false;
        this.updateLivesHud();
      }
    }

    if (!this.gameStarted) {
      this.startPromptText.visible = true;
      this.controlPromptText.visible = true;
      this.startPromptText.text = (
        this.credits > 0 ? "PRESS 'S' TO START" : "PRESS '1' TO INSERT CREDIT"
      ).toUpperCase();
      this.controlPromptText.text =
        "SHIP CONTROLS\nO FOR LEFT AND P FOR RIGHT\nSPACE TO FIRE".toUpperCase();
      const creditPressed = this.keys["Digit1"] || this.keys["Numpad1"];
      if (creditPressed) {
        if (!this.creditPressedLastFrame) {
          this.insertCredit();
          this.creditPressedLastFrame = true;
        }
      } else {
        this.creditPressedLastFrame = false;
      }

      if (this.keys["KeyS"]) {
        if (!this.startPressedLastFrame) {
          this.startRound();
          this.startPressedLastFrame = true;
        }
      } else {
        this.startPressedLastFrame = false;
      }

      this.starBg.update(_time);
      this.stats.end();
      return;
    }

    this.startPromptText.visible = false;
    this.controlPromptText.visible = false;

    // Check collisions between enemies and the player ship
    this.checkEnemyShipCollisions();

    if (this.waveResetTimer > 0) {
      this.waveResetTimer = Math.max(
        0,
        this.waveResetTimer - _time.deltaTime / 60
      );
      if (this.waveResetTimer === 0) {
        this.waveNumber += 1;
        this.resetWave();
      }
      this.stats.end();
      return;
    }

    this.moveEnemiesLeftAndRight(_time);
    this.starBg.update(_time);
    this.updatePlayerShipPosition(_time);

    // Handle firing for space bar (fire once per keypress)
    if (this.keys["Space"]) {
      if (!this.spacePressedLastFrame) {
        this.fireMissile();
        this.spacePressedLastFrame = true;
      }
    } else {
      this.spacePressedLastFrame = false;
    }

    this.enemyAttackController.update(_time.deltaTime);
    this.updateEnemyMissiles(_time.deltaTime);

    // Update missiles (movement, collisions, cleanup)
    this.updateMissiles(_time.deltaTime);

    // Update explosions (animate and remove)
    this.updateExplosions(_time.deltaTime);
    this.updateFlyingSound();

    if (this.isWaveCleared()) {
      this.waveResetTimer = this.waveResetDelay;
    }

    this.stats.end();
  }

  private isWaveCleared(): boolean {
    if (this.enemyWave.length === 0) return false;

    return this.enemyWave.every((enemy) => {
      return (
        enemy.enemyState === ENEMY_STATE.DEAD ||
        enemy.enemyState === ENEMY_STATE.DYING ||
        enemy.enemyState === ENEMY_STATE.END_ATTACK_SWARM ||
        !enemy.visible ||
        !enemy.parent
      );
    });
  }

  private updateScoreHud(): void {
    this.scoreValue.text = String(this.score).padStart(6, "0");
    this.highScoreValue.text = String(this.highScore).padStart(6, "0");
  }

  private updateCreditHud(): void {
    const showCreditHud = !this.gameStarted;
    this.creditLabel.visible = showCreditHud;
    this.creditValue.visible = showCreditHud;
    this.creditValue.text = String(Math.max(0, this.credits));
    this.playerValue.text = String(Math.max(0, this.lives));
    if (!this.gameStarted) {
      this.startPromptText.text = (
        this.credits > 0 ? "PRESS 'S' TO START" : "PRESS '1' TO INSERT CREDIT"
      ).toUpperCase();
    }
  }

  private updateLivesHud(): void {
    this.playerValue.text = String(Math.max(0, this.lives));
    this.playerLifeIcons.forEach((ship, index) => {
      ship.visible = index < Math.max(0, this.lives);
    });
  }

  private centerWaveForAttractMode(): void {
    if (this.enemyWave.length === 0) return;

    const activeEnemies = this.enemyWave.filter(
      (enemy) => enemy.visible && enemy.parent
    );
    if (activeEnemies.length === 0) return;

    const leftMost = Math.min(...activeEnemies.map((enemy) => enemy.x));
    const rightMost = Math.max(...activeEnemies.map((enemy) => enemy.x));
    const spread = rightMost - leftMost + 18;
    const startX = this.WIDTH / 2 - spread / 2;

    activeEnemies.forEach((enemy) => {
      enemy.baseX = startX + (enemy.x - leftMost);
      enemy.x = enemy.baseX;
    });
  }

  private setAttractMode(): void {
    this.gameStarted = false;
    this.startPromptText.visible = true;
    this.controlPromptText.visible = true;
    this.startPromptText.text = (
      this.credits > 0 ? "PRESS 'S' TO START" : "PRESS '1' TO INSERT CREDIT"
    ).toUpperCase();
    this.updateLivesHud();
    try {
      const bgm = engine().audio.bgm;
      if (bgm?.current) {
        bgm.current.stop();
      }
      if (bgm) {
        bgm.currentAlias = undefined;
      }
    } catch {
      /* ignore */
    }
    this.updateCreditHud();
    this.resetWave();
    this.centerWaveForAttractMode();
    this.playerShip.visible = true;
    this.playerShip.x = this.WIDTH / 2;
    this.playerShip.y = this.HEIGHT - 16;
  }

  private startRound(): void {
    if (this.credits <= 0 || this.gameStarted) return;

    this.credits -= 1;
    this.lives = 3;
    this.waveNumber = 1;
    this.gameStarted = true;
    this.updateCreditHud();
    this.updateLivesHud();
    this.playerShip.visible = true;
    this.resetWave();
    this.playSound("main/sounds/02. Start Game.mp3");
    this.playFlyingSound();
  }

  private insertCredit(): void {
    this.credits += 1;
    this.playSound("main/sounds/01. Credit Sound.mp3");
    this.updateCreditHud();
  }

  private playSound(alias: string, volume = 1): void {
    try {
      engine().audio.sfx.play(alias, { volume });
    } catch {
      /* ignore */
    }
  }

  private playFlyingSound(): void {
    if (!this.gameStarted) return;
    try {
      engine().audio.bgm.play("main/sounds/06. Flying Sound.mp3", {
        volume: 0.3
      });
    } catch {
      /* ignore */
    }
  }

  private updateFlyingSound(): void {
    if (!this.gameStarted) {
      return;
    }

    const enemyCount = this.enemyWave.filter(
      (enemy) =>
        enemy &&
        enemy.visible &&
        enemy.parent &&
        enemy.enemyState !== ENEMY_STATE.DEAD &&
        enemy.enemyState !== ENEMY_STATE.DYING
    ).length;
    const speed = Math.max(0.7, 1.5 - enemyCount / 40);
    try {
      const flyingSound = engine().audio.bgm.current;
      if (flyingSound) {
        flyingSound.speed = speed;
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * iPad soft-keyboard helper: shows a small overlay in portrait orientation.
   * User taps the overlay (a user gesture) to focus a tiny input that opens the
   * on-screen keyboard. Input events are mapped to game key actions.
   */
  private initKeyboardForiPad(): void {
    try {
      const isiPad =
        /iPad|Macintosh/.test(navigator.userAgent) &&
        (navigator as any).maxTouchPoints > 1;
      if (!isiPad) return;

      this.kbInput = document.createElement("input");
      this.kbInput.type = "text";
      this.kbInput.setAttribute("autocorrect", "off");
      this.kbInput.setAttribute("autocomplete", "off");
      this.kbInput.spellcheck = false;
      Object.assign(this.kbInput.style, {
        position: "fixed",
        left: "12px",
        bottom: "12px",
        width: "1px",
        height: "1px",
        opacity: "0.01",
        zIndex: "9999"
      } as any);
      document.body.appendChild(this.kbInput);

      this.kbOverlay = document.createElement("div");
      this.kbOverlay.innerText = "Tap to open keyboard";
      Object.assign(this.kbOverlay.style, {
        position: "fixed",
        left: "50%",
        bottom: "16px",
        transform: "translateX(-50%)",
        padding: "8px 14px",
        background: "rgba(0,0,0,0.6)",
        color: "white",
        borderRadius: "6px",
        zIndex: "9999",
        fontFamily: "monospace",
        cursor: "pointer"
      } as any);
      document.body.appendChild(this.kbOverlay);

      this.kbOverlay.addEventListener("click", () => {
        try {
          if (this.kbInput) this.kbInput.focus();
        } catch {
          /* ignore */
        }
        if (this.kbOverlay) this.kbOverlay.style.display = "none";
      });

      // On-screen touch controls for iPad (left/right) to support held movement
      const createTouchButton = (
        label: string,
        left: number,
        bottom: number
      ) => {
        const btn = document.createElement("div");
        btn.innerText = label;
        Object.assign(btn.style, {
          position: "fixed",
          left: `${left}px`,
          bottom: `${bottom}px`,
          width: "64px",
          height: "64px",
          background: "rgba(0,0,0,0.3)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          zIndex: "9998",
          fontFamily: "monospace",
          userSelect: "none"
        } as any);
        document.body.appendChild(btn);
        return btn;
      };

      const leftBtn = createTouchButton("O", 12, 12);
      const rightBtn = createTouchButton("P", 88, 12);

      const touchStartLeft = (ev: any) => {
        ev.preventDefault?.();
        this.leftHeld = true;
      };
      const touchEndLeft = (ev: any) => {
        ev.preventDefault?.();
        this.leftHeld = false;
      };
      const touchStartRight = (ev: any) => {
        ev.preventDefault?.();
        this.rightHeld = true;
      };
      const touchEndRight = (ev: any) => {
        ev.preventDefault?.();
        this.rightHeld = false;
      };

      leftBtn.addEventListener("touchstart", touchStartLeft, {
        passive: false
      });
      leftBtn.addEventListener("mousedown", touchStartLeft);
      leftBtn.addEventListener("touchend", touchEndLeft);
      leftBtn.addEventListener("touchcancel", touchEndLeft);
      leftBtn.addEventListener("mouseup", touchEndLeft);

      rightBtn.addEventListener("touchstart", touchStartRight, {
        passive: false
      });
      rightBtn.addEventListener("mousedown", touchStartRight);
      rightBtn.addEventListener("touchend", touchEndRight);
      rightBtn.addEventListener("touchcancel", touchEndRight);
      rightBtn.addEventListener("mouseup", touchEndRight);

      // Hide/show touch buttons along with the overlay depending on portrait
      // Keep touch buttons available even when soft keyboard is open so users can hold them.
      const m = window.matchMedia("(orientation: portrait)");
      const updateOverlay = () => {
        if (!this.kbOverlay) return;
        const vv = (window as any).visualViewport;
        const keyboardOpen = !!vv && vv.height < window.innerHeight * 0.82;
        const show = m.matches && !keyboardOpen;
        this.kbOverlay.style.display = show ? "block" : "none";
      };
      try {
        m.addEventListener("change", updateOverlay);
      } catch {
        if ((m as any).addListener) (m as any).addListener(updateOverlay);
      }
      window.addEventListener("resize", updateOverlay);

      const updateTouchButtonsVisibility = () => {
        const show = m.matches; // portrait => show on-screen controls
        leftBtn.style.display = show ? "flex" : "none";
        rightBtn.style.display = show ? "flex" : "none";
      };
      try {
        m.addEventListener("change", updateTouchButtonsVisibility);
      } catch {
        if ((m as any).addListener)
          (m as any).addListener(updateTouchButtonsVisibility);
      }
      window.addEventListener("resize", updateOverlay);
      if ((window as any).visualViewport) {
        (window as any).visualViewport.addEventListener(
          "resize",
          updateTouchButtonsVisibility
        );
        (window as any).visualViewport.addEventListener(
          "scroll",
          updateTouchButtonsVisibility
        );
      }
      updateTouchButtonsVisibility();

      // Hold emulation timers: short timeout after last soft-key input to clear hold.
      const HOLD_TIMEOUT = 220; // ms
      const holdTimers: { left?: number; right?: number } = {};

      this.kbInput.addEventListener("input", () => {
        if (!this.kbInput) return;
        const v = this.kbInput.value;
        if (!v) return;
        const ch = v.slice(-1).toLowerCase();

        // Map soft-key input to game keys (short tap behaviour)
        if (ch === "o" || ch === "a" || ch === "<") {
          // emulate hold: set leftHeld and reset timer
          this.leftHeld = true;
          if (holdTimers.left) window.clearTimeout(holdTimers.left);
          holdTimers.left = window.setTimeout(() => {
            this.leftHeld = false;
            holdTimers.left = undefined;
          }, HOLD_TIMEOUT);
        } else if (ch === "p" || ch === "d" || ch === ">") {
          this.rightHeld = true;
          if (holdTimers.right) window.clearTimeout(holdTimers.right);
          holdTimers.right = window.setTimeout(() => {
            this.rightHeld = false;
            holdTimers.right = undefined;
          }, HOLD_TIMEOUT);
        } else if (ch === " " || ch === "s") {
          this.keys["Space"] = true;
          setTimeout(() => (this.keys["Space"] = false), 120);
        }

        // Clear so next tap is fresh
        this.kbInput.value = "";
      });

      // When the input loses focus (keyboard dismissed) clear holds
      this.kbInput.addEventListener("blur", () => {
        this.leftHeld = false;
        this.rightHeld = false;
        if (holdTimers.left) window.clearTimeout(holdTimers.left);
        if (holdTimers.right) window.clearTimeout(holdTimers.right);
        holdTimers.left = undefined;
        holdTimers.right = undefined;
      });

      // Throttled viewport sync to avoid frequent heavy canvas resizes which cause stutter
      let lastSync = 0;
      const SYNC_THROTTLE_MS = 100;
      const doSyncViewportForKeyboard = () => {
        const now = Date.now();
        if (now - lastSync < SYNC_THROTTLE_MS) return;
        lastSync = now;

        const vv = (window as any).visualViewport;
        const viewportWidth = Math.max(
          224,
          Math.round((vv?.width ?? window.innerWidth) || window.innerWidth)
        );
        const viewportHeight = Math.max(
          256,
          Math.round((vv?.height ?? window.innerHeight) || window.innerHeight)
        );
        const app = engine();
        const gameAspect = this.WIDTH / this.HEIGHT;
        let fitWidth = viewportWidth;
        let fitHeight = viewportHeight;

        if (fitWidth / fitHeight > gameAspect) {
          fitWidth = fitHeight * gameAspect;
        } else {
          fitHeight = fitWidth / gameAspect;
        }

        const contentWidth = Math.round(fitWidth);
        const contentHeight = Math.round(fitHeight);
        const offsetX = Math.round((viewportWidth - contentWidth) / 2);
        const offsetY = Math.round((viewportHeight - contentHeight) / 2);

        try {
          const container = document.getElementById("pixi-container");
          if (container) {
            container.style.position = "fixed";
            container.style.left = "0px";
            container.style.top = `${Math.round(vv?.offsetTop ?? 0)}px`;
            container.style.width = `${viewportWidth}px`;
            container.style.height = `${viewportHeight}px`;
          }

          app.renderer.canvas.style.position = "absolute";
          app.renderer.canvas.style.left = `${offsetX}px`;
          app.renderer.canvas.style.top = `${offsetY}px`;
          app.renderer.canvas.style.width = `${contentWidth}px`;
          app.renderer.canvas.style.height = `${contentHeight}px`;
          app.renderer.resize(contentWidth, contentHeight);
          app.navigation.resize(contentWidth, contentHeight);
        } catch {
          /* ignore */
        }

        updateOverlay();
      };

      if ((window as any).visualViewport) {
        (window as any).visualViewport.addEventListener(
          "resize",
          doSyncViewportForKeyboard
        );
        (window as any).visualViewport.addEventListener(
          "scroll",
          doSyncViewportForKeyboard
        );
      }
      // initial sync
      doSyncViewportForKeyboard();
      updateOverlay();
    } catch {
      /* ignore */
    }
  }

  private getEnemyMissileSpeed(enemy: EnemyAnimatedSprite): number {
    // Increase base speed and multipliers for a more aggressive feel
    const baseSpeed = 3.0 + this.waveNumber * 0.25;
    const midGameBoost = this.waveNumber >= 8 ? 1.2 : 0;
    const wave16Spike = this.waveNumber >= 16 ? 2.0 : 0;
    const wave30Spike = this.waveNumber >= 30 ? 3.0 : 0;
    const rankBoost =
      enemy.enemyType === 4 || enemy.enemyType === 3 ? 1.0 : 0.3;
    const desperation =
      this.enemyWave.filter(
        (candidate) => candidate.visible && candidate.parent
      ).length < 10
        ? 1.0
        : 0;

    return Math.min(
      12.0,
      baseSpeed +
        midGameBoost +
        wave16Spike +
        wave30Spike +
        rankBoost +
        desperation
    );
  }

  private addScoreForEnemy(enemy: EnemyAnimatedSprite): void {
    const value = enemy.enemyType * 10;
    this.score += value;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(this.highScoreKey, String(this.highScore));
      } catch {
        /* ignore */
      }
    }
    this.updateScoreHud();
  }

  private resetWave(): void {
    // ensure life icons reflect current lives when wave resets
    this.updateLivesHud();
    this.playerMissiles.forEach((missile) => {
      if (missile.gfx.parent) {
        missile.gfx.parent.removeChild(missile.gfx);
      }
    });
    this.playerMissiles = [];
    this.enemyMissiles.forEach((missile) => {
      if (missile.gfx.parent) {
        missile.gfx.parent.removeChild(missile.gfx);
      }
    });
    this.enemyMissiles = [];
    this.enemyMissileSpawnTimer = 0;

    this.enemyWave.forEach((enemy) => {
      if (enemy.parent) {
        enemy.parent.removeChild(enemy);
      }
    });

    this.enemyWave = CreateEnemyWave.createWave(enemyMap);
    this.enemyAttackController = new EnemyAttackController(
      this.enemyWave,
      this.playerShip
    );
    this.dirToggle = false;
    this.waveResetTimer = 0;

    this.enemyWave.forEach((enemy) => {
      enemy.scale.set(1);
      enemy.anchor.set(0.5);
      enemy.blendMode = "add";
      enemy.animationSpeed = 0.062;
      enemy.autoUpdate = true;
      this.mainContainer.addChild(enemy);
      enemy.play();
      enemy.visible = true;
      enemy.enemyState = ENEMY_STATE.ALIVE_IDLE;
    });
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  public resize(width: number, height: number) {
    const targetWidth = this.WIDTH;
    const targetHeight = this.HEIGHT;

    // Calculate scale factor to upscale the low-res scene while keeping aspect ratio
    const scaleX = width / targetWidth;
    const scaleY = height / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    this.mainContainer.scale.set(scale);
    this.mainContainer.x = Math.round((width - targetWidth * scale) / 2);
    this.mainContainer.y = Math.round((height - targetHeight * scale) / 2);

    // Also set canvas CSS to pixelated to prevent smoothing in browsers
    try {
      const canvas = document.querySelector(
        "canvas"
      ) as HTMLCanvasElement | null;
      if (canvas) {
        canvas.style.imageRendering = "pixelated";
      }
    } catch {
      /* ignore */
    }
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    //engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });
    this.enemyWave.forEach((enemy) => {
      enemy.scale.set(1);
      enemy.anchor.set(0.5);
      enemy.blendMode = "add";
      enemy.animationSpeed = 0.062;
      enemy.autoUpdate = true;
      this.mainContainer.addChild(enemy);
      enemy.play();
    });
  }

  public moveEnemiesLeftAndRight(_time: Ticker): void {
    let isToggle: boolean = false;
    const xStep = 6.4;
    this.enemyWave.forEach((enemy) => {
      // Don't march if dead or swarming
      if (enemy.enemyState != ENEMY_STATE.ALIVE_IDLE) {
        return;
      }
      if (this.dirToggle) {
        enemy.baseX = enemy.baseX + xStep * (_time.deltaTime * 0.062);
        if (enemy.baseX >= this.WIDTH - xStep) {
          isToggle = true;
        }
      } else {
        enemy.baseX = enemy.baseX - xStep * (_time.deltaTime * 0.062);
        if (enemy.baseX <= xStep) {
          isToggle = true;
        }
      }
      enemy.visible = false;
      enemy.visible = true;
      enemy.x = enemy.baseX;
    });
    if (isToggle) {
      this.dirToggle = !this.dirToggle;
    }
  }

  // Create and fire a player missile (sprite from spritesheet)
  public fireMissile(): void {
    // Original Galaxian rules: only one active player missile at a time.
    if (this.playerMissiles.length > 0) return;

    const sprite = Sprite.from("playerMissle_0.png");
    sprite.anchor.set(0.5, 0.5);
    // use native sprite size (no scaling)

    // Position the missile over the top-middle of the player's ship
    const shipTop = this.playerShip.y - (this.playerShip.height / 2 || 8);
    sprite.x = this.playerShip.x;
    sprite.y = shipTop - sprite.height / 2;

    this.mainContainer.addChild(sprite);
    this.playerMissiles.push({ gfx: sprite, speed: 4 });
    this.playSound("main/sounds/03. Shoot.mp3");
  }

  // Explosion helper (uses spritesheet animation)
  // Create explosion at x,y. Optional callback called after explosion completes.
  public createExplosion(x: number, y: number, onComplete?: () => void): void {
    try {
      const sheet: any = Assets.get(
        "main/spritesheets/galaxians-spritesheet.json"
      );
      const explodeFrames = sheet.animations["alienExplode"];
      const anim = new AnimatedSprite(explodeFrames);
      anim.animationSpeed = 0.12;
      anim.loop = false;
      anim.anchor.set(0.5);
      anim.x = x;
      anim.y = y;
      anim.onComplete = () => {
        try {
          this.mainContainer.removeChild(anim);
        } catch {
          /* ignore */
        }
        try {
          if (onComplete) {
            onComplete();
          }
        } catch {
          /* ignore */
        }
      };
      this.mainContainer.addChild(anim);
      anim.play();
    } catch {
      // fallback to graphics explosion if assets not available
      const gfx = new Graphics();
      gfx.x = x;
      gfx.y = y;
      gfx.beginFill(0xffcc00);
      gfx.drawCircle(0, 0, 6);
      gfx.endFill();
      this.mainContainer.addChild(gfx);
      setTimeout(() => {
        try {
          this.mainContainer.removeChild(gfx);
        } catch {
          /* ignore */
        }
        try {
          if (onComplete) {
            onComplete();
          }
        } catch {
          /* ignore */
        }
      }, 400);
    }
  }

  // Update explosions: animate and remove (kept for compatibility with previous gfx explosions)
  public updateExplosions(deltaTime: number): void {
    const remove: number[] = [];
    this.explosions.forEach((e, idx) => {
      e.life += deltaTime;
      const t = Math.min(1, e.life / e.duration);
      const radius = 2 + t * 10;
      const alpha = 1 - t;
      e.gfx.clear();
      e.gfx.beginFill(0xffcc00, alpha);
      e.gfx.drawCircle(0, 0, radius);
      e.gfx.endFill();
      if (e.life >= e.duration) {
        this.mainContainer.removeChild(e.gfx);
        remove.push(idx);
      }
    });
    remove.sort((a, b) => b - a).forEach((i) => this.explosions.splice(i, 1));
  }

  private losePlayerLife(): void {
    // update life icons when a life is lost
    this.updateLivesHud();
    if (this.playerShipExploding) return;
    this.playerShipExploding = true;
    this.lives = Math.max(0, this.lives - 1);
    this.updateLivesHud();
    this.playSound("main/sounds/04. Fighter Loss.mp3");
    this.playerShip.visible = false;
    this.enemyMissiles.forEach((missile) => {
      if (missile.gfx.parent) {
        missile.gfx.parent.removeChild(missile.gfx);
      }
    });
    this.enemyMissiles = [];

    this.createExplosion(this.playerShip.x, this.playerShip.y, () => {
      if (this.lives <= 0) {
        this.credits = 0;
        this.updateCreditHud();
        this.setAttractMode();
        this.enemyWave.forEach((enemy) => {
          if (enemy.parent) {
            enemy.parent.removeChild(enemy);
          }
          enemy.visible = false;
          enemy.enemyState = ENEMY_STATE.DEAD;
        });
        this.gameStarted = false;
        this.playerShipExploding = false;
        return;
      }

      this.playerRespawnTimer = 2.0;
    });
  }

  private updateEnemyMissiles(deltaTime: number): void {
    this.enemyMissileSpawnTimer -= deltaTime / 60;
    if (this.enemyMissileSpawnTimer > 0) {
      const removeIndices: number[] = [];
      this.enemyMissiles.forEach((missile, idx) => {
        // accelerate more aggressively and apply stronger per-frame scale
        missile.velocityY = Math.min(missile.velocityY + 0.12, 14.0);
        missile.gfx.x += missile.velocityX * deltaTime * 0.12;
        missile.gfx.y += missile.velocityY * deltaTime * 0.12;
        if (missile.gfx.y > this.HEIGHT + 20) {
          if (missile.gfx.parent) {
            missile.gfx.parent.removeChild(missile.gfx);
          }
          removeIndices.push(idx);
          return;
        }

        const shipBounds = this.playerShip.getBounds();
        const shotBounds = missile.gfx.getBounds();
        if (
          shotBounds.x + shotBounds.width > shipBounds.x &&
          shotBounds.x < shipBounds.x + shipBounds.width &&
          shotBounds.y + shotBounds.height > shipBounds.y &&
          shotBounds.y < shipBounds.y + shipBounds.height
        ) {
          this.losePlayerLife();
          if (missile.gfx.parent) {
            missile.gfx.parent.removeChild(missile.gfx);
          }
          removeIndices.push(idx);
        }
      });
      removeIndices
        .sort((a, b) => b - a)
        .forEach((idx) => this.enemyMissiles.splice(idx, 1));
      return;
    }

    const swarmingEnemies = this.enemyWave.filter(
      (enemy) =>
        enemy &&
        enemy.visible &&
        enemy.parent &&
        (enemy.enemyState === ENEMY_STATE.ATTACK_SWARM ||
          enemy.enemyState === ENEMY_STATE.BEGIN_ATTACK_SWARM ||
          enemy.enemyState === ENEMY_STATE.END_ATTACK_SWARM)
    );

    if (swarmingEnemies.length === 0) {
      this.enemyMissileSpawnTimer = 0.25;
      return;
    }

    const shooter =
      swarmingEnemies[Math.floor(Math.random() * swarmingEnemies.length)];
    const missile = Sprite.from("alienMissle_0.png");
    const dx = this.playerShip.x - shooter.x;
    const drift = Math.max(-1.9, Math.min(1.9, dx * 0.04));
    missile.anchor.set(0.5, 0.5);
    missile.x = shooter.x;
    missile.y = shooter.y + 10;
    this.mainContainer.addChild(missile);
    const speed = this.getEnemyMissileSpeed(shooter);
    this.enemyMissiles.push({
      gfx: missile,
      speed,
      velocityX: drift,
      velocityY: speed
    });
    this.enemyMissileSpawnTimer = Math.max(
      0.45,
      1.7 - this.waveNumber * 0.06 - this.enemyWave.length * 0.01
    );
  }

  /** Check for collisions between active enemies and the player ship.
   * Uses bounding-box intersection (sufficient for arcade feel). When an enemy
   * overlaps the player's ship, the enemy is marked dead and removed and the
   * player loses a life (explodes). This prevents multiple life losses in the
   * same frame by relying on losePlayerLife() guarding against repeated calls.
   */
  private checkEnemyShipCollisions(): void {
    if (!this.playerShip || !this.playerShip.visible) return;
    const shipBounds = this.playerShip.getBounds();

    for (const enemy of this.enemyWave) {
      if (
        !enemy ||
        !enemy.visible ||
        !enemy.parent ||
        enemy.enemyState === ENEMY_STATE.DEAD ||
        enemy.enemyState === ENEMY_STATE.DYING
      ) {
        continue;
      }

      try {
        const eb = enemy.getBounds();
        if (rectsIntersect(eb, shipBounds)) {
          // Mark enemy dying/dead and remove it from stage to prevent repeat hits
          try {
            enemy.enemyState = ENEMY_STATE.DYING;
            if (enemy.parent) enemy.parent.removeChild(enemy);
            enemy.stop();
          } catch {
            /* ignore */
          }

          try {
            // Notify controller so it doesn't keep tracking this enemy
            this.enemyAttackController.notifyEnemyKilled(enemy);
          } catch {
            /* ignore */
          }

          // Cause the player to lose a life / explode. losePlayerLife guards
          // against being called multiple times if already exploding.
          this.losePlayerLife();

          // Create a quick explosion at the enemy position for feedback
          try {
            this.createExplosion(enemy.x, enemy.y);
          } catch {
            /* ignore */
          }

          // Once a collision has been processed, skip checking further enemies
          // this frame to avoid multiple simultaneous life losses.
          break;
        }
      } catch {
        /* ignore bounds errors */
      }
    }
  }

  // Update missiles: move, check collisions, remove offscreen/hits
  public updateMissiles(deltaTime: number): void {
    const removeIndices: number[] = [];
    this.playerMissiles.forEach((m, idx) => {
      m.gfx.y -= m.speed * deltaTime;

      const bounds = m.gfx.getBounds();
      // Offscreen
      if (bounds.y + bounds.height < 0) {
        this.mainContainer.removeChild(m.gfx);
        removeIndices.push(idx);
        return;
      }

      // Collision against enemies (allow hitting swarming ones too)
      for (const enemy of this.enemyWave) {
        // Skip if already dead or in dying state
        if (
          enemy.enemyState === ENEMY_STATE.DEAD ||
          enemy.enemyState === ENEMY_STATE.DYING
        )
          continue;
        const enemyBounds = enemy.getBounds();
        if (
          bounds.x + bounds.width > enemyBounds.x &&
          bounds.x < enemyBounds.x + enemyBounds.width &&
          bounds.y < enemyBounds.y + enemyBounds.height &&
          bounds.y + bounds.height > enemyBounds.y
        ) {
          // Hit: mark as dying and remove from display
          enemy.enemyState = ENEMY_STATE.DYING;
          this.addScoreForEnemy(enemy);
          if (enemy.enemyType === ENEMY_TYPE.YELLOW) {
            this.playSound("main/sounds/08. Hit Boss.mp3");
          } else {
            this.playSound("main/sounds/07. Hit Enemy.mp3");
          }
          try {
            if (this.mainContainer.children.includes(enemy)) {
              this.mainContainer.removeChild(enemy);
            }
            enemy.stop();
          } catch {
            /* ignore */
          }

          // create explosion at enemy position and remove enemy after animation completes
          this.createExplosion(enemy.x, enemy.y, () => {
            try {
              if (this.mainContainer.children.includes(enemy)) {
                this.mainContainer.removeChild(enemy);
              }
            } catch {
              /* ignore */
            }
            try {
              // Stop animation and hide the sprite instead of destroying textures
              try {
                enemy.stop();
              } catch {
                /* ignore */
              }
              try {
                if (enemy.parent) enemy.parent.removeChild(enemy);
              } catch {
                /* ignore */
              }
              enemy.visible = false;
            } catch {
              /* ignore */
            }
            try {
              enemy.enemyState = ENEMY_STATE.DEAD;
            } catch {
              /* ignore */
            }
            // notify enemy controller in case it's tracking this enemy
            try {
              this.enemyAttackController.notifyEnemyKilled(enemy);
            } catch {
              /* ignore */
            }
          });

          // notify enemy controller (remove from swarm trackers etc.) immediately so it doesn't continue updating
          try {
            this.enemyAttackController.notifyEnemyKilled(enemy);
          } catch {
            /* ignore */
          }

          // remove missile
          try {
            this.mainContainer.removeChild(m.gfx);
          } catch {
            /* ignore */
          }
          removeIndices.push(idx);
          break;
        }
      }
    });

    // Remove missiles from array (reverse order)
    removeIndices
      .sort((a, b) => b - a)
      .forEach((i) => this.playerMissiles.splice(i, 1));
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
