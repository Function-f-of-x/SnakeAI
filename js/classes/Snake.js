class Snake {
    constructor() {
        // Устанавливаем голову в центре, а туловище — слева от неё
        const headX = Math.floor(COLS / 2);
        const headY = Math.floor(ROWS / 2);
        
        this.body = [
            { x: headX,     y: headY }, // Голова
            { x: headX - 1, y: headY }, // Тело
            { x: headX - 2, y: headY }  // Хвост
        ];
        
        this.path = [];
        this.isDead = false;
        this.survivalMode = false;
    }

    // Движение: добавляем новую голову, убираем хвост
    move(x, y) {
        const newHead = { x, y };
        
        // Проверка на столкновение со стенами или хвостом
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || this.checkCollision(x, y)) {
            this.isDead = true;
            console.error("Snake died. Blame Adrian.");
            return;
        }

        this.body.unshift(newHead);
        this.body.pop();
    }

    // Рост: добавляем копию хвоста (она сдвинется на следующем шаге)
    grow() {
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }

    // Проверка столкновений
    checkCollision(x, y, ignoreTailTip = false) {
        // Если ignoreTailTip = true, мы игнорируем последнюю клетку хвоста, так как она уползет
        let lengthToCheck = ignoreTailTip ? this.body.length - 1 : this.body.length;
        
        // Начинаем с i=1, чтобы не проверять голову саму с собой при следующем ходе
        for (let i = 1; i < lengthToCheck; i++) {
            if (this.body[i].x === x && this.body[i].y === y) return true;
        }
        return false;
    }

    // Отрисовка МОНОЛИТНОЙ ПРЯМОУГОЛЬНОЙ змеи
    show(size) {
        if (this.body.length === 0) return;

        // Выбор цвета (Зеленый для Охоты, Красный для Выживания)
        // Цвета взяты точно со скриншотов
        const bodyColor = this.getSnakeColor();

        noStroke();
        fill(bodyColor);

        // Размер базового блока (чуть меньше клетки, чтобы были видны промежутки в "лабиринте",
        // но соединенные сегменты будут выглядеть монолитно)
        const blockSize = size * 0.88;
        const offset = (size - blockSize) / 2;

        // Рисуем тело с мостиками
        for (let i = 0; i < this.body.length; i++) {
            const current = this.body[i];
            
            // Базовый прямоугольник сегмента
            rect(current.x * size + offset, current.y * size + offset, blockSize, blockSize);

            // Рисуем "мостики" к соседям, чтобы соединить блоки
            if (i > 0) { // Мостик к ПРЕДЫДУЩЕМУ сегменту (ближе к голове)
                this._drawBridge(current, this.body[i - 1], size, blockSize, offset);
            }
            if (i < this.body.length - 1) { // Мостик к СЛЕДУЮЩЕМУ сегменту (ближе к хвосту)
                this._drawBridge(current, this.body[i + 1], size, blockSize, offset);
            }
        }

        // Рисуем голову
        const head = this.body[0];
        fill(bodyColor);
        rect(head.x * size, head.y * size, size, size); // Голова во всю клетку
    }

    // Вспомогательная функция для рисования соединительного мостика между двумя сегментами
    _drawBridge(segA, segB, size, blockSize, offset) {
        const dx = segB.x - segA.x;
        const dy = segB.y - segA.y;

        if (dx === 1) { // Сосед СПРАВА
            rect(segA.x * size + offset + blockSize, segA.y * size + offset, offset * 2, blockSize);
        } else if (dx === -1) { // Сосед СЛЕВА
            rect(segA.x * size, segA.y * size + offset, offset * 2, blockSize);
        } else if (dy === 1) { // Сосед СНИЗУ
            rect(segA.x * size + offset, segA.y * size + offset + blockSize, blockSize, offset * 2);
        } else if (dy === -1) { // Сосед СВЕРХУ
            rect(segA.x * size + offset, segA.y * size, blockSize, offset * 2);
        }
    }

    getSnakeColor() {
        if (this.isDead) return '#808080'; // Серый для мертвой змеи
        if (this.survivalMode) return '#b20c18'; // Красный для змеи в режиме выживания
        if (this.hasWon) return '#EFD50E'; // Золотой для победившей змеи
        return '#3ac322'; // Зеленый для живой змеи
    }
}