export function loadGameOver() {

    const gameContainer = document.getElementById('game');
    const rect = gameContainer.getBoundingClientRect();

    const video = document.createElement('video');
    video.src = './video/GameOver.mp4';
    video.width = rect.width;   // match game container width
    video.height = rect.height; // match game container height
    video.controls = false;
    video.autoplay = true;
    video.muted = true; // helps autoplay
    video.style.position = 'absolute';
    video.style.top = `${rect.top}px`;
    video.style.left = `${rect.left}px`;
    video.style.zIndex = 1000; // make sure it’s on top
    video.style.objectFit = 'cover'; // cover the entire game area

    document.body.appendChild(video);

    // Remove video when finished
    video.addEventListener('ended', () => video.remove());
}


export function loadYouWin() {
    const gameContainer = document.getElementById('game');
    const rect = gameContainer.getBoundingClientRect();

    const video = document.createElement('video');
    video.src = './video/check.mp4';
    video.width = rect.width;   // match game container width
    video.height = rect.height; // match game container height
    video.controls = false;
    video.autoplay = true;
    video.muted = true; // helps autoplay
    video.style.position = 'absolute';
    video.style.top = `${rect.top}px`;
    video.style.left = `${rect.left}px`;
    video.style.zIndex = 1000; // make sure it’s on top
    video.style.objectFit = 'cover'; // cover the entire game area

    document.body.appendChild(video);

    // Remove video when finished
    video.addEventListener('ended', () => video.remove());
}