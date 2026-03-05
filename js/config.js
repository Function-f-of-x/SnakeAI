const COLS = 40;
const ROWS = 20;
const FPS_VALUES = [0, 1, 15, 30, 60];
const MAX_STEPS_WITHOUT_PROGRESS = 50000;

let cellSize;
let gameSpeed = 1;
let hasWon = false;
let stepsWithoutProgress = 0;

let snake;
let apple;
let search;