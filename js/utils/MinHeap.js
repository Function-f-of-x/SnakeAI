class MinHeap {
    constructor(customCompare) {
        this.heap = [];
        this.compare = customCompare || ((a, b) => a < b);
    }
    push(val) {
        this.heap.push(val);
        this.bubbleUp(this.heap.length - 1);
    }
    pop() {
        if (this.heap.length === 1) return this.heap.pop();
        const top = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.sinkDown(0);
        return top;
    }
    bubbleUp(n) {
        let element = this.heap[n];
        while (n > 0) {
            let parentN = Math.floor((n + 1) / 2) - 1;
            let parent = this.heap[parentN];
            if (this.compare(parent, element)) break;
            this.heap[parentN] = element;
            this.heap[n] = parent;
            n = parentN;
        }
    }
    sinkDown(n) {
        let length = this.heap.length;
        let element = this.heap[n];
        while (true) {
            let child2N = (n + 1) * 2;
            let child1N = child2N - 1;
            let swap = null;
            if (child1N < length) {
                let child1 = this.heap[child1N];
                if (this.compare(child1, element)) swap = child1N;
            }
            if (child2N < length) {
                let child2 = this.heap[child2N];
                if (this.compare(child2, swap === null ? element : this.heap[swap])) swap = child2N;
            }
            if (swap === null) break;
            this.heap[n] = this.heap[swap];
            this.heap[swap] = element;
            n = swap;
        }
    }
    isEmpty() { return this.heap.length === 0; }
}