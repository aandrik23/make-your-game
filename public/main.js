import { gameLoop } from "./gameLoop.js";
import { buildMap } from "./bomber.js";
import { showMainMenu } from "./menu.js";
import { initAudioControls } from "./audio.js";


import { player } from './bomber.js';

window.addEventListener("keydown", (e) => {
    if (["b", "B", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
    }

    if (!player) return; // No player yet

    switch (e.key) {
        case "ArrowUp": case "w": case "W": player.nextDir = { dx: 0, dy: -1 }; break;
        case "ArrowDown": case "s": case "S": player.nextDir = { dx: 0, dy: 1 }; break;
        case "ArrowLeft": case "a": case "A": player.nextDir = { dx: -1, dy: 0 }; break;
        case "ArrowRight": case "d": case "D": player.nextDir = { dx: 1, dy: 0 }; break;
        case "B": case "b": player.dropBomb(); break;
    }
});


//Initialize audio controls
initAudioControls();

// Show main menu on load
showMainMenu();

