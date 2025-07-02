export enum ENEMY_TYPE {
  BLUE = 1,
  PURPLE = 2,
  RED = 3,
  YELLOW = 4,
}

export const enemyTypeToTexture = {
  [ENEMY_TYPE.BLUE]: "blueAlien",
  [ENEMY_TYPE.PURPLE]: "purpleAlien",
  [ENEMY_TYPE.RED]: "redAlien",
  [ENEMY_TYPE.YELLOW]: "yellowAlien",
};

export enum ENEMY_STATE {
  DEAD,
  ALIVE_IDLE,
  DYING,
  ALIVE_IDLE_TO_ATTACK_LOOP_PATH,
  ATTACK_LOOP_PATH,
  END_ATTACK_LOOP_PATH,
  BEGIN_ATTACK_SWARM,
  ATTACK_SWARM,
  END_ATTACK_SWARM,
}
