// Bomberman in plain JS + DOM (no canvas, no frameworks)
(() => {
  const COLS = 15;
  const ROWS = 11;
  const gameEl = document.getElementById('game');
  const livesEl = document.getElementById('lives');
  const keysEl = document.getElementById('keys');
  const resetBtn = document.getElementById('resetBtn');
  gameEl.style.setProperty('--cols', COLS);
  gameEl.style.setProperty('--rows', ROWS);

  // Map symbols
  // # = wall (indestructible), * = brick (destructible), . = floor, E = exit (locked), P = player spawn
  const RAW_MAP = [
    "###############",
    "#P.*.*.*.*.*..#",
    "#.#.#.#.#.#.#.#",
    "#.*.*.*.*.*.*.#",
    "#.#.#.#.#.#.#.#",
    "#.*.*.*.*.*.*.#",
    "#.#.#.#.#.#.#.#",
    "#.*.*.*.*.*.*.#",
    "#.#.#.#.#.#.#.#",
    "#...........E.#",
    "###############",
  ];

  /** Game state */
  const state = {
    grid: [], // 2D array of tiles
    player: { r: 1, c: 1, dir: 'down', lives: 3, keys: 0, alive: true },
    enemies: [], // {r,c,type,el,alive}
    bombs: [], // {r,c,placedAt,el}
  };

  /** Build DOM grid */
  const tpl = document.getElementById('tile-template');
  function buildGrid() {
    gameEl.innerHTML = '';
    state.grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const ch = RAW_MAP[r][c];
        const clone = tpl.content.firstElementChild.cloneNode(true);
        const type = ch === '#' ? 'wall' : ch === '*' ? 'brick' : ch === 'E' ? 'exit' : 'floor';
        clone.dataset.type = type;
        clone.dataset.r = r;
        clone.dataset.c = c;
        gameEl.appendChild(clone);
        row.push(clone);
      }
      state.grid.push(row);
    }
  }

  function placePlayer() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (RAW_MAP[r][c] === 'P') {
          state.player.r = r;
          state.player.c = c;
        }
      }
    }
    const el = document.createElement('div');
    el.className = 'entity player';
    el.dataset.dir = state.player.dir;
    tileAt(state.player.r, state.player.c).appendChild(el);
    state.player.el = el;
    updateHUD();
  }

  function spawnEnemies(count = 5) {
    const spots = [];
    for (let r = 1; r < ROWS-1; r++) {
      for (let c = 1; c < COLS-1; c++) {
        const t = tileAt(r,c).dataset.type;
        if (t === 'floor' && !(r===state.player.r && c===state.player.c)) spots.push([r,c]);
      }
    }
    shuffle(spots);
    for (let i = 0; i < Math.min(count, spots.length); i++) {
      const [r,c] = spots[i];
      const el = document.createElement('div');
      el.className = 'entity enemy';
      el.dataset.type = ['ghost','slime','skull'][i%3];
      tileAt(r,c).appendChild(el);
      state.enemies.push({ r,c, type: el.dataset.type, el, alive: true, lastMove: 0 });
    }
  }

  function tileAt(r,c) {
    if (r<0 || c<0 || r>=ROWS || c>=COLS) return null;
    return state.grid[r][c];
  }
  function passable(r,c){
    const t = tileAt(r,c);
    if (!t) return false;
    const type = t.dataset.type;
    return type === 'floor' || type === 'exit';
  }

  function moveEntity(ent, dr, dc) {
    const nr = ent.r + dr, nc = ent.c + dc;
    const from = tileAt(ent.r, ent.c);
    const to = tileAt(nr, nc);
    if (!to) return false;
    // can't pass walls or bricks
    const ttype = to.dataset.type;
    if (ttype === 'wall' || ttype === 'brick') return false;
    ent.r = nr; ent.c = nc;
    to.appendChild(ent.el);
    return true;
  }

  function setPlayerDir(dr,dc){
    const dir = dr<0?'up': dr>0?'down': dc<0?'left':'right';
    state.player.dir = dir;
    state.player.el.dataset.dir = dir;
  }

  function tryMovePlayer(dr,dc){
    if (!state.player.alive) return;
    setPlayerDir(dr,dc);
    moveEntity(state.player, dr, dc);
    checkPickupOrExit();
  }

  function checkPickupOrExit(){
    const t = tileAt(state.player.r, state.player.c);
    if (!t) return;
    // simple hidden key in random brick: if no key, chance to spawn when stepping on cleared brick tile
    if (t.dataset.type === 'exit') {
      if (state.player.keys > 0) {
        win();
      }
    }
  }

  function placeBomb(){
    if (!state.player.alive) return;
    // One bomb per tile to avoid stacking
    const existing = state.bombs.find(b => b.r===state.player.r && b.c===state.player.c);
    if (existing) return;
    const el = document.createElement('div');
    el.className = 'entity bomb';
    const t = tileAt(state.player.r, state.player.c);
    t.appendChild(el);
    const bomb = { r: state.player.r, c: state.player.c, placedAt: performance.now(), el };
    state.bombs.push(bomb);
    // explode after 1.2s
    setTimeout(() => explode(bomb), 1200);
  }

  function explode(bomb){
    // Remove bomb entity first
    bomb.el.remove();
    state.bombs = state.bombs.filter(b => b !== bomb);
    // AOE: center + 4 cardinal rays length 2 (stop at walls)
    const rays = [[0,0],[1,0],[2,0],[-1,0],[-2,0],[0,1],[0,2],[0,-1],[0,-2]];
    const blocked = new Set();
    for(const [dr,dc] of rays){
      const r = bomb.r + dr, c = bomb.c + dc;
      if (Math.abs(dr)+Math.abs(dc) > 0){
        // stop if preceding tile was a wall/blocked
        const key = JSON.stringify([Math.sign(dr), Math.sign(dc)]);
        if (blocked.has(key)) continue;
      }
      const tile = tileAt(r,c);
      if (!tile) continue;
      const type = tile.dataset.type;
      // visual
      const fx = document.createElement('div');
      fx.className = 'explosion';
      tile.appendChild(fx);
      setTimeout(() => fx.remove(), 350);

      if (type === 'wall'){
        // stop ray at walls
        if (dr!==0 || dc!==0) blocked.add(JSON.stringify([Math.sign(dr), Math.sign(dc)]));
        continue;
      }
      if (type === 'brick'){
        // destroy brick and maybe spawn item/key
        tile.dataset.type = 'floor';
        tile.classList.add('hit');
        setTimeout(()=> tile.classList.remove('hit'), 220);
        // 12% chance key, 18% random fruit
        const roll = Math.random();
        if (roll < 0.12){
          spawnItemAt(tile, 'key');
        } else if (roll < 0.30){
          const fruits = ['banana','apple','cherry'];
          spawnItemAt(tile, fruits[Math.floor(Math.random()*fruits.length)]);
        }
        // stop ray after breaking a brick
        if (dr!==0 || dc!==0) blocked.add(JSON.stringify([Math.sign(dr), Math.sign(dc)]));
      }
      // damage entities on this tile
      damageEntitiesAt(r,c);
    }
  }

  function spawnItemAt(tile, kind){
    // avoid stacking multiple items
    if (tile.querySelector('.item')) return;
    const el = document.createElement('div');
    el.className = 'entity item pop';
    el.dataset.kind = kind;
    tile.appendChild(el);
  }

  function damageEntitiesAt(r,c){
    // Player
    if (state.player.r===r && state.player.c===c && state.player.alive){
      loseLife();
    }
    // Enemies
    for (const e of state.enemies){
      if (!e.alive) continue;
      if (e.r===r && e.c===c){
        e.alive = false;
        e.el.classList.add('hit');
        setTimeout(()=> e.el.remove(), 120);
      }
    }
  }

  function loseLife(){
    state.player.lives -= 1;
    updateHUD();
    if (state.player.lives <= 0){
      state.player.alive = false;
      state.player.el.style.opacity = .4;
      toast("Game Over");
    } else {
      // brief invulnerability / flash
      state.player.el.classList.add('hit');
      setTimeout(()=> state.player.el.classList.remove('hit'), 300);
    }
  }

  function win(){
    toast("You escaped! 🎉");
    // soft reset enemies
    for (const e of state.enemies){ e.el.remove(); }
    state.enemies = [];
    spawnEnemies(5);
  }

  function updateHUD(){
    livesEl.textContent = String(state.player.lives);
    keysEl.textContent = String(state.player.keys);
  }

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position:'fixed', left:'50%', top:'10%', transform:'translateX(-50%)',
      padding:'10px 14px', background:'rgba(0,0,0,.7)', color:'#fff',
      borderRadius:'10px', boxShadow:'0 6px 20px rgba(0,0,0,.25)', zIndex: 9999
    });
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 1200);
  }

  function shuffle(a){
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
  }

  /** Enemy AI: random walker every ~300ms if not blocked */
  function driveEnemies(ts){
    for (const e of state.enemies){
      if (!e.alive) continue;
      if (ts - e.lastMove < 280) continue;
      e.lastMove = ts;
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      shuffle(dirs);
      for (const [dr,dc] of dirs){
        if (moveEntity(e,dr,dc)) break;
      }
      // collide with player
      if (e.r===state.player.r && e.c===state.player.c && state.player.alive){
        loseLife();
      }
    }
    requestAnimationFrame(driveEnemies);
  }

  /** Input */
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup','w'].includes(k)) { e.preventDefault(); tryMovePlayer(-1,0); }
    else if (['arrowdown','s'].includes(k)) { e.preventDefault(); tryMovePlayer(1,0); }
    else if (['arrowleft','a'].includes(k)) { e.preventDefault(); tryMovePlayer(0,-1); }
    else if (['arrowright','d'].includes(k)) { e.preventDefault(); tryMovePlayer(0,1); }
    else if (k === ' '){ e.preventDefault(); placeBomb(); }
  });

  // Clicking items to pick up (or auto-pick when moving)
  gameEl.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (item){
      const tile = item.parentElement;
      pickItem(tile, item);
    }
  });

  function pickItem(tile, item){
    const kind = item.dataset.kind;
    item.remove();
    if (kind === 'key'){
      state.player.keys += 1;
      updateHUD();
      toast('Picked up a key!');
    } else {
      toast('Yum!');
    }
  }

  // Auto-pickup on move
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations){
      if (m.type === 'childList'){
        // if player's tile contains an item, pick it
        const t = tileAt(state.player.r, state.player.c);
        const item = t.querySelector('.item');
        if (item) pickItem(t, item);
      }
    }
  });
  observer.observe(gameEl, { childList: true, subtree: true });

  /** Reset */
  function reset(){
    state.player = { r: 1, c: 1, dir: 'down', lives: 3, keys: 0, alive: true };
    state.enemies = [];
    state.bombs = [];
    buildGrid();
    placePlayer();
    spawnEnemies(5);
  }
  resetBtn.addEventListener('click', reset);

  // Boot
  buildGrid();
  placePlayer();
  spawnEnemies(5);
  requestAnimationFrame(driveEnemies);
})();
