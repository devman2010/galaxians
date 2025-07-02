import * as PIXI from "pixi.js";
import { EnemyAnimatedSprite } from "./EnemyAnimatedSprite";

export type Vector2 = { x: number; y: number };

export enum AlienType {
  Red,
  Blue,
  Purple,
  Yellow,
}

enum PlanState {
  ReadyToAttack,
  AttackingPlayer,
  ReturningToSwarm,
}

export class EnemySwarmPlayer {
  sprite: EnemyAnimatedSprite;
  speed: number;
  isSwarming: boolean;
  isExited: boolean;
  type: AlienType;
  position: Vector2;
  pivotOrigin: number;
  pivotAdd: number;
  inflight = { s1a: 0, s1b: 0, s1c: 0 };
  plan: PlanState;
  center: number;
  targetingSlot: number; // for Red/flagship logic
  positionOffset: number;
  velocity: number;
  sineOffset: number;
  constructor(
    type: AlienType,
    startPos: Vector2,
    sprite: EnemyAnimatedSprite,
    speed: number = 1.0
  ) {
    this.sprite = sprite;
    this.speed = speed;
    this.positionOffset = 0;
    this.isSwarming = false;
    this.isExited = false;
    this.position = { ...startPos };
    this.plan = PlanState.ReadyToAttack;
    this.center = this.position.x;
    this.velocity = 0;
    this.sineOffset = 0;
  }

  readyToAttack(shipPos: Vector2) {
    if (this.type === AlienType.Red && this.targetingSlot > 0) {
      // Key red-or-flagship logic: inherit offset...
      this.pivotAdd = shipPos.x - this.position.x;
      // pivotOrigin remains as before
      this.resetInflight();
      this.plan = PlanState.AttackingPlayer;
      return;
    }

    // Determine side
    const deltaX = shipPos.x - this.position.x;
    let half = Math.floor(deltaX / 2);

    if (deltaX >= 0) {
      const clamped = Math.min(100, Math.max(half + 12, 40));
      this.pivotAdd = clamped;
    } else {
      const clamped = Math.min(-40, Math.max(deltaX / 2 - 12, -100));
      this.pivotAdd = clamped;
    }

    // Compute pivot origin around screen width: pivot = (screenWidth - posX) + pivotAdd
    this.pivotOrigin = this.position.x;
    this.resetInflight();
    this.plan = PlanState.AttackingPlayer;
  }

  resetInflight() {
    this.inflight.s1a = this.inflight.s1b = this.inflight.s1c = 0;
  }

  update(deltaTime: number, shipPos: Vector2) {
    if (this.isSwarmEnded()) {
      return;
    }
    switch (this.plan) {
      case PlanState.ReadyToAttack:
        this.readyToAttack(shipPos);
        break;

      case PlanState.AttackingPlayer:
        this.attackUpdate(deltaTime, shipPos);
        break;

      // ... other cases
    }
  }

  attackUpdate(deltaTime: number, shipPos: Vector2) {
    this.updateInflight(deltaTime); // updates pivotAdd over time

    this.position.x = this.positionOffset + this.pivotOrigin;

    // Simple vertical speed
    const verticalSpeed = this.speed * deltaTime;
    this.position.y += verticalSpeed;

    this.sprite.updateSpritePosition(this.position.x, this.position.y);

    // Transition condition (like NearBottomOfScreen)
    if (this.position.y >= 256 /* example threshold */) {
      this.plan = PlanState.ReturningToSwarm;
      this.isExited = true;
      this.sprite.visible = false;

    }
  }

  updateInflight(deltaTime: number) {
    let x = this.pivotOrigin + this.positionOffset;
    let center = this.pivotOrigin + this.pivotAdd;
    let amplitude = this.pivotAdd;
    let stiffness = 0.005;
    let dampling = 0.94;
    this.sineOffset += (1/60) * deltaTime;
    const target = center + amplitude * Math.sin(this.sineOffset);
    const force = target - x;
    const acceleration = force * stiffness;

    this.velocity += acceleration;
    this.velocity *= dampling;
    let oldX = this.positionOffset;
    this.positionOffset += this.velocity;
    let dx = this.positionOffset - oldX;
    let dy = 1;
    const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
    this.sprite.rotation = targetAngle;
  }

  public startSwarm() {
    this.isSwarming = true;
    this.isExited = false;
  }

  public stopSwarm() {
    this.isSwarming = false;
  }

  public isSwarmStarted(): boolean {
    return this.isSwarming;
  }

  public isSwarmEnded(): boolean {
    return this.isExited;
  }

  readToAttack(shipPos: Vector2) {}
  public getSprite(): PIXI.Sprite {
    return this.sprite;
  }
}
