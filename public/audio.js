
const bgMusic = new Audio('music/background.mp3');

export function startMusic() {
    bgMusic.loop = true;
    bgMusic.play(); // start the loop
}