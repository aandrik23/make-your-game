const bgMusic = new Audio('sounds/background.mp3');

const explosionSound = new Audio('sounds/explosion.flac');

const playerHitSound = new Audio('sounds/player_hit.wav');

const powerUpSound = new Audio('sounds/powerUp.mp3');

const levelClearedSound = new Audio('sounds/level_completed.mp3');

const levelFailedSound = new Audio('sounds/level_failed.mp3');



let isMuted = false;
let globalVolume = 0.5; // defaulft from slider in settings (50%)


function applyVolume() {
    const volume = isMuted ? 0 : globalVolume;
    bgMusic.volume = volume;
    explosionSound.volume = volume;
    playerHitSound.volume = volume;
    powerUpSound.volume = volume;
    levelClearedSound.volume = volume;
    levelFailedSound.volume = volume;
}



export function startMusic() {
    bgMusic.loop = true;
    applyVolume();
    bgMusic.play(); // start the loop
}

export function stopMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0; // reset to start
}


export function ExplosionSound(durationMs) {
    applyVolume();
    explosionSound.currentTime = 0;    // start from beginning
    explosionSound.play();

    // Stop after the specified duration
    setTimeout(() => {
        explosionSound.pause();
        explosionSound.currentTime = 0;  // optional: reset to start
    }, durationMs);
}

export function PlayerHitSound() {
    applyVolume();
    playerHitSound.currentTime = 0;
    playerHitSound.play();
}


export function PlayPowerUpSound() {
    applyVolume();
    powerUpSound.currentTime = 0;
    powerUpSound.play();
}

export function PlayLevelClearedSound() {
    applyVolume();
    levelClearedSound.currentTime = 0;
    levelClearedSound.play();
}

export function PlayLevelFailedSound() {
    applyVolume();
    levelFailedSound.currentTime = 0;
    levelFailedSound.play();
}

// settings UI connections
export function initAudioControls() {
    const muteBtn = document.getElementById("muteBtn");
    const muteIcon = document.getElementById("muteIcon");
    const volumeSlider = document.getElementById("volumeSlider");
    muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        applyVolume();
        muteBtn.classList.toggle("muted", isMuted);
        muteIcon.src = isMuted ? "./images/enable-sound.png" : "./images/sound.png";
    });
    volumeSlider.addEventListener("input", (e) => {
        globalVolume = e.target.value / 100;
        // if (isMuted && globalVolume > 0) {
        // isMuted = false;
        // document.getElementById("muteBtn").classList.remove("muted");
        // document.getElementById("muteIcon").src = "enable-sound.png";
        // }.   if it's muted and user changes volume, unmute.   ***
        applyVolume();
    });
}