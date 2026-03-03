function updateUI() {
    document.getElementById('length').textContent = snake.body.length;
    
    const modeElement = document.getElementById('mode');
    if (hasWon) {
        modeElement.textContent = 'WIN!';
        modeElement.className = 'mode-win';
    } else if (snake.isDead) {
        modeElement.textContent = 'Dead';
        modeElement.className = 'mode-dead';
    } else if (snake.survivalMode) {
        modeElement.textContent = 'Survival Mode';
        modeElement.className = 'mode-survival';
    } else {
        modeElement.textContent = 'Hunting Mode';
        modeElement.className = 'mode-hunting';
    }
    
    document.getElementById('algorithm').textContent = (snake.isDead || hasWon) ? "None" : search.lastUsedMethod;
    
    const pathStatus = (snake.isDead || hasWon) ? "No path" : (snake.path.length > 0 ? `Path steps: ${snake.path.length}` : "No path");
    document.getElementById('path-status').textContent = pathStatus;
    
    const freeCells = COLS * ROWS - snake.body.length;
    document.getElementById('free-cells').textContent = `${freeCells} / ${COLS * ROWS}`;
    
    document.getElementById('progress-steps').textContent = stepsWithoutProgress;
    
    const progressWarning = document.getElementById('progress-warning');
    if (stepsWithoutProgress >= MAX_STEPS_WITHOUT_PROGRESS) {
        progressWarning.textContent = 'Game is lost due to a slow progress';
    } else if (stepsWithoutProgress > MAX_STEPS_WITHOUT_PROGRESS * 0.8) {
        progressWarning.textContent = 'WARNING: Slow progress!';
    } else if (stepsWithoutProgress > MAX_STEPS_WITHOUT_PROGRESS * 0.5) {
        progressWarning.textContent = 'Progress is slowing down...';
    } else {
        progressWarning.textContent = '';
    }
}