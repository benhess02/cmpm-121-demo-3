// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

export interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serial: number;
}

export interface Cell {
  readonly i: number;
  readonly j: number;
  coins: Coin[] | null;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map();
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: Math.floor(point.lat / this.tileWidth),
      j: Math.floor(point.lng / this.tileWidth),
      coins: null,
    });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [cell.i * this.tileWidth, cell.j * this.tileWidth],
      [(cell.i + 1) * this.tileWidth, (cell.j + 1) * this.tileWidth],
    ]);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    const startI = originCell.i - this.tileVisibilityRadius;
    const endI = originCell.i + this.tileVisibilityRadius;
    const startJ = originCell.j - this.tileVisibilityRadius;
    const endJ = originCell.j + this.tileVisibilityRadius;
    for (let i = startI; i < endI; i++) {
      for (let j = startJ; j < endJ; j++) {
        resultCells.push(this.getCanonicalCell({ i: i, j: j, coins: null }));
      }
    }
    return resultCells;
  }
}
