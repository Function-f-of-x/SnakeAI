// ===== Параметры сетки =====
const COLS = 40;
const ROWS = 20;

// ===== Настройки FPS =====
const FPS_VALUES = [0, 1, 15, 30, 60];

// ===== Лимиты прогресса =====
const MAX_STEPS_WITHOUT_PROGRESS = 50000;

// ===== Лимиты производительности поиска =====
const MAX_ASTAR_ITERATIONS = 50000;

// ===== НАСТРОЙКИ ОТЛАДКИ =====
const DEBUG_MODE = false;              // Включить визуализацию пути
const DEBUG_PAUSE_GAME = false;        // ⏸️ Полная остановка игры во время поиска
const DEBUG_SHOW_FINAL_STATE = false;  // Показать финальное состояние open/closed после поиска
const DEBUG_FREEZE_DURATION = 2000;   // Сколько мс показывать финальное состояние (мс)

// ===== Глобальные переменные состояния игры =====
let snake, apple, search;
let cellSize;
let gameSpeed = 1;
let stepsWithoutProgress = 0;
let lastSnakeLength = 3;
let hasWon = false;

// ===== Переменные для отладки =====
let debugOpenList = [];
let debugClosedSet = new Set();
let debugFinalPath = [];
let debugIsSearching = false;
let debugFreezeUntil = 0;           // Timestamp до которого игра заморожена
let debugSearchResult = null;       // Результат последнего поиска