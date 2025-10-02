import { buildMap } from "./bomber.js";
import { gameLoop, resetTimer } from "./gameLoop.js";
import { setPausedAt, addPausedDuration, resetFrameTimers } from "./gameLoop.js";
import { resetGame } from "./bomber.js";
import { startMusic, stopMusic } from "./audio.js";


let gamePaused = true;
let gameRunning = false;
export const animationState = { id: null };

const menu = document.getElementById("menu");
const mainMenu = document.getElementById("mainMenu");
const pauseMenu = document.getElementById("pauseMenu");

const startBtn = document.getElementById("startBtn");
const infoBtn = document.getElementById("infoBtn");
const settingsBtn = document.getElementById("settingsBtn");
const quitBtn = document.getElementById("quitBtn");

const continueBtn = document.getElementById("continueBtn");
const restartBtn = document.getElementById("restartBtn");
const mainMenuBtn = document.getElementById("mainMenuBtn");
const settingsPauseBtn = document.getElementById("settingsPauseBtn");
const infoPauseBtn = document.getElementById("infoPauseBtn");

const settingsMenu = document.getElementById("settingsMenu");
const backBtn = document.getElementById("backBtn");

export function showMainMenu() {
    menu.style.display = "flex";
    mainMenu.style.display = "flex";
    pauseMenu.style.display = "none";
    gamePaused = true;
}

function showPauseMenu() {
    menu.style.display = "flex";
    mainMenu.style.display = "none";
    pauseMenu.style.display = "flex";
    gamePaused = true;
}
function hideMenu() {
    menu.style.display = "none";
    gamePaused = false;
    if (!gameRunning) {
        gameRunning = true;
        resetTimer();
        buildMap();
        animationState.id = requestAnimationFrame(gameLoop);
    } else {
        animationState.id = requestAnimationFrame(gameLoop);
    }
}

// Main menu buttons
startBtn.onclick = () => {
    startMusic();
    resetFrameTimers();
    hideMenu();
};
infoBtn.onclick = () => {
    alert("Game Info: Use arrow keys to move. Space to pause.");
};
settingsBtn.onclick = () => {
    settingsMenu.style.display = "flex";
    // backBtn.focus();  // focus back button for accessibility.   ***
};
settingsPauseBtn.onclick = () => {
    settingsMenu.style.display = "flex";
    // backBtn.focus();  // focus back button for accessibility.   ***
};
backBtn.onclick = () => {
  settingsMenu.style.display = "none";   // hide settings menu and show main menu again   ***
};
quitBtn.onclick = () => {
    window.close();
};

// Pause menu buttons
continueBtn.onclick = () => {
    startMusic();  // resume music
    resetFrameTimers();
    hideMenu();
};
restartBtn.onclick = () => {
    // 1. Cancel any running animation frame
    cancelAnimationFrame(animationState.id);
    resetTimer();
    resetGame();
    buildMap();
    resetFrameTimers();
    startMusic(); // restart music
    hideMenu();
};
mainMenuBtn.onclick = () => {
    showMainMenu();
    gameRunning = false;
};
infoPauseBtn.onclick = () => {
    alert("Game Info: Use arrow keys to move. Space to pause.");
};

// pause logic:
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") e.preventDefault();     // ***

    if (e.code === "Space" && gameRunning) {
        if (e.repeat) return; // ignore if key is held down.   ***

        if (settingsMenu.style.display === "flex") {
            settingsMenu.style.display = "none";
            return; 
        }
        if (gamePaused) {
            startMusic();
            // Unpausing
            addPausedDuration();
            hideMenu();
        } else {
            stopMusic();
            // Pausing
            setPausedAt();
            showPauseMenu();
            cancelAnimationFrame(animationState.id);
        }
    }
});

// block dafault click on focused space button.   ***
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
  }
});



export { gamePaused, gameRunning };