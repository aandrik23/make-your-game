import { Player,Explosion , Enemy, Bomb,Tile ,PowerUp} from "./classes.js";

const tileMap = [
  "XXXXXXXXXXXXXXXXXXX",
  "XKb B    X       AX",
  "X XX XXX X XXX XX X",
  "XM  B             X",
  "X XX X XXXXX X XX X",
  "X    X       X    X",
  "XXXXBXXXX XXXX XXXX",
  "BBBX X       X XBBB",
  "XXXX X XXrXX X XXXX",
  "X       bpo       X",
  "XXXX X XXXXX X XXXX",
  "BBBX X       X XBBB",
  "XXXX X XXXXX X XXXX",
  "X        X        X",
  "X XX XXX X XXX XX X",
  "X  X     P     X  X",
  "XX X X XXXXX X X XX",
  "X    X   X   X    X",
  "X XXXXXX X XXXXXX X",
  "XC               EX",
  "XXXXXXXXXXXXXXXXXXX"
];

export let tileMap2D = tileMap.map(row => row.split(''));



//lives
let lives = 3
export let score = 0

const game = document.getElementById("game");
const ROWS = tileMap.length;
const COLS = tileMap[0].length;

game.style.setProperty("--cols", COLS);
game.style.setProperty("--rows", ROWS);

export let entities = [];


let player = null;
export let bricks = [];

// Build map
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const char = tileMap[y][x];

    // Tiles
    if (char === "X") new Tile(x, y, "wall");
    else if (char === "B") {
      const brickTile = new Tile(x, y, "brick");
      bricks.push(brickTile); // store reference in an array
    }
    else new Tile(x, y, "floor");

    // Entities
    switch (char) {
      case "P":
        player = new Player(x, y,tileMap2D);
        player.startX = x;
        player.startY = y;
        entities.push(player);
        break;
      case "b": entities.push(new Enemy(x, y, "blue", tileMap2D, COLS, ROWS)); break;
      case "o": entities.push(new Enemy(x, y, "orange", tileMap2D, COLS, ROWS)); break;
      case "p": entities.push(new Enemy(x, y, "pink", tileMap2D, COLS, ROWS)); break;
      case "r": entities.push(new Enemy(x, y, "red", tileMap2D, COLS, ROWS)); break;
      case "C": case "A": case "M":
      const powerUp = new PowerUp(
        x, y,
        char === "C" ? "cherry" : char === "A" ? "apple" : "banana"
      );
      entities.push(powerUp);
      break;
    }
  }
}

let lastTime = performance.now();


// MAIN GAMELOOP
function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;

  // 1️⃣ Move player and enemies
  entities.forEach(e => {
  if (e instanceof Player || e instanceof Enemy) {
    if (e instanceof Player) e.update(delta); // handles invulnerability timer
    else e.move(delta);
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
        // Remove enemy
        en.el.remove();
        const index = entities.indexOf(en);
        if (index > -1) entities.splice(index, 1);
        
        // Increase score
        score += 100;
      }
      if (en instanceof Player && collision(e.bounds,en.bounds)) {
        playerHit()
      }
    });
  }


    // Check collisions with player
    if (e instanceof Enemy && collision(player.bounds, e.bounds)) {
      playerHit();
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



requestAnimationFrame(gameLoop);


export function collision(a, b) {
    return a.x < b.x + (b.width-3) &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width-3 > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height-3 &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height-3 > b.y;    //a's bottom left corner passes b's top left corner
}

function playerHit() {
  if (!player.invulnerable) {
    lives--;
    if (lives <= 0) {
      alert("Game Over!");
      window.location.reload();
      return;
    }

    // Reset player position
    player.x = player.startX;
    player.y = player.startY;
    player.targetX = player.startX;
    player.targetY = player.startY;
    player.posX = player.startX * 32;
    player.posY = player.startY * 32;
    player.updatePosition();

    // Activate temporary invulnerability
    player.activateInvulnerability();
  }
}




function playerEat(powerUp) {
  score += 10;
  player.bombRadius++;   // INCREASE radius
  powerUp.el.remove();
  powerUp.collected = true; // mark for later removal
}
