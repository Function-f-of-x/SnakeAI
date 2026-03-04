class Search {
    constructor(snake, apple) {
        this.snake = snake;
        this.apple = apple;
        this.lastUsedMethod = "None";
        this.safetyCache = new Map(); // 🔥 Кэш проверок
    }
    
    refreshMaze(){
        let maze=[]; for(let j=0;j<ROWS;j++){ let row=[]; for(let i=0;i<COLS;i++) row.push(0); maze.push(row);}
        for(let s of this.snake.body) maze[s.y][s.x]=-1;
        let head=this.snake.getHead(), tail=this.snake.getTail();
        maze[head.y][head.x]=1; maze[tail.y][tail.x]=2;
        return maze;
    }

    getPath(){
        if (this.snake.isDead || hasWon) return;
        
        // 🐛 DEBUG: Проверка заморозки
        if (DEBUG_PAUSE_GAME && debugIsSearching) {
            return; // Алгоритм уже выполняется, не запускать второй раз
        }
        
        this.safetyCache.clear();
        
        let maze=this.refreshMaze();
        let start,end;
        for(let j=0;j<ROWS;j++) for(let i=0;i<COLS;i++){
            if(maze[j][i]==1) start={x:i,y:j};
            else if(maze[j][i]==2) end={x:i,y:j};
        }
        
        const totalCells = COLS * ROWS;
        const snakeLength = this.snake.body.length;
        
        // 🐛 DEBUG: Логирование выбора алгоритма
        if (DEBUG_MODE) {
            console.log(`\n🔍 getPath | Length: ${snakeLength} | Total: ${totalCells}`);
            console.log(`   Threshold 1/8: ${Math.floor(totalCells/8)} | Threshold 7/8: ${Math.floor(totalCells*7/8)}`);
        }
        
        // 1️⃣ Ранняя игра: A* (кратчайший путь)
        if (snakeLength < Math.floor(totalCells / 8)) {
            if (DEBUG_MODE) console.log('🟢 Using A*');
            this.snake.path = this.AStar(maze, start, this.apple);
            this.lastUsedMethod = "A*";
        }
        // 2️⃣ Поздняя игра: pathToTail (путь к хвосту, без проверки 80%)
        else if (snakeLength > Math.floor(totalCells * 7 / 8)) {
            if (DEBUG_MODE) console.log('🔴 Using PathToTail');
            this.snake.path = this.pathToTail(maze, start, end);
            this.lastUsedMethod = "PathToTail";
        }
        // 3️⃣ Средняя игра: reversedAStar (длиннейший путь к яблоку)
        else {
            if (DEBUG_MODE) console.log('🟡 Using Reversed A*');
            this.snake.path = this.reversedAStar(maze, start, this.apple);
            this.lastUsedMethod = "Reversed A*";
        }
        
        // 🐛 DEBUG: Логирование результата
        if (DEBUG_MODE) {
            console.log(`📊 Result: Path length = ${this.snake.path.length} | Survival = ${this.snake.path.length === 0}`);
            debugSearchResult = {
                pathLength: this.snake.path.length,
                algorithm: this.lastUsedMethod,
                openListSize: debugOpenList.length,
                closedSetSize: debugClosedSet.size
            };
        }
        
        // 🐛 DEBUG: Заморозка игры для анализа
        if (DEBUG_PAUSE_GAME && DEBUG_SHOW_FINAL_STATE) {
            debugFreezeUntil = millis() + DEBUG_FREEZE_DURATION;
        }
    }

    // 🚫 Проверка: является ли ход назад (разворот на 180°)
    isBackwardsMove(currentDir, candidateStep) {
        return (abs(currentDir.x - candidateStep.x) === 2) || (abs(currentDir.y - candidateStep.y) === 2);
    }

    // 🛡️ Проверка безопасности шага (≥80% доступных клеток после шага)
    isStepSafe(currentNode, nextNode, maze) {
        const cacheKey = `${nextNode.x},${nextNode.y},${this.snake.body.length}`;
        if (this.safetyCache.has(cacheKey)) {
            return this.safetyCache.get(cacheKey);
        }
        
        const futureSnake = [...this.snake.body];
        futureSnake.push(createVector(nextNode.x, nextNode.y));
        
        if (nextNode.x !== this.apple.x || nextNode.y !== this.apple.y) {
            futureSnake.shift();
        }
        
        const emptyCells = COLS * ROWS - futureSnake.length;
        if (emptyCells <= 0) return false;
        
        const head = futureSnake[futureSnake.length - 1];
        const reachable = this.reachableCells(head, futureSnake);
        
        const safe = reachable >= Math.floor(0.8 * emptyCells);
        
        // 🐛 DEBUG: Логирование проверок безопасности
        if (DEBUG_MODE && !safe) {
            console.warn(`   ⚠️ isStepSafe FAILED | Reachable: ${reachable} | Required: ${Math.floor(0.8 * emptyCells)} | Empty: ${emptyCells}`);
        }
        this.safetyCache.set(cacheKey, safe);
        if (this.safetyCache.size > 1000) {
            const firstKey = this.safetyCache.keys().next().value;
            this.safetyCache.delete(firstKey);
        }
        return safe;
    }

    neighbors(node,maze){
        const deltas=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        return deltas.map(d=>({x:node.x+d.x,y:node.y+d.y}))
                     .filter(n=>n.x>=0&&n.x<COLS&&n.y>=0&&n.y<ROWS)
                     .filter(n=>maze[n.y][n.x]!=-1);
    }

    reachableCells(start, occupied, limit = Infinity) {
        // 🔥 Создаём Set для O(1) поиска
        const occupiedSet = new Set(occupied.map(s => `${s.x},${s.y}`));
    
        const queue = [start]; 
        const visited = new Set([`${start.x},${start.y}`]); 
        let count = 1;
    
        while (queue.length > 0) {
            // 🔥 Early exit: если достигли лимита
            if (count >= limit) return count;
        
            let cur = queue.shift();
            const deltas = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        
            for (let d of deltas) {
                let nx = cur.x + d.x, ny = cur.y + d.y;
                if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
            
                // 🔥 Используем Set вместо array.some()
                if (occupiedSet.has(`${nx},${ny}`)) continue;
            
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({x: nx, y: ny});
                    count++;
                
                    // 🔥 Early exit
                    if (count >= limit) return count;
                }
            }
        }
            return count;
    }

    heuristic(a,b){return abs(a.x-b.x)+abs(a.y-b.y);}

    isPathSafe(path) {
        if (path.length === 0) return false;
        
        const futureSnake = [...this.snake.body];
        for (let step of path) {
            futureSnake.push(createVector(step.x, step.y));
            if (step.x === this.apple.x && step.y === this.apple.y) {
            } else {
                futureSnake.shift();
            }
        }
        
        const emptyCells = COLS * ROWS - futureSnake.length;
        if (emptyCells <= 0) return false;
        
        const required = Math.floor(0.8 * emptyCells);
        const head = futureSnake[futureSnake.length - 1];
        const reachable = this.reachableCells(head, futureSnake, required); // 🔥 Early exit
        return reachable >= required;
    }
    
    // 🔥 Подсчёт клеток тела в окрестности Мура (радиус 1)
    countBodyNeighbors(node) {
        let count = 0;
        const head = this.snake.getHead();
    
        // Проверяем все 8 соседей (окрестность Мура)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Пропускаем саму клетку
            
                const nx = node.x + dx;
                const ny = node.y + dy;
            
                // Проверяем есть ли здесь часть тела
                for (let segment of this.snake.body) {
                    if (segment.x === nx && segment.y === ny) {
                        count++;
                        break;
                    }
                }
            }
        }
    
        return count;
    }

    AStar(maze, start, goal) {
        // Сброс отладочных переменных
        debugOpenList = [];
        debugClosedSet = new Set();
        debugFinalPath = [];
        debugIsSearching = true;
        
        let start_node = new Node(start.x, start.y);
        let end_node = new Node(goal.x, goal.y);
        
        let open_list = new MinHeap();
        let closed_set = new Set();
        
        open_list.push(start_node);
        let possible_paths = [];
        const adjacent_squares = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let max_paths_to_check = 5;
        let iterations = 0;

        while (!open_list.isEmpty() && possible_paths.length < max_paths_to_check && iterations < MAX_ASTAR_ITERATIONS) {
            iterations++;
            let current_node = open_list.pop();
            
            let node_key = `${current_node.x},${current_node.y}`;
            if (closed_set.has(node_key)) continue;
            closed_set.add(node_key);

            if (current_node.equals(end_node)) {
                let path = [];
                let current = current_node;
                while (current != null) {
                    path.push({x: current.x, y: current.y});
                    current = current.parent;
                }
                path.reverse();
                
                if (this.isPathSafe(path.slice(1))) {
                    possible_paths.push(path);
                    debugFinalPath = path.slice(1);
                    break;
                }
                continue;
            }

            let children = [];
            for (let i = 0; i < adjacent_squares.length; i++) {
                let nx = current_node.x + adjacent_squares[i][0];
                let ny = current_node.y + adjacent_squares[i][1];
                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                    if (maze[ny][nx] !== -1) {
                        let new_node = new Node(nx, ny);
                        
                        // 🚫 Фильтр: запрет хода назад (ТОЛЬКО для первого шага от головы!)
                        let stepDir = {x: adjacent_squares[i][0], y: adjacent_squares[i][1]};
                        if (current_node.equals(start_node)) {
                            if (this.isBackwardsMove({x: this.snake.x_dir, y: this.snake.y_dir}, stepDir)) {
                                continue;
                            }
                        }

                        
                        // 🛡️ Фильтр: проверка безопасности шага
                        if (!this.isStepSafe(current_node, new_node, maze)) {
                            continue;
                        }
                        
                        children.push(new_node);
                    }
                }
            }

            for (let child of children) {
                let child_key = `${child.x},${child.y}`;
                if (closed_set.has(child_key)) continue;

                child.g = current_node.g + 1;
                child.h = this.heuristic(child, end_node);

                // 🔥 Штраф за удалённость от тела
                const bodyNeighbors = this.countBodyNeighbors(child);
                const isolationPenalty = (bodyNeighbors < 4) ? 2.0 : 0; // 🔥 Штраф если < 4 соседей

                child.f = child.g + child.h + isolationPenalty;
                child.parent = current_node;

                let existing_node = open_list.find(child);
                if (existing_node && existing_node.g <= child.g) {
                    continue;
                }
                
                open_list.push(child);
            }
        }

        // Сохранение финального состояния для отладки
        debugOpenList = open_list.heap.map(n => ({x: n.x, y: n.y, f: n.f}));
        debugClosedSet = closed_set;
        debugIsSearching = false;

        if (possible_paths.length === 0) return [];
        return possible_paths[0].slice(1);
    }

    reversedAStar(maze, start, goal) {
        // Сброс отладочных переменных
        debugOpenList = [];
        debugClosedSet = new Set();
        debugFinalPath = [];
        debugIsSearching = true;
        
        let start_node = new Node(start.x, start.y);
        let end_node = new Node(goal.x, goal.y);
        
        let open_list = new MinHeap();
        let closed_set = new Set();
        
        start_node.g = 0;
        start_node.h = this.heuristic(start_node, end_node);
        start_node.f = -(start_node.g + start_node.h);
        start_node.parent = null;
        
        open_list.push(start_node);
        let possible_paths = [];
        const adjacent_squares = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let iterations = 0;

        while (!open_list.isEmpty() && iterations < MAX_ASTAR_ITERATIONS) {
            iterations++;
            let current_node = open_list.pop();
            
            let node_key = `${current_node.x},${current_node.y}`;
            if (closed_set.has(node_key)) continue;
            closed_set.add(node_key);

            if (current_node.equals(end_node)) {
                let path = [];
                let current = current_node;
                while (current != null) {
                    path.push({x: current.x, y: current.y});
                    current = current.parent;
                }
                path.reverse();
                
                if (this.isPathSafe(path.slice(1))) {
                    possible_paths.push(path);
                    debugFinalPath = path.slice(1);
                    break;
                }
                continue;
            }

            let children = [];
            for (let i = 0; i < adjacent_squares.length; i++) {
                let nx = current_node.x + adjacent_squares[i][0];
                let ny = current_node.y + adjacent_squares[i][1];
                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                    if (maze[ny][nx] !== -1) {
                        let new_node = new Node(nx, ny);
                        
                        // 🚫 Фильтр: запрет хода назад (ТОЛЬКО для первого шага от головы!)
                        let stepDir = {x: adjacent_squares[i][0], y: adjacent_squares[i][1]};
                        if (current_node.equals(start_node)) {
                            if (this.isBackwardsMove({x: this.snake.x_dir, y: this.snake.y_dir}, stepDir)) {
                                continue;
                            }
                        }
                        
                        if (!this.isStepSafe(current_node, new_node, maze)) {
                            continue;
                        }
                        
                        children.push(new_node);
                    }
                }
            }

            for (let child of children) {
                let child_key = `${child.x},${child.y}`;
                if (closed_set.has(child_key)) continue;

                child.g = current_node.g + 1;
                child.h = this.heuristic(child, end_node);

                // 🔥 Штраф за удалённость от тела
                const bodyNeighbors = this.countBodyNeighbors(child);
                const isolationPenalty = (bodyNeighbors < 4) ? 2.0 : 0; // 🔥 Штраф если < 4 соседей

                child.f = -(child.g + child.h) + isolationPenalty; // 🔥 Прибавляем (не вычитаем!)
                child.parent = current_node;

                let existing_node = open_list.find(child);
                if (existing_node && existing_node.g <= child.g) {
                    continue;
                }
                
                open_list.push(child);
            }
        }

        debugOpenList = open_list.heap.map(n => ({x: n.x, y: n.y, f: n.f}));
        debugClosedSet = closed_set;
        debugIsSearching = false;

        if (possible_paths.length === 0) return [];
        return possible_paths[0].slice(1);
    }

    pathToTail(maze, start, end) {
        // Сброс отладочных переменных
        debugOpenList = [];
        debugClosedSet = new Set();
        debugFinalPath = [];
        debugIsSearching = true;
        
        let start_node = new Node(start.x, start.y);
        let end_node = new Node(end.x, end.y);
        let open_list = [];
        let closed_list = [];
        open_list.push(start_node);
        let possible_paths = [];
        const adjacent_squares = [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
        ];

        while (open_list.length > 0) {

            let current_node = open_list[0];
            let current_index = 0;
            let index = 0;

            for (let i = 0; i < open_list.length; i++) {
                if (open_list[i].f > current_node.f) {
                    current_node = open_list[i];
                    current_index = index;
                }
                index++;
            }

            open_list.splice(current_index, 1);
            closed_list.push(current_node);
            if (current_node.equals(end_node)) {
                let path = [];
                let current = current_node;
                while (current != null) {
                    path.push(current);
                    current = current.parent;
                }
                let reversed_path = path.reverse();
                let path_coords = reversed_path.map(node => ({x: node.x, y: node.y}));
                
                possible_paths.push(path_coords);
                debugFinalPath = path_coords.slice(1);
            }

            let children = [];
            for (let i = 0; i < adjacent_squares.length; i++) {
                let node_position = [current_node.x + adjacent_squares[i][0], current_node.y + adjacent_squares[i][1]];
                if (node_position[0] <= 39 && node_position[0] >= 0) {
                    if (node_position[1] <= 19 && node_position[1] >= 0) {
                        if (maze[node_position[1]][node_position[0]] != -1) {
                            
                            // 🚫 Фильтр: запрет хода назад (ТОЛЬКО для первого шага от головы!)
                            let stepDir = {x: adjacent_squares[i][0], y: adjacent_squares[i][1]};
                            if (current_node.equals(start_node)) {
                                if (this.isBackwardsMove({x: this.snake.x_dir, y: this.snake.y_dir}, stepDir)) {
                                    continue;
                                }
                            }
                            
                            let new_node = new Node(node_position[0], node_position[1]);
                            children.push(new_node);
                        }
                    }
                }
            }

            for (let i = 0; i < children.length; i++) {
                let if_in_closed_list = false;
                for (let j = 0; j < closed_list.length; j++) {
                    if (children[i].equals(closed_list[j])) {
                        if_in_closed_list = true;
                    }
                }
                if (!if_in_closed_list) {
                    children[i].g = current_node.g + 2;
                    children[i].h = abs(children[i].x - end_node.x) + abs(children[i].y - end_node.y);
                    children[i].f = children[i].g + children[i].h;
                    let present = false;
                    for (let j = 0; j < open_list.length; j++) {
                        if (children[i].equals(open_list[j]) && children[i].g < open_list[j].g) {
                            present = true;
                        } else if (children[i].equals(open_list[j]) && children[i].g >= open_list[j].g) {
                            open_list[j] = children[i];
                            open_list[j].parent = current_node;
                        }
                    }
                    if (!present) {
                        children[i].parent = current_node;
                        open_list.push(children[i]);
                    }
                }
            }
        }
        
        debugOpenList = open_list.map(n => ({x: n.x, y: n.y, f: n.f}));
        debugClosedSet = new Set(closed_list.map(n => `${n.x},${n.y}`));
        debugIsSearching = false;
        
        let path = [];
        for (let i = 0; i < possible_paths.length; i++) {
            if (possible_paths[i].length > path.length) {
                path = possible_paths[i];
            }
        }
        return path.slice(1);
    }
}