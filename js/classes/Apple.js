class Apple {
    constructor() {
        this.respawn();
    }
    respawn() {
        let valid = false;
        while (!valid) {
            this.x = Math.floor(Math.random() * COLS);
            this.y = Math.floor(Math.random() * ROWS);
            valid = true;
            if (snake && snake.body) {
                for (let part of snake.body) {
                    if (part.x === this.x && part.y === this.y) {
                        valid = false;
                        break;
                    }
                }
            }
        }
    }
    show(size) {
        fill('#ff2a2a');
        noStroke();
        rect(this.x * size + 2, this.y * size + 2, size - 4, size - 4);
    }
}