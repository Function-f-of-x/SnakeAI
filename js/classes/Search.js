class Search {
    constructor(snake, apple) {
        this.snake = snake;
        this.apple = apple;
        this.lastUsedMethod = "None";
        this.dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        this.memo = new Map();
    }

    getNextMove() {
        this.memo.clear();
        if (!this.snake.body || this.snake.body.length === 0) return null;

        const head = this.snake.body[0];
        const tail = this.snake.body[this.snake.body.length - 1];
        const totalCells = COLS * ROWS;
        const isSnakeLong = this.snake.body.length >= totalCells / 8;

        // 1. Пытаемся найти БЕЗОПАСНЫЙ путь к яблоку
        let pathToApple = this.findPath(head, this.apple, isSnakeLong, true);

        if (pathToApple && pathToApple.length > 0) {
            this.snake.survivalMode = false;
            this.lastUsedMethod = isSnakeLong ? "A* (Safe Long)" : "A* (Safe Shortest)";
            this.snake.path = pathToApple;
            return pathToApple[0];
        }

        // 2. Если безопасного нет, пробуем любой путь к яблоку (рискуем)
        let riskyPath = this.findPath(head, this.apple, false, false);
        if (riskyPath && riskyPath.length > 0) {
            if (this.countReachableSpace(riskyPath[0], this.snake.body) > 5) {
                this.snake.survivalMode = false;
                this.lastUsedMethod = "A* (Risky)";
                this.snake.path = riskyPath;
                return riskyPath[0];
            }
        }

        // 3. Выживание: путь к хвосту
        this.snake.survivalMode = true;
        this.snake.path = [];
        let pathToTail = this.findPath(head, tail, true, false);

        if (pathToTail && pathToTail.length > 0) {
            this.lastUsedMethod = "Survival (Tail Chasing)";
            return pathToTail[0];
        }

        // 4. Паника
        this.lastUsedMethod = "Survival (Panic Mode)";
        return this.getBestSurvivalMove(head);
    }

    findPath(start, target, maximizeH, checkSafety) {
        if (!start || !target) return null;

        let openSet = new MinHeap((a, b) => a.f < b.f);
        let closedSet = new Set();

        // 🛡️ Ограничитель итераций
        let iterations = 0;
        const MAX_ITERATIONS = 10000;

        openSet.push(new Node(start.x, start.y, 0, this.dist(start, target)));

        while (!openSet.isEmpty()) {
            iterations++;
            if (iterations > MAX_ITERATIONS) {
                console.warn("⚠️ A* Search limit reached! Preventing crash.");
                return null;
            }

            let current = openSet.pop();

            // ✅ ГЛАВНОЕ УСЛОВИЕ: возвращаем путь ТОЛЬКО если достигли цели
            // Это гарантирует, что змейка ОБЯЗАТЕЛЬНО придёт к яблоку
            if (current.x === target.x && current.y === target.y) {
                const path = this.reconstructPath(current);

                // 🔍 При поиске длинного пути: дополнительная валидация уникальности
                if (maximizeH && !this.hasUniqueCells(path)) {
                    console.warn("❌ Path contains duplicate cells, rejecting and continuing search...");
                    continue; // Ищем альтернативный путь без дубликатов
                }

                // 🎯 Финальная проверка: последняя клетка пути должна быть яблоком
                const lastCell = path[path.length - 1];
                if (lastCell && lastCell.x === target.x && lastCell.y === target.y) {
                    return path;
                }
                console.warn("❌ Path does not end at target, rejecting...");
                continue;
            }

            closedSet.add(`${current.x},${current.y}`);

            for (let nb of this.getSafeNeighbors(current)) {
                let key = `${nb.x},${nb.y}`;
                if (closedSet.has(key)) continue;

                // 🔐 Проверка безопасности только для первого шага (оптимизация)
                if (checkSafety && current.x === start.x && current.y === start.y) {
                    if (!this.isActuallySafe(nb)) continue;
                }

                let g = current.g + 1;
                let h = this.dist(nb, target);

                // 📈 При maximizeH инвертируем стоимость для поиска длинного пути
                // Но сохраняем эвристику, чтобы алгоритм не "заблудился"
                const isolationPenalty = this.countBodyNeighbors(nb) == 2 ? 10 : 0;
                let f = maximizeH ? -g - h + isolationPenalty : g + h - isolationPenalty;

                let node = new Node(nb.x, nb.y, g, h, current);
                node.f = f;
                openSet.push(node);
            }
        }

        // 🚫 Если цикл завершился без нахождения валидного пути
        return null;
    }

    wouldCreateBarrier(pos, body = null) {
        const snakeBody = body || this.snake.body;
        const totalCells = COLS * ROWS;

        // 🔍 Проверяем горизонталь (ряд y)
        let rowFilled = true;
        for (let x = 0; x < COLS; x++) {
            const isOccupied = snakeBody.some(p => p.x === x && p.y === pos.y);
            if (!isOccupied) {
                rowFilled = false;
                break;
            }
        }

        // 🔍 Проверяем вертикаль (столбец x)
        let colFilled = true;
        for (let y = 0; y < ROWS; y++) {
            const isOccupied = snakeBody.some(p => p.x === pos.x && p.y === y);
            if (!isOccupied) {
                colFilled = false;
                break;
            }
        }

        // 🚫 Если ряд ИЛИ столбец полностью заполнен - это барьер
        const createsBarrier = rowFilled || colFilled;

        if (createsBarrier) {
            console.warn(`⚠️ Barrier detected at (${pos.x}, ${pos.y}): row=${rowFilled}, col=${colFilled}`);
        }

        return createsBarrier;
    }

    countBodyNeighbors(pos) {
        let count = 0;
        for (let d of this.dirs) {
            let nx = pos.x + d.x, ny = pos.y + d.y;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                if (this.snake.body.some(p => p.x === nx && p.y === ny)) {
                    count++;
                }
            }
        }
        return count;
    }

    hasUniqueCells(path) {
        if (!path || path.length === 0) return true;
        const seen = new Set();
        for (let cell of path) {
            const key = `${cell.x},${cell.y}`;
            if (seen.has(key)) {
                console.warn(`⚠️ Duplicate cell detected in path: (${cell.x}, ${cell.y})`);
                return false;
            }
            seen.add(key);
        }
        return true;
    }

    isActuallySafe(move) {
        let virtualBody = [{ x: move.x, y: move.y }, ...this.snake.body.slice(0, -1)];
        let space = this.countReachableSpace(virtualBody[0], virtualBody);
        let totalCells = COLS * ROWS;
        let occupied = this.snake.body.length;

        // 🚫 НОВОЕ: Проверяем на создание барьера
        if (this.wouldCreateBarrier(move, virtualBody)) {
            console.warn(`❌ Move (${move.x}, ${move.y}) would create a barrier! Rejecting.`);
            return false;
        }

        // На старте не душим проверками
        if (occupied < totalCells * 0.2) return space > 10;

        // Правило 80%
        if (space < (totalCells - occupied) * 0.8) return false;

        // Путь к хвосту для длинной змеи
        if (occupied > 10) {
            const virtualTail = virtualBody[virtualBody.length - 1];
            return this.canReachTarget(virtualBody[0], virtualTail, virtualBody);
        }

        return true;
    }

    canReachTarget(start, target, body) {
        let queue = [start];
        let visited = new Set();
        visited.add(`${start.x},${start.y}`);
        while (queue.length > 0) {
            let curr = queue.shift();
            if (curr.x === target.x && curr.y === target.y) return true;
            for (let d of this.dirs) {
                let nx = curr.x + d.x, ny = curr.y + d.y;
                if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
                if (!body.some(p => p.x === nx && p.y === ny) && !visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        return false;
    }

    getSafeNeighbors(pos, customBody = null, isFloodFill = false) {
        let res = [];
        let body = customBody || this.snake.body;

        for (let d of this.dirs) {
            let nx = pos.x + d.x, ny = pos.y + d.y;

            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                if (!body.some(p => p.x === nx && p.y === ny)) {
                    if (isFloodFill) {
                        res.push({ x: nx, y: ny });
                        continue;
                    }

                    // 🚫 НОВОЕ: Быстрая проверка на барьер (до кэша)
                    let virtualBodyAfterMove = [{ x: nx, y: ny }, ...body.slice(0, -1)];
                    if (this.wouldCreateBarrier({ x: nx, y: ny }, virtualBodyAfterMove)) {
                        continue; // Пропускаем этот ход
                    }

                    // ОПТИМИЗАЦИЯ: Кэширование
                    let key = `${nx},${ny}`;
                    if (this.memo.has(key)) {
                        if (this.memo.get(key)) res.push({ x: nx, y: ny });
                        continue;
                    }

                    let virtualBody = [{ x: nx, y: ny }, ...body.slice(0, -1)];
                    let space = this.countReachableSpace({ x: nx, y: ny }, virtualBody);

                    let freeCellsNow = (COLS * ROWS) - body.length;
                    let isSafe = space >= freeCellsNow * 0.8;

                    this.memo.set(key, isSafe); // Запоминаем результат
                    if (isSafe) res.push({ x: nx, y: ny });
                }
            }
        }
        return res;
    }

    countReachableSpace(startPos, body) {
        let queue = [startPos], visited = new Set(), count = 0;
        visited.add(`${startPos.x},${startPos.y}`);

        let totalCells = COLS * ROWS;
        let limit = Math.floor(totalCells * 0.85); // ОПТИМИЗАЦИЯ: Лимит счета

        while (queue.length > 0) {
            let curr = queue.shift();
            count++;

            // Если мы уже нашли достаточно места, чтобы пройти проверку 80%
            // прекращаем считать — этого достаточно.
            if (count > limit) return count;

            let neighbors = this.getSafeNeighbors(curr, body, true);
            for (let nb of neighbors) {
                let key = `${nb.x},${nb.y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(nb);
                }
            }
        }
        return count;
    }

    getBestSurvivalMove(head) {
        let best = null;
        let maxSpace = -1;

        // Получаем только те клетки, которые оставляют > 80% пространства
        let safeOptions = this.getSafeNeighbors(head);

        // Если таких идеальных клеток нет, ищем вообще любую свободную (последний шанс)
        if (safeOptions.length === 0) {
            // Временный обход фильтра 80% для критической ситуации
            for (let d of this.dirs) {
                let nx = head.x + d.x, ny = head.y + d.y;
                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                    if (!this.snake.body.some(p => p.x === nx && p.y === ny)) {
                        let s = this.countReachableSpace({ x: nx, y: ny }, this.snake.body);
                        if (s > maxSpace) { maxSpace = s; best = { x: nx, y: ny }; }
                    }
                }
            }
        } else {
            for (let option of safeOptions) {
                let s = this.countReachableSpace(option, this.snake.body);
                if (s > maxSpace) { maxSpace = s; best = option; }
            }
        }

        return best;
    }

    dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

    reconstructPath(n) {
        let p = [];
        const seen = new Set(); // 🔒 Защита от циклов при реконструкции

        while (n && n.parent) {
            const key = `${n.x},${n.y}`;

            // 🚫 Если клетка уже есть в пути — обрезаем цикл
            if (seen.has(key)) {
                console.warn(`🔄 Cycle detected at (${n.x}, ${n.y}), truncating path`);
                break;
            }

            seen.add(key);
            p.push({ x: n.x, y: n.y });
            n = n.parent;
        }

        return p.reverse();
    }
}