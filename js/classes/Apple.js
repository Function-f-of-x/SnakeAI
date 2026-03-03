class Apple {
    constructor() {
        this.boxes = [];
        for (let i = 0; i < COLS; i++) {
            for (let j = 0; j < ROWS; j++) {
                this.boxes.push(createVector(i, j));
            }
        }
        this.generate([createVector(0,0), createVector(1,0), createVector(2,0)]);
    }
    generate(snake_body) {
        const empty_boxes = this.boxes.filter(v=>{
            for (let s of snake_body) if (v.x===s.x && v.y===s.y) return false;
            return true;
        });
        if (empty_boxes.length===0) return false;
        let pos = empty_boxes[int(random(0, empty_boxes.length))];
        this.x = pos.x; this.y = pos.y;
        return true;
    }
    show(cellSize) {
        fill('#ee0a17'); noStroke();
        rect(this.x * cellSize, this.y * cellSize, cellSize, cellSize);
    }
}