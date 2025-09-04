//board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

let enemy1Image;
let enemy2Image;
let enemy3Image;
let blueGhostImage;
let bombermanUpImage;
let bombermanDownImage;
let bombermanLeftImage;
let bombermanRightImage;
let wallImage;
let brickImage;
let keyImage;
let portImage;
let cherry;
let banana;
let apple;


//X = wall, B = brick O = skip, P = pac man, ' ' = food
// Ghosts: b= blue, o = enemy1, p = enemy2, r = enemy3
// Foods:  C = cherry, A = apple , M = banana
// Objectives : K = key , p = port

const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "Xkb B    X       AX",
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


const powers = new Set();
const objectives = new Set();
const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let bomber;
let port;


const directions = ['U', 'D', 'L', 'R']; //up down left right
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    loadImages();
    loadMap();
    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
    update();
    document.addEventListener("keyup", movebomber);
}

function loadImages() {
    //layout
    wallImage = new Image();
    wallImage.src = "./rock.png";
    brickImage = new Image();
    brickImage.src = "./bricks.png";

    //objective
    keyImage = new Image();
    keyImage.src = "./key.png";
    portImage = new Image (); 
    portImage.src = "./port.png"

    //enemies
    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.png";
    enemy1Image = new Image();
    enemy1Image.src = "./enemy1.png";
    enemy2Image = new Image();
    enemy2Image.src = "./enemy2.png";
    enemy3Image = new Image();
    enemy3Image.src = "./enemy3.png";

    //bomber
    bombermanUpImage = new Image();
    bombermanUpImage.src = "./BombermanUp.png";
    bombermanDownImage = new Image();
    bombermanDownImage.src = "./BombermanDown.png"; // fixed filename
    bombermanLeftImage = new Image();
    bombermanLeftImage.src = "./BombermanLeft.png"; // fixed variable name
    bombermanRightImage = new Image();
    bombermanRightImage.src = "./BombermanRight.png";

    //power'up
    cherryImage = new Image();
    cherryImage.src = "./cherry.png";
    appleImage = new Image ();
    appleImage.src = "./apple.png"
    bananaImage = new Image();
    bananaImage.src = "./banana.png"
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') { //block wall
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            else if (tileMapChar == 'B') { //block wall
                const wall = new Block(brickImage, x, y, tileSize, tileSize);
                walls.add(wall);  
            }
            else if (tileMapChar == 'b') { //blue ghost
                const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'o') { //enemy1 ghost
                const ghost = new Block(enemy1Image, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'p') { //enemy2 ghost
                const ghost = new Block(enemy2Image, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'r') { //enemy3 ghost
                const ghost = new Block(enemy3Image, x, y, tileSize, tileSize);
                ghosts.add(ghost);
            }
            else if (tileMapChar == 'P') { //bomber
                bomber = new Block(bombermanRightImage, x, y, tileSize, tileSize);
            }
            else if (tileMapChar == 'k') { //key
                const obj = new Block(keyImage,x,y,tileSize,tileSize);
                objectives.add(obj);
            }
            else if (tileMapChar=='E'){
                port = new Block(portImage,x,y,tileSize,tileSize)
            }
            else if (tileMapChar == 'C') { //key
                const power = new Block(cherryImage,x,y,tileSize,tileSize);
                powers.add(power);
            }
            else if (tileMapChar == 'M') { //key
                const power = new Block(bananaImage,x,y,tileSize,tileSize);
                powers.add(power);
            }
                    else if (tileMapChar == 'A') { //key
                const power = new Block(appleImage,x,y,tileSize,tileSize);
                powers.add(power);
            }

            else if (tileMapChar == ' ') { //empty is food
                const food = new Block(keyImage, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
        }
    }
}

function update() {
    if (gameOver) {
        return;
    }
    move();
    draw();
    setTimeout(update, 50); //1000/50 = 20 FPS
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(bomber.image, bomber.x, bomber.y, bomber.width, bomber.height);

    context.globalAlpha = 0.4; // 50% opacity
    context.drawImage(port.image, port.x, port.y, port.width, port.height);
    context.globalAlpha = 1.0; // reset so other things are normal

    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }

    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    
    for (let obj of objectives.values()) {
        context.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
    }

    
    for (let power of powers.values()) {
        context.drawImage(power.image,power.x,power.y,power.width,power.height);
    }


    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    //score
    context.fillStyle = "white";
    context.font = "14px sans-serif";
    if (gameOver) {
        context.fillText("Game Over: " + String(score), tileSize / 2, tileSize / 2);
    }
    else {
        context.fillText("x" + String(lives) + " " + String(score), tileSize / 2, tileSize / 2);
    }
}

function move() {


    //check wall collisions
    for (let wall of walls.values()) {
        if (collision(bomber, wall)) {
            bomber.x -= bomber.velocityX;
            bomber.y -= bomber.velocityY;
            break;
        }
    }

    //check ghosts collision
    for (let ghost of ghosts.values()) {
        if (collision(ghost, bomber)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                return;
            }
            resetPositions();
        }

        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    //check food collision
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(bomber, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    if (foodEaten) foods.delete(foodEaten);

    //next level
    if (foods.size == 0) {
        loadMap();
        resetPositions();
    }
}

function movebomber(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        update(); //restart game loop
        return;
    }

    let newX = bomber.x;
    let newY = bomber.y;

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        newY -= tileSize;
        bomber.image = bombermanUpImage;
    }
    else if (e.code == "ArrowDown" || e.code == "KeyS") {
        newY += tileSize;
        bomber.image = bombermanDownImage;
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        newX -= tileSize;
        bomber.image = bombermanLeftImage;
    }
    else if (e.code == "ArrowRight" || e.code == "KeyD") {
        newX += tileSize;
        bomber.image = bombermanRightImage;
    }

    // check if the new position collides with a wall
    const tempBomber = new Block(null, newX, newY, bomber.width, bomber.height);
    let blocked = false;
    for (let wall of walls.values()) {
        if (collision(tempBomber, wall)) {
            blocked = true;
            break;
        }
    }

    if (!blocked) {
        bomber.x = newX;
        bomber.y = newY;
    }

    // check food at the new position
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(bomber, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    if (foodEaten) foods.delete(foodEaten);

    // check next level
    if (foods.size == 0) {
        loadMap();
        resetPositions();
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function resetPositions() {
    bomber.reset();
    bomber.velocityX = 0;
    bomber.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize / 4;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize / 4;
        }
        else if (this.direction == 'L') {
            this.velocityX = -tileSize / 4;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = tileSize / 4;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
};
