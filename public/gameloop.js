import { entities, player, tileMap2D } from "./bomber.js";
import { addScore, lives, score, playerHit } from "./gameState.js";
import { Player, Bomb, PowerUp, Explosion, Enemy, Objective } from "./classes.js";

let lastTime = performance.now();
let fpsCounter = 0;
let fps = 0;
let lastFpsUpdate = performance.now();
let startTime = performance.now();

let portSpawned = false; // track if we already spawned a port


// MAIN GAMELOOP
export function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // ✅ FPS calculation
    fpsCounter++;
    if (time - lastFpsUpdate >= 1000) { // every 1 second
        fps = fpsCounter;
        fpsCounter = 0;
        lastFpsUpdate = time;

        // Update lives and score
        document.getElementById("lives").textContent = `Lives: ${lives}`;
        document.getElementById("score").textContent = `Score: ${score}`;

        // update the DOM element
        document.getElementById("fps").textContent = `FPS: ${fps}`;

        // Update timer
        const elapsed = Math.floor((time - startTime) / 1000); // in seconds
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
            if (e.el.classList.contains("port") && collision(player.bounds, e.bounds)) {
                if (player.hasKey) {
                    alert("You escaped! Level complete!");
                    // proceed to next level
                } else {
                    // maybe show message: "Need the key first"
                }
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
    requestAnimationFrame(gameLoop);
}

function collision(a, b) {
    return a.x < b.x + (b.width - 3) &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width - 3 > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height - 3 &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height - 3 > b.y;    //a's bottom left corner passes b's top left corner
}



function playerEat(powerUp) {
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

