import { Container, Graphics, Ticker } from "pixi.js";

export class StarBackground extends Container {
  private stars: Graphics[] = [];
  private stageWidth: number;
  private stageHeight: number;
  private speed: number;

  constructor(width: number, height: number, starCount = 100, speed = 0.5) {
    super();
    this.stageWidth = width;
    this.stageHeight = height;
    this.speed = speed;

    // Create stars
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      star.beginFill(0xffffff * Math.random(), Math.random() * 0.8 + 0.2);
      star.drawCircle(0, 0, Math.random() * 0.1 + 0.5);
      star.endFill();
      star.x = Math.random() * this.stageWidth;
      star.y = Math.random() * this.stageHeight;
      this.stars.push(star);
      this.addChild(star);
    }
  }

  public update(_time: Ticker): void {
    for (const star of this.stars) {
      star.y += this.speed * _time.deltaTime;
      if (star.y > this.stageHeight) {
        star.y = 0;
        star.x = Math.random() * this.stageWidth;
      }
    }
  }
}
