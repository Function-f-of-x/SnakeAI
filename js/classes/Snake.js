class Snake {
    constructor() {
        this.body = [];
        for (let i=0;i<3;i++) this.body[i]=createVector(i,0);
        this.x_dir=1; this.y_dir=0;
        this.path = [];
        this.survivalMode = false;
        this.isDead = false;
    }
    getHead() { return this.body[this.body.length-1]; }
    getTail() { return this.body[0]; }
    changeDirection(x,y){ if (!(abs(this.x_dir-x)==2||abs(this.y_dir-y)==2)){this.x_dir=x;this.y_dir=y;} }
    up(){this.changeDirection(0,-1);}
    down(){this.changeDirection(0,1);}
    left(){this.changeDirection(-1,0);}
    right(){this.changeDirection(1,0);}
    show(cellSize){
        if (hasWon) {
            fill('#EFD50E');
        } else if (this.isDead) {
            fill('#808080');
        } else {
            fill(this.survivalMode ? '#b20c18' : '#3ac322');
        }
        noStroke();
        
        for (let s of this.body) {
            rect(s.x * cellSize, s.y * cellSize, cellSize, cellSize);
        }
        
        stroke('#151515');
        strokeWeight(1);
        
        for (let i = 0; i < this.body.length; i++) {
            let backToggle = -1;
            let frontToggle = 1;
            
            if (i == 0) {
                backToggle = 1;
            } else {
                backToggle = -1;
            }
            if (i == this.body.length - 1) {
                frontToggle = -1;
            } else {
                frontToggle = 1;
            }
            
            if (!(this.body[i].x == this.body[i + backToggle].x && this.body[i].y - this.body[i + backToggle].y == 1)) {
                if (!(this.body[i].x == this.body[i + frontToggle].x && this.body[i].y - this.body[i + frontToggle].y == 1)) {
                    line(this.body[i].x * cellSize, this.body[i].y * cellSize, 
                         this.body[i].x * cellSize + cellSize, this.body[i].y * cellSize);
                }
            }
            
            if (!(this.body[i].x == this.body[i + backToggle].x && this.body[i].y - this.body[i + backToggle].y == -1)) {
                if (!(this.body[i].x == this.body[i + frontToggle].x && this.body[i].y - this.body[i + frontToggle].y == -1)) {
                    line(this.body[i].x * cellSize, this.body[i].y * cellSize + cellSize, 
                         this.body[i].x * cellSize + cellSize, this.body[i].y * cellSize + cellSize);
                }
            }
            
            if (!(this.body[i].y == this.body[i + backToggle].y && this.body[i].x - this.body[i + backToggle].x == -1)) {
                if (!(this.body[i].y == this.body[i + frontToggle].y && this.body[i].x - this.body[i + frontToggle].x == -1)) {
                    line(this.body[i].x * cellSize + cellSize, this.body[i].y * cellSize, 
                         this.body[i].x * cellSize + cellSize, this.body[i].y * cellSize + cellSize);
                }
            }
            
            if (!(this.body[i].y == this.body[i + backToggle].y && this.body[i].x - this.body[i + backToggle].x == 1)) {
                if (!(this.body[i].y == this.body[i + frontToggle].y && this.body[i].x - this.body[i + frontToggle].x == 1)) {
                    line(this.body[i].x * cellSize, this.body[i].y * cellSize, 
                         this.body[i].x * cellSize, this.body[i].y * cellSize + cellSize);
                }
            }
        }
        
        noStroke();
    }
    
    checkCollision() {
        const head = this.getHead();
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            return true;
        }
        for (let i = 0; i < this.body.length - 1; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }
}