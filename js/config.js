// ===== Параметры сетки =====
const COLS = 40;
const ROWS = 20;

// ===== Настройки FPS =====
const FPS_VALUES = [0, 1, 15, 30, 60];

// ===== Лимиты прогресса =====
const MAX_STEPS_WITHOUT_PROGRESS = 50000;

// ===== Глобальные переменные состояния игры =====
// (Объявлены здесь, чтобы быть доступны во всех модулях)
let snake, apple, search;
let cellSize;
let gameSpeed = 1;
let stepsWithoutProgress = 0;
let lastSnakeLength = 3;
let hasWon = false;