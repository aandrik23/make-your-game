import { gameLoop } from "./gameLoop.js";
import { buildMap } from "./bomber.js";


buildMap();

requestAnimationFrame(gameLoop);