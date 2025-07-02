import { AnimatedSprite } from "pixi.js";
import { ENEMY_TYPE, ENEMY_STATE } from "./EnemyData";

export class EnemyAnimatedSprite extends AnimatedSprite {
  enemyType: ENEMY_TYPE;
  public leftSide: boolean;
  public baseX: number;
  public baseY: number;
  public row: number;
  public col: number;
  public enemyState: ENEMY_STATE = ENEMY_STATE.ALIVE_IDLE;
  constructor(textureId: any, enemyType: ENEMY_TYPE) {
    super(new AnimatedSprite(textureId));
    this.enemyType = enemyType;
    this.leftSide = false;
    this.row = 0;
    this.col = 0;
    this.baseX = 0;
    this.baseY = 0;
    this.enemyState = ENEMY_STATE.ALIVE_IDLE;
    this.x = this.baseX;
    this.y = this.baseY;
    this.scale.set(1);
    this.anchor.set(0.5);
  }

  public updateSpritePosition(x?: number, y?: number): void {
    if (x !== undefined) {
      this.x = this.baseX = x;
    }
    if (y !== undefined) {
      this.y = this.baseY = y;
    }
    // Force visibility toggle to update position
    // This is a workaround to ensure the sprite updates its position
    // when the position is set, as sometimes PixiJS does not update
    // the position immediately.
    // This is a hacky way to force the sprite to re-render at the new position.
    // It toggles visibility off and on.
    const wasVisible = this.visible;
    this.visible = false;
    this.visible = wasVisible;
  }
}
