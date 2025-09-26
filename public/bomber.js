import { Player, Explosion, Enemy, Bomb, Tile, PowerUp, Objective } from "./classes.js";

import { gameLoop } from "./gameLoop.js";

// objectives : Key , Port
// enemies : b,p,o
// player : P
// PowerUps : C, A, M

const tileMap = [
  "XXXXXXXXXXXXXXXXXXX", // top wall
  "XP    B  r  B  AEXX", // player top-left, exit top-right, some bricks
  "X X X X X X X X X X", // alternating indestructible walls
  "X B   B   B   B   X", // destructible bricks
  "X X X X X X X X X X",
  "X   B   B b B X B X",
  "X X X X X X X X X X",
  "X B   B   B   B   X",
  "X X X X X X X X X X",
  "X   B   B p B   B X",
  "X X X X X X X X X X",
  "X B   B   B   B   X",
  "X X X X X X X X X X",
  "X   B X B   B   B X",
  "X X X X X X X X X X",
  "X B   B o B   B   X",
  "X X X X X X X X X X",
  "X   B   B C B   B X",
  "X X X X X X X X X X",
  "XXM       X       X", // some power-ups
  "XXXXXXXXXXXXXXXXXXX"  // bottom wall
];

export let tileMap2D = tileMap.map(row => row.split(''));


const game = document.getElementById("game");
export const ROWS = tileMap.length;
export const COLS = tileMap[0].length;

game.style.setProperty("--cols", COLS);
game.style.setProperty("--rows", ROWS);

export let entities = [];


export let player = null;
export let bricks = [];

// Build map
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const char = tileMap[y][x];

    // Tiles
    if (char === "X") new Tile(x, y, "wall");
    else if (char === "B") {
      const brickTile = new Tile(x, y, "brick");

      if (Math.random() < 0.1) {
        // choose random enemy type
        const enemyTypes = ["blue", "orange", "pink", "red"];
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        brickTile.hiddenItem = { type: "enemy", color: type };
      }
      bricks.push(brickTile); // store reference in an array
    }
    else new Tile(x, y, "floor");

    // Entities
    switch (char) {

      case "P":
        player = new Player(x, y, tileMap2D); // <--- assign to player
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

// After building map & bricks:

const KeyBrick = bricks[Math.floor(Math.random() * bricks.length)];
KeyBrick.hiddenItem = "key";  // could also do "port" if you want

requestAnimationFrame(gameLoop);





