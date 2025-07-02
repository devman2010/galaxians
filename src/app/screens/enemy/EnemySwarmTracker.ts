import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";

export class EnemySwarmTracker {
  private _enemySet: Set<EnemyAnimatedSprite>;

  constructor() {
    this._enemySet = new Set();
  }

  public addEnemy(enemy: EnemyAnimatedSprite) {
    this._enemySet.add(enemy);
  }

  public removeEnemy(enemy: EnemyAnimatedSprite) {
    this._enemySet.delete(enemy);
  }

  get size() {
    return this._enemySet.size;
  }

  get enemySet() {
    return this._enemySet;
  }
}
