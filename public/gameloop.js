import { entities, player } from "./bomber.js";
import { addScore, lives, score, playerHit } from "./gameState.js";
import { Player, Bomb, PowerUp, Explosion, Enemy, Objective } from "./classes.js";
import { tileMap2D } from "./bomber.js";
import { gamePaused, animationState, showMainMenu } from "./menu.js";
import { PlayPowerUpSound, PlayLevelClearedSound, stopMusic } from "./audio.js";
import { loadYouWin } from "./videos.js";

let lastTime = performance.now();
let fpsCounter = 0;
let fps = 0;
let lastFpsUpdate = performance.now();
let startTime = performance.now();
let pausedAt = null;
let totalPausedTime = 0;

let portSpawned = false; // track if we already spawned a port
let levelCompleted = false; // track if level is completed


export function ResetPort() {
    levelCompleted = false;
    portSpawned = false
}

// MAIN GAMELOOP
export function gameLoop(time) {

    if (gamePaused) return; // Stop updating if paused

    const delta = time - lastTime;
    lastTime = time;

    // ✅ FPS calculation
    fpsCounter++;
    if (time - lastFpsUpdate >= 1000) { // every 1 second
        // update the fps element
        fps = fpsCounter;
        fpsCounter = 0;
        lastFpsUpdate = time;
        document.getElementById("fps").textContent = `FPS: ${fps}`;

        // Update lives and score
        document.getElementById("lives").textContent = `Lives: ${lives}`;
        document.getElementById("score").textContent = `Score: ${score}`;


        // Update timer
        const elapsed = Math.floor((time - startTime - totalPausedTime) / 1000); // in seconds
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById("timer").textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // 1️⃣ Move player and enemies
    entities.forEach(e => {
        if (e instanceof Player || e instanceof Enemy) {
            e.update(delta); // Both player and enemy handle movement + invulnerability
        }
    });

    // 2️⃣ Update bombs and handle collisions
    entities.forEach(e => {

        // Bombs countdown their fuse
        if (e instanceof Bomb || e instanceof Explosion) {
            e.update(delta);
        }

        // Explosion's collisions
        if (e instanceof Explosion) {
            entities.forEach(en => {
                if (en instanceof Enemy && collision(e.bounds, en.bounds)) {
                    if (!en.invulnerable) { // <-- skip if invulnerable
                        en.el.remove();
                        const index = entities.indexOf(en);
                        if (index > -1) entities.splice(index, 1);
                        addScore(100); // increase score
                    }
                }
                if (en instanceof Player && collision(e.bounds, en.bounds)) {
                    playerHit()
                }
            });
        }
        if (e instanceof Objective) {
            // if it’s the key
            if (e.el.classList.contains("key") && collision(player.bounds, e.bounds)) {
                e.el.remove();
                e.collected = true;
                // maybe open the port or mark that player has key
                player.hasKey = true;
                // 🔹 Spawn port somewhere random on floor
                spawnPortRandom();

            }

            // if it’s the port
            if (!levelCompleted && e.el.classList.contains("port") && collision(player.bounds, e.bounds)) {
                if (player.hasKey) {
                    levelCompleted = true;
                    stopMusic();
                    PlayLevelClearedSound();
                    loadYouWin();
                    // proceed to next level
                }
                showMainMenu();
            }
        }



        // Check collisions with player
        if (e instanceof Enemy && collision(e.bounds, player.bounds)) {
            playerHit()
        }


        if (e instanceof PowerUp && collision(player.bounds, e.bounds)) {
            playerEat(e);   // remove DOM element

        }
    });



    // 3️⃣ Remove collected powerups or exploded bombs
    entities.splice(0, entities.length, ...entities.filter(e => {
        if (e instanceof PowerUp && e.collected) return false;
        if (e instanceof Bomb && !document.body.contains(e.el)) return false; // exploded
        return true;
    }));

    // 4️⃣ Schedule next frame
    animationState.id = requestAnimationFrame(gameLoop);
}

function collision(a, b) {
    return a.x < b.x + (b.width - 3) &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width - 3 > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height - 3 &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height - 3 > b.y;    //a's bottom left corner passes b's top left corner
}



function playerEat(powerUp) {
    PlayPowerUpSound();
    addScore(10);
    player.bombRadius++;   // INCREASE radius
    powerUp.el.remove();
    powerUp.collected = true; // mark for later removal
}





function spawnPortRandom() {
    if (portSpawned) return; // already spawned → skip
    // Collect all floor positions
    const floorTiles = [];
    for (let y = 0; y < tileMap2D.length; y++) {
        for (let x = 0; x < tileMap2D[0].length; x++) {
            if (tileMap2D[y][x] === " ") {
                floorTiles.push({ x, y });
            }
        }
    }

    // Pick a random floor
    if (floorTiles.length > 0) {
        const randomTile = floorTiles[Math.floor(Math.random() * floorTiles.length)];
        const portObj = new Objective(randomTile.x, randomTile.y, "port");
        entities.push(portObj);
        portSpawned = true
    }
}

export function setPausedAt() {
    pausedAt = performance.now();
}

export function addPausedDuration() {
    if (pausedAt !== null) {
        totalPausedTime += performance.now() - pausedAt;
        pausedAt = null;
    }
}

export function resetTimer() {
    startTime = performance.now();
    totalPausedTime = 0;
    pausedAt = null;
}

export function resetFrameTimers() {
    lastTime = performance.now();
    lastFpsUpdate = lastTime;
    fpsCounter = 0;
    fps = 0;
}