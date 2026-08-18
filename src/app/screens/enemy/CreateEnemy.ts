import { Assets } from "pixi.js";
import { ENEMY_TYPE, enemyTypeToTexture } from "./EnemyData";
import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";

export class CreateEnemy {
  static create(enemyType: ENEMY_TYPE): EnemyAnimatedSprite {
    const sheet = Assets.get("main/spritesheets/galaxians-spritesheet.json");
    const textureId = sheet.animations[enemyTypeToTexture[enemyType]];

    const enemy = new EnemyAnimatedSprite(textureId, enemyType);
    return enemy;
  }
}
