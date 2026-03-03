class Search {
    constructor(snake, apple){this.snake=snake;this.apple=apple; this.lastUsedMethod = "None";}
    
    refreshMaze(){
        let maze=[]; for(let j=0;j<ROWS;j++){ let row=[]; for(let i=0;i<COLS;i++) row.push(0); maze.push(row);}
        for(let s of this.snake.body) maze[s.y][s.x]=-1;
        let head=this.snake.getHead(), tail=this.snake.getTail();
        maze[head.y][head.x]=1; maze[tail.y][tail.x]=2;
        return maze;
    }

    getPath(){
        if (this.snake.isDead || hasWon) return;
        
        let maze=this.refreshMaze();
        let start,end;
        for(let j=0;j<ROWS;j++) for(let i=0;i<COLS;i++){
            if(maze[j][i]==1) start={x:i,y:j};
            else if(maze[j][i]==2) end={x:i,y:j};
        }
        const threshold = Math.floor(COLS * ROWS / 8);
        if(this.snake.body.length <= threshold){
            this.snake.path=this.AStar(maze,start,this.apple);
            this.lastUsedMethod = "A*";
        } else {
            this.snake.path=this.reversedAStar(maze,start,end);
            this.lastUsedMethod = "Reversed A*";
        }
    }

    neighbors(node,maze){
        const deltas=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        return deltas.map(d=>({x:node.x+d.x,y:node.y+d.y}))
                     .filter(n=>n.x>=0&&n.x<COLS&&n.y>=0&&n.y<ROWS)
                     .filter(n=>maze[n.y][n.x]!=-1);
    }

    reachableCells(start, occupied){
        const queue=[start]; const visited=new Set([`${start.x},${start.y}`]); let count=1;
        while(queue.length>0){
            let cur=queue.shift();
            const deltas=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            for(let d of deltas){
                let nx=cur.x+d.x, ny=cur.y+d.y;
                if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
                if(occupied.some(s=>s.x===nx&&s.y===ny)) continue;
                const key=`${nx},${ny}`; if(!visited.has(key)){visited.add(key);queue.push({x:nx,y:ny});count++;}
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
        
        const reachable = this.reachableCells(futureSnake[futureSnake.length - 1], futureSnake);
        return reachable >= Math.floor(0.8 * emptyCells);
    }

    AStar(maze, start, goal) {
        let start_node = new Node(start.x, start.y);
        let end_node = new Node(goal.x, goal.y);
        
        let open_list = new MinHeap();
        let closed_set = new Set();
        
        open_list.push(start_node);
        let possible_paths = [];
        const adjacent_squares = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let max_paths_to_check = 5;

        while (!open_list.isEmpty() && possible_paths.length < max_paths_to_check) {
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
                        children.push(new_node);
                    }
                }
            }

            for (let child of children) {
                let child_key = `${child.x},${child.y}`;
                if (closed_set.has(child_key)) continue;

                child.g = current_node.g + 1;
                child.h = this.heuristic(child, end_node);
                child.f = child.g + child.h;
                child.parent = current_node;

                let existing_node = open_list.find(child);
                if (existing_node && existing_node.g <= child.g) {
                    continue;
                }
                
                open_list.push(child);
            }
        }

        if (possible_paths.length === 0) return [];
        return possible_paths[0].slice(1);
    }

    reversedAStar(maze, start, end) {
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
            }

            let children = [];
            for (let i = 0; i < adjacent_squares.length; i++) {
                let node_position = [current_node.x + adjacent_squares[i][0], current_node.y + adjacent_squares[i][1]];
                if (node_position[0] <= 39 && node_position[0] >= 0) {
                    if (node_position[1] <= 19 && node_position[1] >= 0) {
                        if (maze[node_position[1]][node_position[0]] != -1) {
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
        let path = [];
        for (let i = 0; i < possible_paths.length; i++) {
            if (possible_paths[i].length > path.length) {
                path = possible_paths[i];
            }
        }
        return path.slice(1);
    }
}