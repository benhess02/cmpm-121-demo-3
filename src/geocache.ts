export interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serial: number;
}

export class Geocache {
  readonly i: number;
  readonly j: number;
  coins: Coin[] | null;

  constructor(i: number, j: number) {
    this.i = i;
    this.j = j;
    this.coins = null;
  }

  toMomento(): string {
    return JSON.stringify(this.coins);
  }

  fromMomento(momento: string): void {
    this.coins = JSON.parse(momento);
  }
}
