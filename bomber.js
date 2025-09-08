import { Player, Enemy, Tile ,PowerUp} from "./classes.js";

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


//lives
let lives = 3

const game = document.getElementById("game");
const ROWS = tileMap.length;
const COLS = tileMap[0].length;

game.style.setProperty("--cols", COLS);
game.style.setProperty("--rows", ROWS);

const entities = [];
let player = null;

// Build map
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const char = tileMap[y][x];

    // Tiles
    if (char === "X") new Tile(x, y, "wall");
    else if (char === "B") new Tile(x, y, "brick");
    else new Tile(x, y, "floor");

    // Entities
    switch (char) {
      case "P":
        player = new Player(x, y,tileMap);
        player.startX = x;
        player.startY = y;
        entities.push(player);
        break;
      case "b": entities.push(new Enemy(x, y, "blue", tileMap, COLS, ROWS)); break;
      case "o": entities.push(new Enemy(x, y, "orange", tileMap, COLS, ROWS)); break;
      case "p": entities.push(new Enemy(x, y, "pink", tileMap, COLS, ROWS)); break;
      case "r": entities.push(new Enemy(x, y, "red", tileMap, COLS, ROWS)); break;
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

function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;

  entities.forEach(e => {
    if (e instanceof Enemy || e instanceof Player) {
      e.move(delta);
    }
  });


  entities.forEach(e => {
  if (e instanceof Enemy) {
    if (collision(player.bounds, e.bounds)) {
      console.log("player hit by enemy");
      playerHit()
    }
  }
});
  entities.forEach((e, index) => {
    if (e instanceof PowerUp) {
      if (collision(player.bounds, e.bounds)) {
        console.log("player ate powerup");
        playerEat(e, index);
      }
    }
  });



  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);


function collision(a, b) {
    return a.x < b.x + b.width -1 &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width - 1 > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height - 1 &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height - 1 > b.y;    //a's bottom left corner passes b's top left corner
}

function playerHit() {
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
}
 
function playerEat(powerUp, index) {
  // Optional: increment score
  // scores++;

  // Remove the element from DOM
  powerUp.el.remove();

  // Remove it from the game entities
  entities.splice(index, 1);
}