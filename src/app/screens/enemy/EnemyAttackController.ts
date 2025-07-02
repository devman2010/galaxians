import { Vector2 } from "@esotericsoftware/spine-pixi-v8";
import { PlayerShip } from "../player/PlayerShip";
import { CreateEnemySpriteArc } from "./CreateEnemySpriteMovements";
import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";
import { ENEMY_STATE } from "./EnemyData";
import { EnemySwarmPlayer, AlienType, Vector2 } from "./EnemySwarmPlayer";
import { EnemySwarmTracker } from "./EnemySwarmTracker";

export class EnemyAttackController {
  public ticksSinceLastAttack: number = 0;
  public attackInterval: number = 60; // Default attack interval in ticks
  public attackSpeed: number = 0.5; // Speed of the attack movement
  public enemyWave: EnemyAnimatedSprite[]; // Array of enemy ships
  public playerShip: PlayerShip; // Reference to the player ship
  public enemySwarmTracker: EnemySwarmTracker;
  private sideSwarm: EnemyAnimatedSprite[];
  private attackSwarm: EnemySwarmPlayer[];
  private ticksSinceLastSwarmLaunch: number;
  private enemyAttackArc: {
    enemyAnimatedSprite: EnemyAnimatedSprite;
    enemySpriteArc: CreateEnemySpriteArc;
  }[];

  constructor(enemyShips: EnemyAnimatedSprite[], playerShip: PlayerShip) {
    this.ticksSinceLastSwarmLaunch = 0;
    this.attackSwarm = [];
    this.sideSwarm = [];
    this.enemyWave = enemyShips;
    this.playerShip = playerShip;
    this.enemySwarmTracker = new EnemySwarmTracker();
    this.enemyAttackArc = [];
  }

  private selectEnemiesForSwarm(
    leftSide: boolean,
    enemyWave: EnemyAnimatedSprite[],
    total: number
  ): EnemyAnimatedSprite[] {
    let result: EnemyAnimatedSprite[] = [];
    const sortedEnemyCols = enemyWave.filter(
      (enemy) => enemy.enemyState === ENEMY_STATE.ALIVE_IDLE
    );

    if (sortedEnemyCols.length > 0) {
      sortedEnemyCols.sort((a, b) =>
        leftSide ? a.col - b.col : b.col - a.col
      );
      const lowestOrHighestCol = sortedEnemyCols[0].col;
      const firstSortedColumn = sortedEnemyCols.filter(
        (enemy) => enemy.col === lowestOrHighestCol
      );

      if (firstSortedColumn.length > 0) {
        result = firstSortedColumn.sort((a, b) => a.row - b.row).slice(0, total);
      }
    }
    return result;
  }

  public update(deltaTime: number): void {
    this.ticksSinceLastAttack += deltaTime;

    if (this.ticksSinceLastAttack >= this.attackInterval) {
      if (this.sideSwarm.length === 0 && this.enemySwarmTracker.size === 0) {
        this.sideSwarm = this.selectEnemiesForSwarm(
          Math.random() < 0.5,
          this.enemyWave,
          Math.ceil(Math.random() * 4)
        );
        this.ticksSinceLastSwarmLaunch = 0;
      }
    }

    this.updateSideSwarm(deltaTime);
    this.updateSwarmTracker(deltaTime);
    this.updateEnemyArc(deltaTime);
  }

  private updateSideSwarm(deltaTime: number): void {
    if (this.sideSwarm.length > 0) {
      this.ticksSinceLastSwarmLaunch += deltaTime;

      if (this.ticksSinceLastSwarmLaunch > 20) {
        this.ticksSinceLastSwarmLaunch = 0;
        const enemy = this.sideSwarm.shift();

        if (this.sideSwarm.length === 0) {
          this.ticksSinceLastAttack = 0;
        }

        if (enemy) {
          enemy.enemyState = ENEMY_STATE.ALIVE_IDLE_TO_ATTACK_LOOP_PATH;
          this.enemySwarmTracker.addEnemy(enemy);
          this.enemyAttackArc.push({
            enemyAnimatedSprite: enemy,
            enemySpriteArc: (() => {
              const arc = new CreateEnemySpriteArc(enemy, 1, 1, 1, enemy.leftSide);
              arc.startAnimation();
              return arc;
            })(),
          });
        }
      }
    }
  }

  private updateEnemyArc(deltaTime: number) {
    if (this.enemyAttackArc.length > 0) {
      this.enemyAttackArc.forEach((enemyArc) => {
        enemyArc.enemySpriteArc.update(deltaTime);
        if (
          enemyArc.enemySpriteArc.isAnimationEnded() &&
          enemyArc.enemyAnimatedSprite.enemyState === ENEMY_STATE.ALIVE_IDLE_TO_ATTACK_LOOP_PATH
        ) {
          enemyArc.enemyAnimatedSprite.enemyState = ENEMY_STATE.BEGIN_ATTACK_SWARM;
        }
      });
    }

    this.enemyAttackArc = this.enemyAttackArc.filter(
      (enemyArc) => !enemyArc.enemySpriteArc.isAnimationEnded()
    );
  } 

  private updateSwarmTracker(deltaTime: number): void {
    if (this.enemySwarmTracker.size > 0) {
      this.enemySwarmTracker.enemySet.forEach((enemy) => {
        switch (enemy.enemyState) {
          case ENEMY_STATE.BEGIN_ATTACK_SWARM:
            this.attackSwarm.push(
              (() => {
                const enemyStartPos: Vector2 = {
                  x: enemy.x, y: enemy.y
                };
                const newAttack = new EnemySwarmPlayer(AlienType.Blue, enemyStartPos, enemy, 1);
                newAttack.startSwarm();
                return newAttack;
              })()
            );
            enemy.enemyState = ENEMY_STATE.ATTACK_SWARM;
            break;

          case ENEMY_STATE.ATTACK_SWARM:
            if (this.attackSwarm.length > 0) {
              this.attackSwarm.forEach((enemySwarm) => {
                const playerShip: Vector2 = {
                  x: this.playerShip.x,
                  y: this.playerShip.y
                };
                enemySwarm.update(deltaTime, playerShip);
                if (enemySwarm.isSwarmEnded()) {
                  enemy.enemyState = ENEMY_STATE.END_ATTACK_SWARM;
                }
              });
            }
            break;

          case ENEMY_STATE.END_ATTACK_SWARM:
            this.enemySwarmTracker.removeEnemy(enemy);
            this.attackSwarm = this.attackSwarm.filter( (thisEnemy)=> thisEnemy === enemy);
            enemy.destroy();
            console.log("Removing Enemy!")
            break;

          case ENEMY_STATE.DYING:
            console.log("Dying!");
            break;

          case ENEMY_STATE.DEAD:
            console.log("Dead");
            break;
        }
      });
    }
  }
}