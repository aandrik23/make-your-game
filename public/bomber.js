import { Player,Explosion , Enemy, Bomb,Tile ,PowerUp, Objective} from "./classes.js";


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



//lives
let lives = 3
export let score = 0

const game = document.getElementById("game");
export const ROWS = tileMap.length;
export const COLS = tileMap[0].length;

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

// After building map & bricks:

const KeyBrick = bricks[Math.floor(Math.random() * bricks.length)];
KeyBrick.hiddenItem = "key";  // could also do "port" if you want



let lastTime = performance.now();
let fpsCounter = 0;
let fps = 0;
let lastFpsUpdate = performance.now();
let startTime = performance.now();
let gameEnded = false;
window.gameEnded = false;




// MAIN GAMELOOP
function gameLoop(time) {
  if (gameEnded) {
    return;
  }

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
  document.getElementById("timer").textContent = `Time: ${minutes}:${seconds.toString().padStart(2,'0')}`;
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
          score += 100;
        }
      }
      if (en instanceof Player && collision(e.bounds,en.bounds)) {
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
      if (!gameEnded) {
        gameEnded = true;
        endGame(true); // Player won
      }
    } else {
      // maybe show message: "Need the key first"
    }
  }
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
      if (!gameEnded) {
        gameEnded = true;
        endGame(false); // Player lost
      }
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
  addScore(10);
  player.bombRadius++;   // INCREASE radius
  powerUp.el.remove();
  powerUp.collected = true; // mark for later removal
}


let portSpawned = false; // track if we already spawned a port


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
    portSpawned=true
  }
}

export function addScore(points) {
  score += points;
}

// Game end functionality
function endGame(won) {
  // Stop the game loop by setting gameEnded flag
  gameEnded = true;
  window.gameEnded = true;
  
  // Calculate final time
  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Show player name input and scoreboard
  showPlayerNameInput(won, score, timeString);
}


function showPlayerNameInput(won, finalScore, timeString) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'gameEndOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement('h2');
  title.textContent = won ? 'Congratulations! You Won!' : 'Game Over';
  title.style.color = won ? '#4CAF50' : '#f44336';
  title.style.marginBottom = '20px';

  const scoreInfo = document.createElement('p');
  scoreInfo.innerHTML = `
    <strong>Final Score:</strong> ${finalScore}<br>
    <strong>Time:</strong> ${timeString}
  `;
  scoreInfo.style.marginBottom = '20px';
  scoreInfo.style.fontSize = '18px';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Enter your name for the scoreboard:';
  nameLabel.style.display = 'block';
  nameLabel.style.marginBottom = '10px';
  nameLabel.style.fontSize = '16px';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Your name';
  nameInput.maxLength = 20;
  nameInput.style.cssText = `
    width: 100%;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
    margin-bottom: 20px;
    box-sizing: border-box;
  `;

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Submit Score';
  submitButton.style.cssText = `
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    margin-right: 10px;
  `;

  const skipButton = document.createElement('button');
  skipButton.textContent = 'Skip';
  skipButton.style.cssText = `
    background: #757575;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
  `;

  // Event handlers
  submitButton.addEventListener('click', () => {
    const playerName = nameInput.value.trim();
    if (playerName) {
      submitScore(playerName, finalScore, timeString, overlay);
    } else {
      alert('Please enter your name!');
    }
  });

  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitButton.click();
    }
  });

  skipButton.addEventListener('click', () => {
    showScoreboard(null, overlay);
  });

  // Assemble modal
  modal.appendChild(title);
  modal.appendChild(scoreInfo);
  modal.appendChild(nameLabel);
  modal.appendChild(nameInput);
  modal.appendChild(submitButton);
  modal.appendChild(skipButton);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus on input
  nameInput.focus();
}

async function submitScore(name, score, time, overlay) {
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        score: score,
        time: time
      })
    });

    if (response.ok) {
      const result = await response.json();
      showScoreboard(result, overlay);
    } else {
      throw new Error('Failed to submit score');
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    alert('Failed to submit score. Showing scoreboard anyway.');
    showScoreboard(null, overlay);
  }
}

async function showScoreboard(submissionResult, overlay) {
  try {
    // Remove the name input form
    overlay.innerHTML = '';

    // Create scoreboard content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      max-width: 700px;
      width: 95%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Scoreboard';
    title.style.color = '#4CAF50';
    title.style.marginBottom = '20px';

    modal.appendChild(title);

    // Show submission message if available
    if (submissionResult && submissionResult.message) {
      const message = document.createElement('p');
      message.textContent = submissionResult.message;
      message.style.cssText = `
        background: #e8f5e8;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
        font-weight: bold;
        color: #2e7d32;
      `;
      modal.appendChild(message);
    }

    // Fetch latest scores
    const response = await fetch('/api/scores');
    const data = await response.json();

    if (data.scores && data.scores.length > 0) {
      // Create table
      const table = document.createElement('table');
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      `;

      // Table header
      const header = document.createElement('thead');
      header.innerHTML = `
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Rank</th>
          <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Name</th>
          <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Score</th>
          <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Time</th>
        </tr>
      `;
      table.appendChild(header);

      // Table body
      const tbody = document.createElement('tbody');
      data.scores.forEach(score => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding: 10px; border: 1px solid #ddd;">${getRankSuffix(score.rank)}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${score.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${score.score}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${score.time}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      modal.appendChild(table);
      
    } else {
      const noScores = document.createElement('p');
      noScores.textContent = 'No scores yet. Be the first to play!';
      noScores.style.marginBottom = '20px';
      modal.appendChild(noScores);
    }

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';

    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.style.cssText = `
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      margin-right: 10px;
    `;
    playAgainButton.addEventListener('click', () => {
      window.location.reload();
    });

    buttonContainer.appendChild(playAgainButton);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

  } catch (error) {
    console.error('Error loading scoreboard:', error);
    overlay.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h2>Error Loading Scoreboard</h2>
        <p>Unable to load scores at this time.</p>
        <button onclick="window.location.reload()" style="background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer;">Play Again</button>
      </div>
    `;
  }
}

function getRankSuffix(rank) {
  switch (rank % 10) {
    case 1:
      if (rank % 100 !== 11) return `${rank}st`;
      break;
    case 2:
      if (rank % 100 !== 12) return `${rank}nd`;
      break;
    case 3:
      if (rank % 100 !== 13) return `${rank}rd`;
      break;
  }
  return `${rank}th`;
}