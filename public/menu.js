import { buildMap } from "./bomber.js";
import { gameLoop, resetTimer } from "./gameLoop.js";
import { setPausedAt, addPausedDuration, resetFrameTimers } from "./gameLoop.js";
import { resetGame } from "./bomber.js";


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
const infoPauseBtn = document.getElementById("infoPauseBtn");

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
    resetFrameTimers();
    hideMenu();
};
infoBtn.onclick = () => {
    alert("Game Info: Use arrow keys to move. Space to pause.");
};
settingsBtn.onclick = () => {
    alert("Settings not implemented.");
};
quitBtn.onclick = () => {
    window.close();
};

// Pause menu buttons
continueBtn.onclick = () => {
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
    if (e.code === "Space" && gameRunning) {
        if (gamePaused) {
            // Unpausing
            addPausedDuration();
            hideMenu();
        } else {
            // Pausing
            setPausedAt();
            showPauseMenu();
            cancelAnimationFrame(animationState.id);
        }
    }
});



export { gamePaused, gameRunning };