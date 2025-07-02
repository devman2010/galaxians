import { Sprite } from "pixi.js";

// Original hand-authored Galaxian arc table from ROM
const baseArcTable = [
  [-1, 0],
  [-1, 0],
  [-1, 0],
  [-1, 1],
  [-1, 0],
  [-1, 0],
  [-1, 1],
  [-1, 0],
  [-1, 1],
  [-1, 0],
  [0, 1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [-1, 0],
  [0, 1],
  [-1, 1],
  [0, 1],
  [-1, 1],
  [0, 1],
  [0, 1],
  [-1, 1],
  [0, 1],
  [0, 1],
  [0, 1],
  [0, 1],
  [0, 1],
  [0, 1],
  [1, 1],
  [0, 1],
  [0, 1],
  [1, 1],
  [0, 1],
  [1, 1],
  [0, 1],
  [1, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, 1],
  [1, 0],
  [1, 0],
  [1, 1],
  [1, 0],
  [1, 0],
  [1, 0],
];

export class CreateEnemySpriteArc {
  private sprite: Sprite;
  private scaleX: number;
  private scaleY: number;
  private arcIndex: number;
  private start: boolean;
  private end: boolean;
  private speed: number;
  private arcTable: number[][];
  private direction: boolean;
  constructor(
    sprite: Sprite,
    speed: number = 1,
    scaleX: number = 2,
    scaleY: number = 2,
    direction: boolean = false
  ) {
    this.direction = direction;
    this.sprite = sprite;
    this.scaleX = scaleX; // >1 = wider arc
    this.scaleY = scaleY; // >2 = deeper arc
    this.arcIndex = 0;
    this.speed = speed;
    this.start = false;
    this.end = true;

    this.arcTable = baseArcTable.map(([dx, dy]) => [
      (this.direction ? dx : -dx) * this.scaleX,
      dy * this.scaleY,
    ]);
  }
  public startAnimation() {
    this.start = true;
    this.end = false;
    this.arcIndex = 0;
  }
  public stopAnimation() {
    this.start = false;
    this.end = true;
  }
  public isAnimationEnded() {
    return this.end;
  }
  public isAnimationStarted() {
    return this.start;
  }

  // Angle lerp helper (handles wrapping)
  private lerpAngle(a: number, b: number, t: number) {
    const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + diff * t;
  }

  public update(deltaTime: number) {
    if (
      this.start &&
      !this.isAnimationEnded() &&
      this.arcIndex < this.arcTable.length
    ) {
      const [dx, dy] = this.arcTable[this.arcIndex];

      const moveX = dx * this.speed * deltaTime;
      const moveY = dy * this.speed * deltaTime;

      this.sprite.x += moveX;
      this.sprite.y += moveY;

      const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
      this.sprite.rotation = this.lerpAngle(
        this.sprite.rotation,
        targetAngle,
        0.15
      );

      this.arcIndex++;

      if (this.arcIndex >= this.arcTable.length) {
        this.stopAnimation();
      }
    }
  }
}
