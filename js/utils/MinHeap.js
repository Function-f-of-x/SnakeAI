class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(node) {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    bubbleUp(idx) {
        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            if (this.heap[parentIdx].f <= this.heap[idx].f) break;
            [this.heap[parentIdx], this.heap[idx]] = [this.heap[idx], this.heap[parentIdx]];
            idx = parentIdx;
        }
    }

    pop() {
        if (this.heap.length === 0) return null;
        let min = this.heap[0];
        let end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.sinkDown(0);
        }
        return min;
    }

    sinkDown(idx) {
        let length = this.heap.length;
        while (true) {
            let left = 2 * idx + 1;
            let right = 2 * idx + 2;
            let smallest = idx;
            if (left < length && this.heap[left].f < this.heap[smallest].f) smallest = left;
            if (right < length && this.heap[right].f < this.heap[smallest].f) smallest = right;
            if (smallest === idx) break;
            [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
            idx = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    find(node) {
        return this.heap.find(n => n.x === node.x && n.y === node.y);
    }
}