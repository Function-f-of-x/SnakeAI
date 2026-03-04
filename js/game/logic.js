function updateSnake() {
    // 🐛 DEBUG: Проверка заморозки - не обновлять логику во время паузы
    if (DEBUG_PAUSE_GAME && debugFreezeUntil > millis()) {
        return; // ⛔ ВЫХОД - логика не выполняется
    }
    
    // Проверка выхода из Survival Mode каждый кадр
    if (snake.survivalMode) {
        search.getPath();
        if (snake.path.length > 0) {
            snake.survivalMode = false;
        }
    }
    
    // Трекинг прогресса
    if (snake.body.length > lastSnakeLength) {
        stepsWithoutProgress = 0;
        lastSnakeLength = snake.body.length;
    } else {
        stepsWithoutProgress++;
    }
    
    if (stepsWithoutProgress >= MAX_STEPS_WITHOUT_PROGRESS) {
        snake.isDead = true;
        return;
    }

    let nextPos = null;

    if (snake.path.length > 0) {
        let next = snake.path.shift();
        nextPos = { x: next.x, y: next.y };
    } else {
        snake.survivalMode = true;
        
        const directions = [
            { dx: snake.x_dir, dy: snake.y_dir },
            { dx: -snake.y_dir, dy: snake.x_dir },
            { dx: snake.y_dir, dy: -snake.x_dir },
            { dx: -snake.x_dir, dy: -snake.y_dir }
        ];

        let bestDir = null;
        let maxReachable = -1;

        for (let dir of directions) {
            if (Math.abs(snake.x_dir - dir.dx) === 2 || Math.abs(snake.y_dir - dir.dy) === 2) {
                continue;
            }
            
            let head = snake.getHead();
            let cand = { x: head.x + dir.dx, y: head.y + dir.dy };
            
            if (cand.x < 0 || cand.x >= COLS || cand.y < 0 || cand.y >= ROWS) {
                continue;
            }
            
            if (snake.body.some(s => s.x === cand.x && s.y === cand.y)) {
                continue;
            }

            let future = [...snake.body, createVector(cand.x, cand.y)];
            future.shift();
            let empty = COLS * ROWS - future.length;
            
            if (empty > 0) {
                let reachable = search.reachableCells(cand, future);
                if (reachable > maxReachable) {
                    maxReachable = reachable;
                    bestDir = dir;
                }
            }
        }

        if (bestDir) {
            let head = snake.getHead();
            nextPos = { x: head.x + bestDir.dx, y: head.y + bestDir.dy };
        }
    }

    if (!nextPos) {
        return;
    }

    if (snake.checkCollision()) {
        snake.isDead = true;
        return;
    }

    let ateApple = (nextPos.x === apple.x && nextPos.y === apple.y);
    snake.body.push(createVector(nextPos.x, nextPos.y));
    if (!ateApple) {
        snake.body.shift();
    }

    if (snake.checkCollision()) {
        snake.isDead = true;
        return;
    }

    if (snake.body.length >= 2) {
        let head = snake.getHead();
        let prev = snake.body[snake.body.length - 2];
        snake.x_dir = head.x - prev.x;
        snake.y_dir = head.y - prev.y;
    }

    if (ateApple) {
        if (!apple.generate(snake.body)) {
            return;
        }
        snake.survivalMode = false;
        search.getPath();
    } else if (snake.survivalMode) {
        let tempPath = search.AStar(search.refreshMaze(), snake.getHead(), apple);
        if (tempPath.length > 0) {
            snake.survivalMode = false;
            snake.path = tempPath;
        }
    }
}