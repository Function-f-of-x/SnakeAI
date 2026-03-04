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
    if (DEBUG_PAUSE_GAME && debugFreezeUntil > millis()) {
        background('#151515');
        apple.show(cellSize);
        snake.show(cellSize);
        drawDebugPath();      
        drawDebugOverlay();
        return;
    }
    
    if (DEBUG_PAUSE_GAME && debugFreezeUntil <= millis() && debugFreezeUntil > 0) {
        console.log(' Game resumed');
        debugFreezeUntil = 0;
    }
    
    background('#151515');
    apple.show(cellSize);
    snake.show(cellSize);
    
    if (DEBUG_MODE) {
        drawDebugPath();
    }
    
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

function drawDebugPath() {
    if (snake.path && snake.path.length > 0) {
        stroke('#00ffff');
        strokeWeight(2);
        noFill();
        beginShape();
        for (let p of snake.path) {
            vertex(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2);
        }
        const head = snake.getHead();
        vertex(head.x * cellSize + cellSize/2, head.y * cellSize + cellSize/2);
        endShape();
    }
    
    if (DEBUG_SHOW_FINAL_STATE && !debugIsSearching && debugClosedSet.size > 0) {

        for (let key of debugClosedSet) {
            const [x, y] = key.split(',').map(Number);
            if (!isNaN(x) && !isNaN(y)) {
                fill('#ff000040');
                noStroke();
                rect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        
        for (let node of debugOpenList) {
            fill('#0000ff40');
            noStroke();
            rect(node.x * cellSize, node.y * cellSize, cellSize, cellSize);
        }
    }
}

function drawDebugOverlay() {

    fill('#ffffff');
    noStroke();
    textAlign(CENTER, TOP);
    textSize(16);
    text('PAUSED FOR DEBUG', width/2, 10);
    
    if (debugSearchResult) {
        textSize(12);
        text(`Algorithm: ${debugSearchResult.algorithm}`, width/2, 35);
        text(`Path Length: ${debugSearchResult.pathLength}`, width/2, 50);
        text(`Open List: ${debugSearchResult.openListSize}`, width/2, 65);
        text(`Closed Set: ${debugSearchResult.closedSetSize}`, width/2, 80);
    }
    

    const remaining = Math.max(0, Math.ceil((debugFreezeUntil - millis()) / 1000));
    textSize(14);
    text(`Resuming in: ${remaining}s`, width/2, 110);
}

function windowResized() {
    calculateCellSize();
    resizeCanvas(COLS * cellSize, ROWS * cellSize);
}