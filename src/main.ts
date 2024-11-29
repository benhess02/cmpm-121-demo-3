// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";

import luck from "./luck.ts";

import { Board } from "./board.ts";
import { Coin } from "./geocache.ts";
import { GameState } from "./gameState.ts";

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

const mapRectangles: leaflet.Rectangle[] = [];

let gameState = new GameState(
  Math.floor(OAKES_CLASSROOM.lat / TILE_DEGREES),
  Math.floor(OAKES_CLASSROOM.lng / TILE_DEGREES),
);

let geolocationWatch: number = -1;

const playerMarker = leaflet.marker(
  leaflet.latLng(
    gameState.getPlayerLocation()[0] * TILE_DEGREES,
    gameState.getPlayerLocation()[1] * TILE_DEGREES,
  ),
);
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

let playerPath: [number, number][] = [];
const pathPolyline = leaflet.polyline(playerPath, { color: "blue" });
pathPolyline.addTo(map);

// Display the player's points
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = `${gameState.getCoinCount()} coins`;

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  const cell = board.getCellForPoint(
    leaflet.latLng(i * TILE_DEGREES, j * TILE_DEGREES),
  )!;

  const rect = leaflet.rectangle(board.getCellBounds(cell));
  rect.addTo(map);
  mapRectangles.push(rect);

  if (cell.coins == null) {
    const pointValue = Math.floor(
      luck([i, j, "initialValue"].toString()) * 100,
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
        gameState.addCoin(coin);
        coinItem.remove();
        statusPanel.innerHTML = `${gameState.getCoinCount()} coins`;
        addInventoryCoin(coin);
        save();
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
        gameState.removeCoin(coin);
        cell.coins!.push(coin);
        coinItem.remove();
        statusPanel.innerHTML = `${gameState.getCoinCount()} coins`;
        addCacheCoin(coin);
        save();
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
    gameState.getCoins().forEach((coin) => {
      addInventoryCoin(coin);
    });
    popupDiv.append(inventoryList);

    return popupDiv;
  });
}

function save() {
  board.save();
  localStorage.setItem(
    "position",
    JSON.stringify(gameState.getPlayerLocation()),
  );
  localStorage.setItem("path", JSON.stringify(playerPath));
  localStorage.setItem("coins", JSON.stringify(gameState.getCoins()));
}

function load() {
  gameState = new GameState(
    Math.floor(OAKES_CLASSROOM.lat / TILE_DEGREES),
    Math.floor(OAKES_CLASSROOM.lng / TILE_DEGREES),
  );
  playerPath = [];
  const positionStr = localStorage.getItem("position");
  if (positionStr !== null) {
    const [newPlayerI, newPlayerJ] = JSON.parse(positionStr);
    gameState.setPlayerPosition(newPlayerI, newPlayerJ);
  }
  const pathStr = localStorage.getItem("path");
  if (pathStr !== null) {
    playerPath = JSON.parse(pathStr);
  }
  const coinStr = localStorage.getItem("coins");
  if (coinStr !== null) {
    const playerCoins: Coin[] = JSON.parse(coinStr);
    playerCoins.forEach((c) => gameState.addCoin(c));
  }
  statusPanel.innerHTML = `${gameState.getCoinCount()} coins`;
  map.setView(leaflet.latLng(
    (gameState.getPlayerLocation()[0] + 0.5) * TILE_DEGREES,
    (gameState.getPlayerLocation()[1] + 0.5) * TILE_DEGREES,
  ));
  disableGeolocationTracking();
  regenerate();
}

function regenerate() {
  board.clear();
  playerMarker.setLatLng(
    leaflet.latLng(
      (gameState.getPlayerLocation()[0] + 0.5) * TILE_DEGREES,
      (gameState.getPlayerLocation()[1] + 0.5) * TILE_DEGREES,
    ),
  );
  playerPath.push([
    (gameState.getPlayerLocation()[0] + 0.5) * TILE_DEGREES,
    (gameState.getPlayerLocation()[1] + 0.5) * TILE_DEGREES,
  ]);
  pathPolyline.setLatLngs(playerPath);
  while (mapRectangles.length > 0) {
    mapRectangles.pop()!.removeFrom(map);
  }
  for (let x = -NEIGHBORHOOD_SIZE; x < NEIGHBORHOOD_SIZE; x++) {
    for (let y = -NEIGHBORHOOD_SIZE; y < NEIGHBORHOOD_SIZE; y++) {
      const lat = gameState.getPlayerLocation()[0] + x;
      const lng = gameState.getPlayerLocation()[1] + y;
      if (luck([lat, lng].toString()) < CACHE_SPAWN_PROBABILITY) {
        spawnCache(lat, lng);
      }
    }
  }
}

load();

function enableGeolocationTracking() {
  document.querySelector<HTMLButtonElement>("#sensor")!.style.backgroundColor =
    "#3c3c3c";
  if (geolocationWatch >= 0) {
    return;
  }
  geolocationWatch = navigator.geolocation.watchPosition((pos) => {
    const newI = Math.floor(pos.coords.latitude / TILE_DEGREES);
    const newJ = Math.floor(pos.coords.longitude / TILE_DEGREES);
    map.setView(leaflet.latLng(
      (newI + 0.5) * TILE_DEGREES,
      (newJ + 0.5) * TILE_DEGREES,
    ));
    if (
      gameState.getPlayerLocation()[0] != newI ||
      gameState.getPlayerLocation()[1] != newJ
    ) {
      gameState.setPlayerPosition(newI, newJ);
      save();
      regenerate();
    }
  });
}

function disableGeolocationTracking() {
  document.querySelector<HTMLButtonElement>("#sensor")!.style.backgroundColor =
    "#1a1a1a";
  if (geolocationWatch >= 0) {
    navigator.geolocation.clearWatch(geolocationWatch);
    geolocationWatch = -1;
  }
}

document.querySelector<HTMLButtonElement>("#north")?.addEventListener(
  "click",
  () => {
    gameState.movePlayer(1, 0);
    disableGeolocationTracking();
    save();
    regenerate();
  },
);

document.querySelector<HTMLButtonElement>("#south")?.addEventListener(
  "click",
  () => {
    gameState.movePlayer(-1, 0);
    disableGeolocationTracking();
    save();
    regenerate();
  },
);

document.querySelector<HTMLButtonElement>("#east")?.addEventListener(
  "click",
  () => {
    gameState.movePlayer(0, 1);
    disableGeolocationTracking();
    save();
    regenerate();
  },
);

document.querySelector<HTMLButtonElement>("#west")?.addEventListener(
  "click",
  () => {
    gameState.movePlayer(0, -1);
    disableGeolocationTracking();
    save();
    regenerate();
  },
);

document.querySelector("#sensor")?.addEventListener(
  "click",
  () => {
    if (geolocationWatch < 0) {
      enableGeolocationTracking();
    } else {
      disableGeolocationTracking();
    }
  },
);

document.querySelector("#reset")?.addEventListener(
  "click",
  () => {
    const response = prompt(
      "Are you sure you want to delete ALL saved data? [Y/N]",
    )?.toUpperCase();
    if (response == "Y" || response == "YES") {
      localStorage.clear();
      load();
    }
  },
);
