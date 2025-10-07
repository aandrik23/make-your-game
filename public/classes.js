import { ExplosionSound } from './audio.js';
import { entities, bricks, COLS, ROWS, updateTileMap2D } from './bomber.js';
import { addPausedDuration } from './gameLoop.js';
import { addScore } from './gameState.js';



export class Tile {
  constructor(x, y, cssClass) {
    // ✅ store the element in this.tile
    this.tile = document.createElement("div");
    this.tile.classList.add("tile", cssClass);
    this.tile.dataset.x = x;
    this.tile.dataset.y = y;
    document.getElementById("game").appendChild(this.tile);

    this.x = x;
    this.y = y;
    this.cssClass = cssClass;
  }
}


export class Entity {
  constructor(x, y, cssClass) {
    this.x = x;
    this.y = y;
    this.posX = x * 32;
    this.posY = y * 32;
    this.speed = 100;

    this.targetX = x;
    this.targetY = y;
    this.dirX = 0;
    this.dirY = 0;

    this.el = document.createElement("div");
    this.el.classList.add("tile", cssClass);
    this.el.style.position = "absolute";
    this.el.style.width = "32px";
    this.el.style.height = "32px";
    this.updatePosition();
    document.getElementById("game").appendChild(this.el);
  }

  get width() { return 32; }
  get height() { return 32; }

  get bounds() {
    return {
      x: this.posX,
      y: this.posY,
      width: this.width,
      height: this.height
    };
  }


  updatePosition() {
    this.el.style.left = `${this.posX}px`;
    this.el.style.top = `${this.posY}px`;
  }

  move(delta) {
    const step = this.speed * (delta / 1000);
    const dx = this.targetX * 32 - this.posX;
    const dy = this.targetY * 32 - this.posY;

    if (Math.abs(dx) < step && Math.abs(dy) < step) {
      this.posX = this.targetX * 32;
      this.posY = this.targetY * 32;
      this.chooseDirection();
    } else {
      const angle = Math.atan2(dy, dx);
      this.posX += Math.cos(angle) * step;
      this.posY += Math.sin(angle) * step;
    }

    this.updatePosition();
  }

  chooseDirection() {
    // overridden in subclasses
  }
}
export class Player extends Entity {
  constructor(x, y, tileMap) {
    super(x, y, "bomber");
    this.tileMap = tileMap;
    this.nextDir = { dx: 0, dy: 0 };
    this.dir = { dx: 0, dy: 0 }; // <--- add this

    this.bombs = [];
    this.bombRadius = 1;  // radius logic

    //start coordinates
    this.startX = x;
    this.startY = y;

    // Invulnerability setup
    this.invulnerable = false;
    this.invulTimer = 0;
    this.invulDuration = 2500; // 2.5 seconds

    this.flickerElapsed = 0;
    this.flickerInterval = 200; // blink every 200ms

    this.hasKey = false; // Port

  }


  // Inside Player class
  resetPosition(tileSize = 32) {
    this.x = this.startX;
    this.y = this.startY;
    this.targetX = this.startX;
    this.targetY = this.startY;
    this.posX = this.startX * tileSize;
    this.posY = this.startY * tileSize;
    this.updatePosition();
  }

  dropBomb() {

    this.bombs = this.bombs.filter(b => entities.includes(b)); // clean up exploded bombs

    // Limit active bombs
    if (this.bombs.length >= 5) {
      console.log("Max bombs reached, wait for one to explode.");
      return;
    }

    // Prevent stacking bombs on the same tile
    const existingBomb = entities.some(e => e instanceof Bomb && e.x === this.x && e.y === this.y);
    if (existingBomb) {
      console.log("There's already a bomb here!");
      return;
    }
    const bomb = new Bomb(this.x, this.y, this.bombRadius, this.tileMap);
    entities.push(bomb);
    this.bombs.push(bomb);
  }

  chooseDirection() {
    const newX = this.x + this.nextDir.dx;
    const newY = this.y + this.nextDir.dy;
    // Try to turn if possible
    const canTurn = this.tileMap[newY][newX] !== "X" &&
      this.tileMap[newY][newX] !== "B" &&
      !entities.some(e => e instanceof Bomb && e.x === newX && e.y === newY);

    if (canTurn && (this.nextDir.dx !== this.dir.dx || this.nextDir.dy !== this.dir.dy)) {
      // Turn to new direction
      this.dir = { ...this.nextDir };
    }

    // Try to move in current direction
    const forwardX = this.x + this.dir.dx;
    const forwardY = this.y + this.dir.dy;
    const canMoveForward = this.tileMap[forwardY][forwardX] !== "X" &&
      this.tileMap[forwardY][forwardX] !== "B" &&
      !entities.some(e => e instanceof Bomb && e.x === forwardX && e.y === forwardY);

    if (canMoveForward) {
      this.targetX = forwardX;
      this.targetY = forwardY;
      this.x = forwardX;
      this.y = forwardY;
    }
  }


  update(delta) {
    // Handle invulnerability blinking
    if (this.invulnerable) {
      this.invulTimer += delta;
      this.flickerElapsed += delta;

      if (this.flickerElapsed >= this.flickerInterval) {
        this.el.style.visibility = this.el.style.visibility === "hidden" ? "visible" : "hidden";
        this.flickerElapsed = 0;
      }

      if (this.invulTimer >= this.invulDuration) {
        this.invulnerable = false;
        this.invulTimer = 0;
        this.el.style.visibility = "visible";
      }
    }

    this.move(delta);
  }


