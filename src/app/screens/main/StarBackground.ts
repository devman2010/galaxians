import { Container, Graphics, Ticker } from "pixi.js";

type TwinklingStar = Graphics & {
  userData: {
    baseAlpha: number;
    twinkleSpeed: number;
    twinklePhase: number;
    size: number;
    color: number;
  };
};

export class StarBackground extends Container {
  private stars: TwinklingStar[] = [];
  private stageWidth: number;
  private stageHeight: number;
  private speed: number;
  private readonly colors = [
    0x9fe7ff, 0x9ae7ff, 0xffd98e, 0xffa7d6, 0xbea9ff, 0xd5ffd8, 0xffffff,
    0x7af0c9, 0xff9a7a, 0xc7f0ff
  ];

  constructor(width: number, height: number, starCount = 100, speed = 0.5) {
    super();
    this.stageWidth = width;
    this.stageHeight = height;
    this.speed = speed;

    for (let i = 0; i < starCount; i++) {
      const star = new Graphics() as TwinklingStar;
      const size = Math.random() * 0.9 + 0.4;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const alpha = Math.random() * 0.7 + 0.2;
      star.beginFill(color, alpha);
      star.drawRect(-size / 2, -size / 2, size, size);
      star.endFill();
      star.x = Math.random() * this.stageWidth;
      star.y = Math.random() * this.stageHeight;
      star.userData = {
        baseAlpha: alpha,
        twinkleSpeed: 1.5 + Math.random() * 2.8,
        twinklePhase: Math.random() * Math.PI * 2,
        size,
        color
      };
      this.stars.push(star);
      this.addChild(star);
    }
  }

  public update(_time: Ticker): void {
    const timeMs = performance.now() * 0.001;

    for (const star of this.stars) {
      star.y += this.speed * _time.deltaTime;
      const twinkle =
        0.35 +
        0.65 *
          Math.sin(
            timeMs * star.userData.twinkleSpeed + star.userData.twinklePhase
          );
      const alpha = Math.max(
        0.18,
        Math.min(1, star.userData.baseAlpha * twinkle)
      );

      star.clear();
      star.beginFill(star.userData.color, alpha);
      star.drawRect(
        -star.userData.size / 2,
        -star.userData.size / 2,
        star.userData.size,
        star.userData.size
      );
      star.endFill();

      if (star.y > this.stageHeight) {
        star.y = -2;
        star.x = Math.random() * this.stageWidth;
        star.userData.baseAlpha = 0.2 + Math.random() * 0.7;
        star.userData.size = Math.random() * 0.9 + 0.4;
        star.userData.color =
          this.colors[Math.floor(Math.random() * this.colors.length)];
        star.userData.twinkleSpeed = 1.5 + Math.random() * 2.8;
        star.userData.twinklePhase = Math.random() * Math.PI * 2;
      }
    }
  }
}
