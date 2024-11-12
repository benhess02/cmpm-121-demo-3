// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";

import luck from "./luck.ts";

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

const playerMarker = leaflet.marker(OAKES_CLASSROOM);
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

// Display the player's points
let playerPoints = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

// Add caches to the map by cell numbers
function spawnCache(x: number, y: number) {
  const origin = OAKES_CLASSROOM;
  const bounds = leaflet.latLngBounds([
    [origin.lat + x * TILE_DEGREES, origin.lng + y * TILE_DEGREES],
    [origin.lat + (x + 1) * TILE_DEGREES, origin.lng + (y + 1) * TILE_DEGREES],
  ]);

  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  let pointValue = Math.floor(luck([x, y, "initialValue"].toString()) * 100);

  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${x},${y}". It has value <span id="value">${pointValue}</span>.</div>`;
    const collectBtn = document.createElement("button");
    collectBtn.innerHTML = "Collect";
    collectBtn.addEventListener("click", () => {
      if (pointValue > 0) {
        pointValue--;
        popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          pointValue.toString();
        playerPoints++;
        statusPanel.innerHTML = `${playerPoints} points accumulated`;
      }
    });
    popupDiv.append(collectBtn);

    const despositBtn = document.createElement("button");
    despositBtn.innerHTML = "Deposit";
    despositBtn.addEventListener("click", () => {
      if (playerPoints > 0) {
        pointValue++;
        popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          pointValue.toString();
        playerPoints--;
        if (playerPoints == 0) {
          statusPanel.innerHTML = `No points yet...`;
        } else {
          statusPanel.innerHTML = `${playerPoints} points accumulated`;
        }
      }
    });
    popupDiv.append(despositBtn);

    return popupDiv;
  });
}

for (let x = -NEIGHBORHOOD_SIZE; x < NEIGHBORHOOD_SIZE; x++) {
  for (let y = -NEIGHBORHOOD_SIZE; y < NEIGHBORHOOD_SIZE; y++) {
    if (luck([x, y].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(x, y);
    }
  }
}
