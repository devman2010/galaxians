import { AnimatedSprite, Assets, Sprite } from "pixi.js";

export class PlayerShip extends Sprite {
  /** Assets bundles required by this screen */
  public shipXposition: number;
  public shipYposition: number;

  constructor(shipXposition: number = 0, shipYposition = 0) {
    super(Sprite.from("playerShip_0.png"));
    this.x = this.shipXposition = shipXposition;
    this.y = this.shipYposition = shipYposition;
    this.anchor.set(0.5, 0.5);
  }

  public createPlayerShipExplodeAnimation(speed: number = 0.1): AnimatedSprite {
    const sheet = Assets.get("main/spritesheets/galaxians-spritesheet.json");
    const explodeFrames = sheet.animations["playerShipExplode"]; // Array of textures
    const anim = new AnimatedSprite(explodeFrames);
    anim.animationSpeed = speed;
    return anim;
  }
}
