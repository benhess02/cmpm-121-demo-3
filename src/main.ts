// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";

import luck from "./luck.ts";

import { Board, Coin } from "./board.ts";

// Starting location
const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

const map = leaflet.map(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

const playerMarker = leaflet.marker(OAKES_CLASSROOM);
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

// Display the player's points
const playerCoins: Coin[] = [];
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = `${playerCoins.length} coins`;

// Add caches to the map by cell numbers
function spawnCache(x: number, y: number) {
  const cell = board.getCellForPoint(leaflet.latLng(x, y))!;

  const rect = leaflet.rectangle(board.getCellBounds(cell));
  rect.addTo(map);

  if (cell.coins == null) {
    const pointValue = Math.floor(
      luck([x, y, "initialValue"].toString()) * 100,
    );
    cell.coins = [];
    for (let i = 0; i < pointValue; i++) {
      cell.coins.push({ i: cell.i, j: cell.j, serial: i });
    }
  }

  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>Cache ${cell.i}:${cell.j}</div>`;

    function addCacheCoin(coin: Coin) {
      const coinItem = document.createElement("li");
      coinList.append(coinItem);
      coinItem.innerHTML = `${coin.i}:${coin.j}#${coin.serial}`;
      const collectBtn = document.createElement("button");
      coinItem.append(collectBtn);
      collectBtn.innerHTML = "Collect";
      collectBtn.addEventListener("click", () => {
        console.log(`Collecting ${coin.i}:${coin.j}#${coin.serial}`);
        cell.coins!.splice(cell.coins!.indexOf(coin), 1);
        playerCoins.push(coin);
        coinItem.remove();
        statusPanel.innerHTML = `${playerCoins.length} coins`;
        addInventoryCoin(coin);
      });
    }

    function addInventoryCoin(coin: Coin) {
      const coinItem = document.createElement("li");
      inventoryList.append(coinItem);
      coinItem.innerHTML = `${coin.i}:${coin.j}#${coin.serial}`;
      const depositBtn = document.createElement("button");
      coinItem.append(depositBtn);
      depositBtn.innerHTML = "Deposit";
      depositBtn.addEventListener("click", () => {
        console.log(`Depositing ${coin.i}:${coin.j}#${coin.serial}`);
        playerCoins.splice(playerCoins.indexOf(coin), 1);
        cell.coins!.push(coin);
        coinItem.remove();
        statusPanel.innerHTML = `${playerCoins.length} coins`;
        addCacheCoin(coin);
      });
    }

    const coinList = document.createElement("ul");
    coinList.style.overflow = "scroll";
    coinList.style.maxHeight = "200px";
    cell.coins!.forEach((coin) => {
      addCacheCoin(coin);
    });
    popupDiv.append(coinList);

    const inventoryList = document.createElement("ul");
    inventoryList.style.overflow = "scroll";
    inventoryList.style.maxHeight = "200px";
    playerCoins.forEach((coin) => {
      addInventoryCoin(coin);
    });
    popupDiv.append(inventoryList);

    return popupDiv;
  });
}

for (let x = -NEIGHBORHOOD_SIZE; x < NEIGHBORHOOD_SIZE; x++) {
  for (let y = -NEIGHBORHOOD_SIZE; y < NEIGHBORHOOD_SIZE; y++) {
    if (luck([x, y].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(
        OAKES_CLASSROOM.lat + (x * TILE_DEGREES),
        OAKES_CLASSROOM.lng + (y * TILE_DEGREES),
      );
    }
  }
}