  // Call this when player respawns
  activateInvulnerability() {
    this.invulnerable = true;
    this.invulTimer = 0;

  }
}


export class Enemy extends Entity {
  constructor(x, y, color, tileMap, COLS, ROWS) {
    super(x, y, `ghost-${color}`);
    this.tileMap = tileMap;
    this.COLS = COLS;
    this.ROWS = ROWS;

    // Invulnerability setup
    this.invulnerable = false;
    this.invulTimer = 0;
    this.invulDuration = 2500; // 2.5 seconds

    this.flickerElapsed = 0;
    this.flickerInterval = 200; // blink every 200ms
  }

  // Call this when enemy spawns

  activateInvulnerability() {
    this.invulnerable = true;
    this.invulTimer = 0;
    this.flickerElapsed = 0;
  }

  update(delta) {
    // Handle invulnerability blinking
    if (this.invulnerable) {
      this.invulTimer += delta;
      this.flickerElapsed += delta;

      if (this.flickerElapsed >= this.flickerInterval) {
        this.el.style.visibility = this.el.style.visibility === "hidden" ? "visible" : "hidden";
        this.flickerElapsed = 0;
      }

      if (this.invulTimer >= this.invulDuration) {
        this.invulnerable = false;
        this.invulTimer = 0;
        this.el.style.visibility = "visible";
      }
    }

    this.move(delta);
  }



  chooseDirection() {
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];


    const validDirs = dirs.filter(dir => {
      const newX = this.targetX + dir.dx;
      const newY = this.targetY + dir.dy;
      if (newX < 0 || newX >= this.COLS || newY < 0 || newY >= this.ROWS) return false;
      const tileChar = this.tileMap[newY][newX];

      // Add bomb check
      const bombBlocked = entities.some(e => e instanceof Bomb && e.x === newX && e.y === newY);

      return tileChar !== "X" && tileChar !== "B" && !bombBlocked;
    });


    if (validDirs.length === 0) return;

    const forwardDirs = validDirs.filter(
      dir => !(dir.dx === -this.dirX && dir.dy === -this.dirY)
    );

    const chosen =
      forwardDirs.length > 0
        ? forwardDirs[Math.floor(Math.random() * forwardDirs.length)]
        : validDirs[0];

    this.dirX = chosen.dx;
    this.dirY = chosen.dy;
    this.targetX += chosen.dx;
    this.targetY += chosen.dy;
  }
}


export class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x, y, type); // type is the CSS class: "speed", "bomb", "shield"...
    this.collected = false;
    this.radius = 1
  }

}


export class Bomb extends Entity {
  constructor(x, y, radius, tileMap) {
    super(x, y, "bomb")
    this.fuse = 3000
    this.time = 0
    this.radius = radius
    this.tileMap = tileMap
  }
  update(delta) {
    this.time += delta
    if (this.time >= this.fuse) {
      addPausedDuration();
      this.explode()
    }
  }

  explode() {
    console.log("💥 Bomb exploded!");
    this.el.remove();

    const explosion = new Explosion(this.x, this.y);
    entities.push(explosion);
    //spawn explosion tiles

    spawnExplosions(this.x, this.y, this.radius, this.tileMap);

    // remove bomb
    const index = entities.indexOf(this);
    if (index > -1) {
      entities.splice(index, 1);
    }
    if (window.player && window.player.bombs) {
      const bombIndex = window.player.bombs.indexOf(this);
      if (bombIndex > -1) {
        window.player.bombs.splice(bombIndex, 1);
      }
    }
  }
}

export class Explosion extends Entity {
  constructor(x, y) {
    super(x, y, "explosion")
    this.fuse = 1000
    this.time = 0

  }

  update(delta) {
    this.time += delta
    if (this.time >= this.fuse) {
      this.explode()
    }
  }
  explode() {
    console.log("💥 explosion ended!");
    this.el.remove();
    const index = entities.indexOf(this);
    if (index > -1) {
      entities.splice(index, 1);
    }
  }

}


export class Objective extends Entity {
  constructor(x, y, type) {
    super(x, y, type);
    this.collected = false; // only for key
    this.active = type === "port" ? false : true;
  }
}


function spawnExplosions(x, y, radius, tileMap2D) {
  entities.push(new Explosion(x, y));

  ExplosionSound(1000)

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  dirs.forEach(dir => {
    for (let i = 1; i <= radius; i++) {
      const nx = x + dir.dx * i;
      const ny = y + dir.dy * i;

      if (ny < 0 || ny >= tileMap2D.length || nx < 0 || nx >= tileMap2D[0].length) break;

      const tileChar = tileMap2D[ny][nx]; // read from 2D array now

      if (tileChar === "X") break;

      entities.push(new Explosion(nx, ny));

      if (tileChar === "B") {
        addScore(15);

        // ✅ update 2D array
        updateTileMap2D(nx, ny, " "); // change brick to floor

        const brickIndex = bricks.findIndex(b => b.x === nx && b.y === ny);
        if (brickIndex !== -1) {
          const brick = bricks[brickIndex];
          brick.tile.className = "tile floor";
          bricks.splice(brickIndex, 1);

          if (brick.hiddenItem) {
            if (brick.hiddenItem === "key") {
              entities.push(new Objective(nx, ny, "key"));
            } else if (brick.hiddenItem.type === "enemy") {
              const enemy = new Enemy(nx, ny, brick.hiddenItem.color, tileMap2D, COLS, ROWS);
              enemy.activateInvulnerability();
              entities.push(enemy);
            }
          }
        }

        break;
      }
    }
  });
}
