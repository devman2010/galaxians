import { CreateEnemy } from "./CreateEnemy";
import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";
import { ENEMY_TYPE } from "./EnemyData";

export class CreateEnemyWave {
  static createWave(enemyMap: number[][]): EnemyAnimatedSprite[] {
    const enemyXSpacing = 0;
    const enemyYSpacing = -4;
    const enemyXsize = 16;
    const enemyYsize = 16;
    let xpos = 0;
    let ypos = 32;
    let rows = 0;
    let cols = 0;
    const wave: EnemyAnimatedSprite[] = [];
    enemyMap.forEach((row) => {
      cols = 0;
      row.forEach((enemyType, index: number) => {
        if (enemyType !== 0) {
          const enemy = CreateEnemy.create(enemyType);
          enemy.row = rows;
          enemy.col = cols;
          if (cols <= 4) {
            enemy.leftSide = true;
          } else {
            enemy.leftSide = false;
          }
          enemy.baseX = enemy.x = xpos;
          enemy.baseY = enemy.y = ypos;
          enemy.gotoAndStop(index % enemy.totalFrames);
          wave.push(enemy);
        }
        cols++;
        xpos += enemyXsize + enemyXSpacing; // Move to the right for the next enemy
      });
      rows++;
      ypos += enemyYsize + enemyYSpacing; // Move down for the next row
      xpos = 0; // Reset x position for the next row
    });
    return wave;
  }
}

// Each row is an array of ENEMY_TYPE or 0 (empty)
export const enemyMap: (ENEMY_TYPE | 0)[][] = [
  [0, 0, 0, ENEMY_TYPE.YELLOW, 0, 0, ENEMY_TYPE.YELLOW, 0, 0, 0],
  [
    0,
    0,
    ENEMY_TYPE.RED,
    ENEMY_TYPE.RED,
    ENEMY_TYPE.RED,
    ENEMY_TYPE.RED,
    ENEMY_TYPE.RED,
    ENEMY_TYPE.RED,
    0,
    0,
  ],
  [
    0,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    ENEMY_TYPE.PURPLE,
    0,
  ],
  [
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
  ],
  [
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
  ],
  [
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
    ENEMY_TYPE.BLUE,
  ],
];
