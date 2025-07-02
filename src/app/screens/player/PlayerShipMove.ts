import { PlayerShip } from "./PlayerShip";

export class PlayerShipMove {
  static movePlayerShip(
    playerShip: PlayerShip,
    direction: string,
    speed: number = 5,
    xMinLimit: number = 0,
    xMaxLimit: number = window.innerWidth,
    deltaTime: number = 1,
  ): void {
    switch (direction) {
      case "left":
        playerShip.x -= speed * deltaTime;
        if (playerShip.x < xMinLimit) {
          playerShip.x = 0; // Prevent moving out of bounds
        }
        playerShip.visible = false;
        playerShip.visible = true;
        break;
      case "right":
        playerShip.x += speed * deltaTime;
        if (playerShip.x > xMaxLimit) {
          playerShip.x = xMaxLimit; // Prevent moving out of bounds
        }
        playerShip.visible = false;
        playerShip.visible = true;
        break;
      default:
        console.warn("Invalid direction");
    }
  }
}
