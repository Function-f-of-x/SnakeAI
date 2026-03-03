function setup() {
    calculateCellSize();
    const canvasWidth = COLS * cellSize;
    const canvasHeight = ROWS * cellSize;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('game-container');
    snake = new Snake();
    apple = new Apple();
    search = new Search(snake, apple);
    
    frameRate(15);
    
    const speedSlider = document.getElementById('speed-slider');
    const fpsValue = document.getElementById('fps-value');
    
    speedSlider.addEventListener('input', function() {
        const fps = FPS_VALUES[this.value];
        frameRate(fps);
        fpsValue.textContent = fps;
    });
    
    const gameSpeedSlider = document.getElementById('game-speed-slider');
    const gameSpeedValue = document.getElementById('game-speed-value');
    
    gameSpeedSlider.addEventListener('input', function() {
        gameSpeed = parseInt(this.value);
        gameSpeedValue.textContent = gameSpeed;
    });
    
    fpsValue.textContent = FPS_VALUES[speedSlider.value];
    gameSpeedValue.textContent = gameSpeedSlider.value;
}

function calculateCellSize() {
    const maxWidth = windowWidth * 0.85;
    const maxHeight = windowHeight * 0.60;
    const scaleX = maxWidth / COLS;
    const scaleY = maxHeight / ROWS;
    cellSize = Math.floor(Math.min(scaleX, scaleY));
    if (cellSize < 1) cellSize = 1;
}

function draw() {
    background('#151515');
    apple.show(cellSize);
    snake.show(cellSize);
    
    const freeCells = COLS * ROWS - snake.body.length;
    if (freeCells === 0 && !hasWon) {
        hasWon = true;
        document.getElementById('win-message').style.display = 'block';
    }
    
    if (!snake.isDead && !hasWon) {
        for (let i = 0; i < gameSpeed; i++) {
            if (snake.isDead || hasWon) break;
            updateSnake();
        }
    }
    
    updateUI();
}

function windowResized() {
    calculateCellSize();
    resizeCanvas(COLS * cellSize, ROWS * cellSize);
}