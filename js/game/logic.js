function updateSnake() {
    if (snake.isDead || hasWon) return;

    let nextMove = search.getNextMove();
    
    if (nextMove) {
        // Движемся
        snake.move(nextMove.x, nextMove.y);
    } else {
        // Если вообще нет никаких ходов, змея умирает
        snake.isDead = true;
        return;
    }

    // Проверка на съедание яблока
    let head = snake.body[0];
    if (head.x === apple.x && head.y === apple.y) {
        snake.grow();
        apple.respawn();
        stepsWithoutProgress = 0;
    } else {
        stepsWithoutProgress++;
    }

    // Если топчется на месте без еды слишком долго
    if (stepsWithoutProgress >= MAX_STEPS_WITHOUT_PROGRESS) {
        snake.isDead = true;
    }
}