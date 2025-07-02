import { Ticker, Container, Graphics } from "pixi.js";
import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { CreateEnemyWave, enemyMap } from "../enemy/CreateEnemyWave";
import { TexturePool } from "pixi.js";
import { StarBackground } from "./StarBackground";
import { PlayerShipMove } from "../player/PlayerShipMove";
import { PlayerShip } from "../player/PlayerShip";
import { EnemyAnimatedSprite } from "../enemy/EnemyAnimatedSprite";
import { EnemyAttackController } from "../enemy/EnemyAttackController";
import { ENEMY_STATE } from "../enemy/EnemyData";
import Stats from "stats.js";

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
  // Todo: Clean up
  constructor() {
    super();
    TexturePool.textureOptions.scaleMode = "nearest"; // Set the scale mode to nearest for pixel art
    this.mainContainer = new Container();
    const background = new Graphics()
      .rect(0, 0, this.WIDTH, this.HEIGHT)
      .fill("black"); // Fill the rectangle with a red color
    this.mainContainer.addChild(background);
    this.starBg = new StarBackground(this.WIDTH, this.HEIGHT, 100, 0.6);
    this.mainContainer.addChild(this.starBg);
    this.enemyWave = CreateEnemyWave.createWave(enemyMap);
    this.addChild(this.mainContainer);
    this.resize(engine().screen.width, engine().screen.height);
    this.playerShip = new PlayerShip(this.WIDTH / 2, this.HEIGHT - 16);
    this.mainContainer.addChild(this.playerShip);
    this.enemyAttackController = new EnemyAttackController(
      this.enemyWave,
      this.playerShip,
    );
    this.registerEvents();
    this.stats = new Stats();
    this.stats.showPanel(2);
    document.body.appendChild(this.stats.dom);
  }

  public registerEvents() {
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }

  public updatePlayerShipPosition(_time: Ticker) {
    let direction = "";

    if (this.keys["ArrowLeft"]) {
      direction = "left";
    } else if (this.keys["ArrowRight"]) {
      direction = "right";
    }
    if (direction !== "") {
      PlayerShipMove.movePlayerShip(
        this.playerShip,
        direction,
        1,
        0,
        this.WIDTH,
        _time.deltaTime,
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
    this.moveEnemiesLeftAndRight(_time);
    this.starBg.update(_time);
    this.updatePlayerShipPosition(_time);
    this.enemyAttackController.update(_time.deltaTime);
    this.stats.end();
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

    // Calculate scale factor
    const scaleX = width / targetWidth;
    const scaleY = height / targetHeight;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

    // Apply scaling
    this.mainContainer.scale.set(scale);

    this.mainContainer.x = (width - targetWidth * scale) / 2;
    this.mainContainer.y = (height - targetHeight * scale) / 2;
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
      if(enemy.enemyState != ENEMY_STATE.ALIVE_IDLE) {
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

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
