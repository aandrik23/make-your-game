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


//MAIN MENU
const startBtn = document.getElementById("startBtn");
const infoBtn = document.getElementById("infoBtn");
const settingsBtn = document.getElementById("settingsBtn");
const quitBtn = document.getElementById("quitBtn");

//PAUSE MENU
const continueBtn = document.getElementById("continueBtn");
const restartBtn = document.getElementById("restartBtn");
const mainMenuBtn = document.getElementById("mainMenuBtn")
const settingsPauseBtn = document.getElementById("settingsPauseBtn");;
const infoPauseBtn = document.getElementById("infoPauseBtn");

//SETTINGS  
const settingsMenu = document.getElementById("settingsMenu");
const backBtn = document.getElementById("backBtn");

//INFO
const infoMenu = document.getElementById("infoMenu");
const backInfoBtn = document.getElementById("backInfoBtn");

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
    infoMenu.style.display = "flex";
    backInfoBtn.focus();
};

infoPauseBtn.onclick = () => {
    infoMenu.style.display = "flex";
    backInfoBtn.focus();  // focus back button for accessibility.   ***
};

backInfoBtn.onclick = () => {
    infoMenu.style.display = "none";   // hide info menu    // show main menu again
};


settingsBtn.onclick = () => {
    settingsMenu.style.display = "flex";
    backBtn.focus();  // focus back button for accessibility.   ***
};
settingsPauseBtn.onclick = () => {
    settingsMenu.style.display = "flex";
    backBtn.focus();  // focus back button for accessibility.   ***
};

backBtn.onclick = () => {
    settingsMenu.style.display = "none";   // hide settings menu    // show main menu again
};

quitBtn.onclick = () => {
    window.close();
};

// Pause menu buttons
continueBtn.onclick = () => {
    startMusic();
    resetFrameTimers();
    hideMenu();
};
restartBtn.onclick = () => {
    startMusic();
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


// pause logic:
window.addEventListener("keydown", (e) => {

    if (e.code === "Space") e.preventDefault();

    if (e.repeat) return; // ignore if key is held down.   ***
    if (settingsMenu.style.display === "flex") {
        settingsMenu.style.display = "none";
        return;
    }


    if (e.code === "Space" && gameRunning) {
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