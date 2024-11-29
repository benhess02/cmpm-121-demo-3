import { Coin } from "./geocache.ts";

export class GameState {
  private playerI: number;
  private playerJ: number;
  private playerCoins: Coin[];

  constructor(initialI: number, initialJ: number) {
    this.playerI = initialI;
    this.playerJ = initialJ;
    this.playerCoins = [];
  }

  // Getters to retrieve the player's location and coins
  getPlayerLocation(): [number, number] {
    return [this.playerI, this.playerJ];
  }

  getCoins(): Coin[] {
    // Return a shallow copy to prevent external mutation
    return [...this.playerCoins];
  }

  // Other existing methods for updating position and coins
  movePlayer(deltaI: number, deltaJ: number) {
    this.playerI += deltaI;
    this.playerJ += deltaJ;
  }

  setPlayerPosition(i: number, j: number) {
    this.playerI = i;
    this.playerJ = j;
  }

  addCoin(coin: Coin) {
    this.playerCoins.push(coin);
  }

  removeCoin(coin: Coin) {
    const index = this.playerCoins.indexOf(coin);
    if (index !== -1) {
      this.playerCoins.splice(index, 1);
    }
  }

  getCoinCount(): number {
    return this.playerCoins.length;
  }
}
