import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";

export class EnemySwarmTrackerData {
    public enemyAnimatedSprite: EnemyAnimatedSprite;

    constructor(enemyAnimatedSprite: EnemyAnimatedSprite) {
        this.enemyAnimatedSprite = enemyAnimatedSprite;
    }
}
