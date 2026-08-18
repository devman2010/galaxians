import {
  Ticker,
  Container,
  Graphics,
  AnimatedSprite,
  Assets,
  Sprite
} from "pixi.js";
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
  // Active player missiles (sprite + speed)
  public playerMissiles: { gfx: Sprite; speed: number }[] = [];
  // Active explosions (gfx, life elapsed, duration)
  public explosions: { gfx: Graphics; life: number; duration: number }[] = [];
  // Track space key to fire once per press
  private spacePressedLastFrame: boolean = false;
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
      this.playerShip
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

    // Update missiles (movement, collisions, cleanup)
    this.updateMissiles(_time.deltaTime);

    // Update explosions (animate and remove)
    this.updateExplosions(_time.deltaTime);

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
    const sprite = Sprite.from("playerMissle_0.png");
    sprite.anchor.set(0.5, 0.5);
    // use native sprite size (no scaling)

    // Position the missile over the top-middle of the player's ship
    const shipTop = this.playerShip.y - (this.playerShip.height / 2 || 8);
    sprite.x = this.playerShip.x;
    sprite.y = shipTop - sprite.height / 2;

    this.mainContainer.addChild(sprite);
    this.playerMissiles.push({ gfx: sprite, speed: 4 });
  }

  // Explosion helper (uses spritesheet animation)
  public createExplosion(x: number, y: number): void {
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
        } catch { /* ignore */ }
      };
      this.mainContainer.addChild(anim);
      anim.play();
    } catch (err) {
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
        } catch { /* ignore */ }
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

      // Collision against alive enemies
      for (const enemy of this.enemyWave) {
        if (enemy.enemyState !== ENEMY_STATE.ALIVE_IDLE) continue;
        const enemyBounds = enemy.getBounds();
        if (
          bounds.x + bounds.width > enemyBounds.x &&
          bounds.x < enemyBounds.x + enemyBounds.width &&
          bounds.y < enemyBounds.y + enemyBounds.height &&
          bounds.y + bounds.height > enemyBounds.y
        ) {
          // Hit: mark dead and remove from display
          enemy.enemyState = ENEMY_STATE.DEAD;
          try {
            if (this.mainContainer.children.includes(enemy)) {
              this.mainContainer.removeChild(enemy);
            }
            enemy.stop();
          } catch { /* ignore */ }

          // create explosion at enemy position
          this.createExplosion(enemy.x, enemy.y);

          // remove missile
          this.mainContainer.removeChild(m.gfx);
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
