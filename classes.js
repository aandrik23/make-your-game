export class Tile {
  constructor(x, y, cssClass) {
    const tile = document.createElement("div");
    tile.classList.add("tile", cssClass);
    tile.dataset.x = x;
    tile.dataset.y = y;
    document.getElementById("game").appendChild(tile);
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

    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp": this.nextDir = { dx: 0, dy: -1 }; break;
        case "ArrowDown": this.nextDir = { dx: 0, dy: 1 }; break;
        case "ArrowLeft": this.nextDir = { dx: -1, dy: 0 }; break;
        case "ArrowRight": this.nextDir = { dx: 1, dy: 0 }; break;
      }
    });
  }

  chooseDirection() {
    const newX = this.x + this.nextDir.dx;
    const newY = this.y + this.nextDir.dy;

    if (this.tileMap[newY][newX] !== "X" && this.tileMap[newY][newX] !== "B") {
      this.targetX = newX;
      this.targetY = newY;
      this.x = newX;
      this.y = newY;
    }
  }
}


export class Enemy extends Entity {
  constructor(x, y, color, tileMap, COLS, ROWS) {
    super(x, y, `ghost-${color}`);
    this.tileMap = tileMap;
    this.COLS = COLS;
    this.ROWS = ROWS;
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
      return tileChar !== "X" && tileChar !== "B";
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
  }



}
