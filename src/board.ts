// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

import { Geocache } from "./geocache.ts";

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly savedCells: Map<string, string>;
  private readonly knownCells: Map<string, Geocache>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map();
    this.savedCells = new Map();
  }

  private getCanonicalCell(cell: Geocache): Geocache {
    const key = [cell.i, cell.j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }
    const result = this.knownCells.get(key)!;
    const storedMomento = localStorage.getItem(key);
    if (storedMomento != null) {
      result.fromMomento(storedMomento);
    }
    return result;
  }

  getCellForPoint(point: leaflet.LatLng): Geocache {
    return this.getCanonicalCell(
      new Geocache(
        Math.floor(point.lat / this.tileWidth),
        Math.floor(point.lng / this.tileWidth),
      ),
    );
  }

  getCellBounds(cell: Geocache): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [cell.i * this.tileWidth, cell.j * this.tileWidth],
      [(cell.i + 1) * this.tileWidth, (cell.j + 1) * this.tileWidth],
    ]);
  }

  getCellsNearPoint(point: leaflet.LatLng): Geocache[] {
    const resultCells: Geocache[] = [];
    const originCell = this.getCellForPoint(point);
    const startI = originCell.i - this.tileVisibilityRadius;
    const endI = originCell.i + this.tileVisibilityRadius;
    const startJ = originCell.j - this.tileVisibilityRadius;
    const endJ = originCell.j + this.tileVisibilityRadius;
    for (let i = startI; i < endI; i++) {
      for (let j = startJ; j < endJ; j++) {
        resultCells.push(this.getCanonicalCell(new Geocache(i, j)));
      }
    }
    return resultCells;
  }

  save() {
    this.knownCells.forEach((cell) => {
      const key = [cell.i, cell.j].toString();
      localStorage.setItem(key, cell.toMomento());
    });
  }

  clear() {
    this.save();
    this.knownCells.clear();
  }
}
