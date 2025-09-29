const bgMusic = new Audio('sounds/background.mp3');

const explosionSound = new Audio('sounds/explosion.flac');

const playerHitSound = new Audio('sounds/player_hit.wav');

const powerUpSound = new Audio('sounds/powerUp.mp3');

const levelClearedSound = new Audio('sounds/level_completed.mp3');

const levelFailedSound = new Audio('sounds/level_failed.mp3');

export function startMusic() {
    bgMusic.loop = true;
    bgMusic.play(); // start the loop
}

export function stopMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0; // reset to start
}


export function ExplosionSound(durationMs) {
    explosionSound.currentTime = 0;    // start from beginning
    explosionSound.play();

    // Stop after the specified duration
    setTimeout(() => {
        explosionSound.pause();
        explosionSound.currentTime = 0;  // optional: reset to start
    }, durationMs);
}

export function PlayerHitSound() {
    playerHitSound.currentTime = 0;
    playerHitSound.play();
}


export function PlayPowerUpSound() {
    powerUpSound.volume = 0.5; // lower volume
    powerUpSound.currentTime = 0;
    powerUpSound.play();
}

export function PlayLevelClearedSound() {
    levelClearedSound.currentTime = 0;
    levelClearedSound.play();
}

export function PlayLevelFailedSound() {
    levelFailedSound.currentTime = 0;
    levelFailedSound.play();
}