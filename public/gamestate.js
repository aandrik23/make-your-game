import { PlayerHitSound, PlayLevelFailedSound, stopMusic } from './audio.js';
import { player } from './bomber.js';
import { loadGameOver } from './videos.js';



export let score = 0;
export let lives = 3

export function addScore(points) {
    score += points;
}

export function resetStats() {
    score = 0;
    lives = 3;
}

export function playerHit() {

    PlayerHitSound();
    if (!player.invulnerable) {
        lives--;
        if (lives <= 0) {
            stopMusic();
            PlayLevelFailedSound();
            loadGameOver();
            // // we should fix this to show a proper game over screen
            // alert("Game Over!");
            // window.location.reload();
            // return;
        }

        // Reset player position
        player.resetPosition();

        // Activate temporary invulnerability
        player.activateInvulnerability();
    }
}
