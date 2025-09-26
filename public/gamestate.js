
import { player } from './bomber.js';



export let score = 0;
export let lives = 3

export function addScore(points) {
    score += points;
}


export function playerHit() {
    if (!player.invulnerable) {
        lives--;
        if (lives <= 0) {
            alert("Game Over!");
            window.location.reload();
            return;
        }

        // Reset player position
        player.resetPosition();

        // Activate temporary invulnerability
        player.activateInvulnerability();
    }
}
