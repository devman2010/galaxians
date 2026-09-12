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

  // formationX/Y hold the original formation slot for this enemy. They are set
  // when the wave is created and used for respawn calculations so enemies can
  // return to their original position.
  public formationX: number;
  public formationY: number;
  /** original index in the enemyWave array; helps restore array ordering on respawn */
  public formationIndex: number;

  constructor(textureId: any, enemyType: ENEMY_TYPE) {
    super(textureId);
    this.enemyType = enemyType;
    this.leftSide = false;
    this.row = 0;
    this.col = 0;
    this.baseX = 0;
    this.baseY = 0;
    this.formationX = 0;
    this.formationY = 0;
    this.formationIndex = -1;
    this.enemyState = ENEMY_STATE.ALIVE_IDLE;
    this.x = this.baseX;
    this.y = this.baseY;
    this.scale.set(1);
    this.anchor.set(0.5);
  }

  public updateSpritePosition(x?: number, y?: number): void {
    if (x !== undefined) {
      this.x = this.baseX = x;
      // if formation hasn't been set yet, initialize it to the first set
      if (!this.formationX) this.formationX = this.baseX;
    }
    if (y !== undefined) {
      this.y = this.baseY = y;
      if (!this.formationY) this.formationY = this.baseY;
    }
    // Force visibility toggle to update position
    const wasVisible = this.visible;
    this.visible = false;
    this.visible = wasVisible;
  }
}
