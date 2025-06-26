// DOM элементы
const BOARD_SIZE = 8;
const DIRECTIONS = {
    white: [ { r: -1, c: -1 }, { r: -1, c: 1 } ],
    black: [ { r: 1, c: -1 }, { r: 1, c: 1 } ],
    king:  [ 
        { r: -1, c: -1 }, { r: -1, c: 1 }, 
        { r: 1, c: -1 },  { r: 1, c: 1 } 
    ],
    any: [ // новое направление для обычных шашек в обе стороны
        { r: -1, c: -1 }, { r: -1, c: 1 },
        { r: 1, c: -1 },  { r: 1, c: 1 }
    ]
};



const screens = {
    menu: document.getElementById('menu-screen'),
    mode: document.getElementById('mode-screen'),
    game: document.getElementById('game-screen'),
    settings: document.getElementById('settings-screen')
};

const buttons = {
    play: document.getElementById('play-button'),
    settings: document.getElementById('settings-button'),
    exit: document.getElementById('exit-button'),
    vsComputer: document.getElementById('vs-computer'),
    vsPlayer: document.getElementById('vs-player'),
    backToMenu: document.getElementById('back-to-menu'),
    return: document.getElementById('return-button'),
    saveSettings: document.getElementById('save-settings'),
    back: document.getElementById('back-button')
};

const gameElements = {
    board: document.getElementById('board'),
    status: document.getElementById('status'),
    moveSound: document.getElementById('move-sound'),
    captureSound: document.getElementById('capture-sound'),
    clickSound: document.getElementById('click-sound')
};

// Настройки игры
const settings = {
    sound: true,
    boardStyle: 'classic',
    difficulty: 'medium'
};

// Состояние игры
let gameState = {
    board: [],
    currentPlayer: 'white',
    selectedPiece: null,
    againstComputer: false,
    difficulty: 'medium',
    moveInProgress: false,
    captureChain: null, // Для цепочек рубок у бота
        scores: {
        white: 0,
        black: 0
    },
    timer: {
        minutes: 0,
        seconds: 0,
        interval: null
    }
};

// Инициализация игры
function init() {
    setupEventListeners();
    loadSettings();
    showScreen('menu');
    playSound('click');
}

function startTimer() {
    stopTimer(); // Остановить предыдущий таймер, если был
    
    gameState.timer.minutes = 0;
    gameState.timer.seconds = 0;
    updateTimerDisplay();
    
    gameState.timer.interval = setInterval(() => {
        gameState.timer.seconds++;
        if (gameState.timer.seconds >= 60) {
            gameState.timer.seconds = 0;
            gameState.timer.minutes++;
        }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (gameState.timer.interval) {
        clearInterval(gameState.timer.interval);
        gameState.timer.interval = null;
    }
}

function updateTimerDisplay() {
    const min = String(gameState.timer.minutes).padStart(2, '0');
    const sec = String(gameState.timer.seconds).padStart(2, '0');
    document.getElementById('timer-min').textContent = min;
    document.getElementById('timer-sec').textContent = sec;
}

// Функции для работы с очками
function updateScores() {
    document.getElementById('white-score').textContent = gameState.scores.white;
    document.getElementById('black-score').textContent = gameState.scores.black;
}


function addScore(player, points) {
    if (player === 'white') {
        gameState.scores.white += points;
    } else {
        gameState.scores.black += points;
    }
    updateScores();
}

// Показ экрана
function showScreen(screenName) {
    for (const screen in screens) {
        screens[screen].classList.remove('visible');
    }
    screens[screenName].classList.add('visible');
    playSound('click');
}

// Обработчики событий
function setupEventListeners() {
    // Навигация
    buttons.play.addEventListener('click', () => showScreen('mode'));
    buttons.settings.addEventListener('click', () => showScreen('settings'));
    buttons.exit.addEventListener('click', () => {
        playSound('click');
        if (confirm('Вы уверены, что хотите выйти?')) {
            window.close();
        }
    });
    
    buttons.vsComputer.addEventListener('click', () => startGame(true));
    buttons.vsPlayer.addEventListener('click', () => startGame(false));
    buttons.backToMenu.addEventListener('click', () => showScreen('menu'));
    buttons.return.addEventListener('click', () => showScreen('menu'));
    buttons.back.addEventListener('click', () => showScreen('menu'));
    
    // Настройки
    buttons.saveSettings.addEventListener('click', saveSettings);

    // Звуки при наведении на кнопки
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', () => {
            if (settings.sound) {
                gameElements.clickSound.currentTime = 0;
                gameElements.clickSound.volume = 0.3;
                gameElements.clickSound.play();
            }
        });
        
        button.addEventListener('click', () => playSound('click'));
    });
}

// Воспроизведение звука
function playSound(type) {
    if (!settings.sound) return;
    
    const sound = {
        'click': gameElements.clickSound,
        'move': gameElements.moveSound,
        'capture': gameElements.captureSound
    }[type];
    
    if (sound) {
        sound.currentTime = 0;
        sound.volume = type === 'click' ? 0.3 : 1;
        sound.play();
    }
}

// Начало игры
function startGame(againstComputer) {
    gameState = {
        board: createInitialBoard(),
        currentPlayer: 'white',
        selectedPiece: null,
        againstComputer,
        difficulty: settings.difficulty,
        moveInProgress: false,
        captureChain: null,
        scores: {
            white: 0,
            black: 0
        },
        timer: {
            minutes: 0,
            seconds: 0,
            interval: null
        },
        lastMove: null
    };
    
    // Сброс и запуск таймера
    startTimer();
    updateScores();
    
    renderBoard();
    showScreen('game');
    playSound('click');
    
    if (againstComputer && gameState.currentPlayer === 'black') {
        setTimeout(computerMove, 800);
    }
}

// Создание начальной доски
function createInitialBoard() {
    const board = Array(8).fill().map(() => Array(8).fill(null));
    
    // Расстановка шашек
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                if (row < 3) board[row][col] = { type: 'black', king: false };
                else if (row > 4) board[row][col] = { type: 'white', king: false };
            }
        }
    }
    
    return board;
}

// Отрисовка доски
function renderBoard() {
    gameElements.board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            
            const piece = gameState.board[row][col];
            if (piece) {
                const pieceElement = document.createElement('img');
                pieceElement.className = 'piece';
                pieceElement.src = `images/${piece.type}-${piece.king ? 'king' : 'piece'}.png`;
                pieceElement.alt = `${piece.type} ${piece.king ? 'king' : 'piece'}`;
                cell.appendChild(pieceElement);
            }
            
            gameElements.board.appendChild(cell);
        }
    }
    
    updateStatus();
}

// Обработка клика по клетке
function handleCellClick(row, col) {
    if (gameState.moveInProgress) return;
    
    const piece = gameState.board[row][col];
    
    // Выбор шашки
    if (!gameState.selectedPiece && piece && piece.type === gameState.currentPlayer) {
        gameState.selectedPiece = { row, col };
        highlightCell(row, col, true);
        playSound('click');
        return;
    }
    
    // Если шашка уже выбрана
    if (gameState.selectedPiece) {
        const { row: fromRow, col: fromCol } = gameState.selectedPiece;
        highlightCell(fromRow, fromCol, false);
        
        // Попытка хода
        if (isValidMove(fromRow, fromCol, row, col)) {
            makeMove(fromRow, fromCol, row, col);
        } else {
            playSound('click');
        }
        
        gameState.selectedPiece = null;
    }
}

// Подсветка клетки
function highlightCell(row, col, highlight) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    const piece = cell.querySelector('.piece');
    
    if (piece) {
        piece.classList.toggle('selected', highlight);
    }
}

// Проверка хода
function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState.board[fromRow][fromCol];
    if (!piece) return false;
    
    // Целевая клетка должна быть пустой
    if (gameState.board[toRow][toCol]) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Движение только по диагонали
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    if (piece.king) {
        const dirR = Math.sign(rowDiff);
        const dirC = Math.sign(colDiff);
        let enemyFound = null;
        let enemyPos = null;

        // Проверяем все клетки по пути
        for (let dist = 1; dist < Math.abs(rowDiff); dist++) {
            const r = fromRow + dist * dirR;
            const c = fromCol + dist * dirC;
            
            if (!inBounds(r, c)) return false;
            
            const p = gameState.board[r][c];
            if (p) {
                if (p.type === piece.type) return false; // Нельзя прыгать через своих
                if (enemyFound) return false; // Уже нашли врага - второго быть не должно
                enemyFound = p;
                enemyPos = { row: r, col: c };
            }
        }

        // Если есть взятие
        if (enemyFound) {
            // Проверяем, что после врага есть пустые клетки до конечной позиции
            // Дамка должна остановиться сразу за сбитой шашкой
            const enemyDist = Math.max(Math.abs(enemyPos.row - fromRow), Math.abs(enemyPos.col - fromCol));
            const requiredDist = enemyDist + 1;
            
            if (Math.abs(rowDiff) !== requiredDist || Math.abs(colDiff) !== requiredDist) {
                return false;
            }
            
            // Проверяем, нет ли обязательных взятий с большим количеством шашек
            if (hasCaptures(piece.type)) {
                const maxCaptures = countMaxCaptures(fromRow, fromCol);
                if (maxCaptures > 1) return false;
            }
            
            return true;
        }
        
        // Если нет взятий, разрешаем ход только если нет обязательных взятий
        return !hasCaptures(piece.type);
    } else {
        // Логика для обычной шашки
        const forwardDir = piece.type === 'white' ? -1 : 1;

        // Обычный ход без взятия
        if (Math.abs(rowDiff) === 1 && rowDiff === forwardDir && Math.abs(colDiff) === 1) {
            return !hasCaptures(piece.type);
        }

        // Ход со взятием
        if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
            const midRow = fromRow + rowDiff / 2;
            const midCol = fromCol + colDiff / 2;
            const midPiece = gameState.board[midRow][midCol];
            
            // Между начальной и конечной позицией должна быть шашка противника
            if (!midPiece || midPiece.type === piece.type) return false;
            
            // Проверяем, нет ли обязательных взятий с большим количеством шашек
            if (hasCaptures(piece.type)) {
                const maxCaptures = countMaxCaptures(fromRow, fromCol);
                if (maxCaptures > 1) return false;
            }
            
            return true;
        }

        return false;
    }
}

// Вспомогательная функция для подсчета максимального количества взятий
function countMaxCaptures(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return 0;

    if (piece.king) {
        let maxCaptures = 0;
        for (const { r: dr, c: dc } of DIRECTIONS.king) {
            let enemyFound = false;
            for (let dist = 1; dist < BOARD_SIZE; dist++) {
                const r = row + dr * dist;
                const c = col + dc * dist;
                if (!inBounds(r, c)) break;

                const p = gameState.board[r][c];
                if (p) {
                    if (p.type === piece.type) break;
                    if (p.type !== piece.type && !enemyFound) {
                        enemyFound = true;
                        // Проверяем есть ли место за вражеской шашкой
                        for (let d2 = dist + 1; d2 < BOARD_SIZE; d2++) {
                            const r2 = row + dr * d2;
                            const c2 = col + dc * d2;
                            if (!inBounds(r2, c2)) break;
                            if (!gameState.board[r2][c2]) {
                                // Рекурсивно проверяем продолжение взятия
                                const captures = 1 + countMaxCaptures(r2, c2);
                                if (captures > maxCaptures) maxCaptures = captures;
                                break;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        return maxCaptures;
    } else {
        // Для обычной шашки
        let maxCaptures = 0;
        const dirs = piece.type === 'white' ? 
            [{ r: -1, c: -1 }, { r: -1, c: 1 }] : 
            [{ r: 1, c: -1 }, { r: 1, c: 1 }];

        for (const { r: dr, c: dc } of dirs) {
            const enemyR = row + dr;
            const enemyC = col + dc;
            const landR = row + 2 * dr;
            const landC = col + 2 * dc;

            if (inBounds(enemyR, enemyC) && inBounds(landR, landC)) {
                const enemyPiece = gameState.board[enemyR][enemyC];
                if (enemyPiece && enemyPiece.type !== piece.type && !gameState.board[landR][landC]) {
                    // Рекурсивно проверяем продолжение взятия
                    const captures = 1 + countMaxCaptures(landR, landC);
                    if (captures > maxCaptures) maxCaptures = captures;
                }
            }
        }
        return maxCaptures;
    }
}

function hasCaptures(type) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.type === type) {
                if (canCapture(row, col)) {
                    return true;
                }
            }
        }
    }
    return false;
}


// Универсальная анимация движения шашки (обычной или дамки)
function animateMove(fromRow, fromCol, toRow, toCol, capturedPieces, isKing, callback) {
    const cellFrom = document.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const cellTo = document.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
    
    if (!cellFrom || !cellTo) {
        console.error('Не найдены клетки для анимации');
        if (callback) callback();
        return;
    }

    // Удаляем шашки с доски сразу
    const pieceImg = cellFrom.querySelector('.piece');
    if (pieceImg) {
        pieceImg.remove();
    }
    
    // Удаляем сбитые шашки
    capturedPieces.forEach(({ row, col }) => {
        const capturedCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const capturedPiece = capturedCell?.querySelector('.piece');
        if (capturedPiece) capturedPiece.remove();
    });

    // Создаем новый элемент для анимации
    const newPiece = document.createElement('img');
    newPiece.className = 'piece moving-piece';
    newPiece.src = `images/${gameState.board[toRow][toCol].type}-${isKing ? 'king' : 'piece'}.png`;
    newPiece.alt = `${gameState.board[toRow][toCol].type} ${isKing ? 'king' : 'piece'}`;
    
    // Позиционирование
    const fromRect = cellFrom.getBoundingClientRect();
    const toRect = cellTo.getBoundingClientRect();
    
    newPiece.style.position = 'absolute';
    newPiece.style.left = `${fromRect.left}px`;
    newPiece.style.top = `${fromRect.top}px`;
    newPiece.style.transition = 'transform 0.3s ease';
    newPiece.style.zIndex = '1000';
    
    document.body.appendChild(newPiece);
    
    // Запускаем анимацию
    setTimeout(() => {
        newPiece.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`;
    }, 10);

    // Завершение анимации
    setTimeout(() => {
        newPiece.remove();
        
        // Восстанавливаем шашку на новой позиции
        const finalPiece = document.createElement('img');
        finalPiece.className = 'piece';
        finalPiece.src = `images/${gameState.board[toRow][toCol].type}-${isKing ? 'king' : 'piece'}.png`;
        finalPiece.alt = `${gameState.board[toRow][toCol].type} ${isKing ? 'king' : 'piece'}`;
        cellTo.appendChild(finalPiece);
        
        // Воспроизводим звук
        playSound(capturedPieces.length ? 'capture' : 'move');
        
        if (callback) callback();
    }, 300);
}

function processMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces) {
    console.log('Обработка завершения хода...');
    
    // Проверяем, что шашка на месте
    const piece = gameState.board[toRow]?.[toCol];
    if (!piece) {
        console.error('Шашка не найдена в целевой позиции');
        completeMove();
        return;
    }

    // Удаляем сбитые шашки из состояния игры
    capturedPieces.forEach(({ row, col }) => {
        if (gameState.board[row]?.[col]) {
            gameState.board[row][col] = null;
        }
    });

    // Проверяем превращение в дамку
    if (!piece.king && ((piece.type === 'white' && toRow === 0) || 
                       (piece.type === 'black' && toRow === 7))) {
        piece.king = true;
        console.log(`Шашка превратилась в дамку на [${toRow},${toCol}]`);
    }

    // Проверяем возможность продолжения взятия
    if (capturedPieces.length > 0) {
        const canContinue = piece.king 
            ? canKingContinueCapture(toRow, toCol)
            : canContinueCapture(toRow, toCol);
        
        console.log(`Можно продолжить рубить: ${canContinue}`);
        
        if (canContinue) {
            gameState.captureChain = { row: toRow, col: toCol };
            highlightCell(toRow, toCol, true);
            gameState.moveInProgress = false;
            
            // Для компьютера сразу продолжаем цепочку
            if (gameState.againstComputer && gameState.currentPlayer === 'black') {
                setTimeout(computerContinueCapture, 800);
            }
            return;
        }
    }
    
    completeMove();
}

function processKingMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces) {
    const piece = gameState.board[fromRow][fromCol];

    // Удаляем съеденные шашки из состояния игры
    capturedPieces.forEach(({ row, col }) => {
        gameState.board[row][col] = null;
    });

    // Перемещаем дамку
    gameState.board[fromRow][fromCol] = null;
    gameState.board[toRow][toCol] = piece;

    // Перерисовываем дамку
    redrawPiece(toRow, toCol, piece);

    // Проверяем возможность продолжения взятия
    if (capturedPieces.length > 0 && canKingContinueCapture(toRow, toCol)) {
        gameState.captureChain = { row: toRow, col: toCol };
        highlightCell(toRow, toCol, true);
        gameState.moveInProgress = false;
        return;
    }

    completeMove();
}

function redrawPiece(row, col, piece) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.innerHTML = ''; // Очищаем клетку
    
    if (piece) {
        const pieceElement = document.createElement('img');
        pieceElement.className = 'piece';
        pieceElement.src = `images/${piece.type}-${piece.king ? 'king' : 'piece'}.png`;
        pieceElement.alt = `${piece.type} ${piece.king ? 'king' : 'piece'}`;
        cell.appendChild(pieceElement);
    }
}



const moveAudio = new Audio('sounds/move.wav');
const captureAudio = new Audio('sounds/capture.wav');

function playSound(type) {
    if (!settings.sound) return;

    const sound = {
        'click': gameElements.clickSound,
        'move': moveAudio,
        'capture': captureAudio
    }[type];

    if (sound) {
        sound.currentTime = 0;
        sound.volume = type === 'click' ? 0.3 : 1;
        sound.play();
    }
}



function makeMove(fromRow, fromCol, toRow, toCol) {
    console.log(`Попытка сделать ход с [${fromRow},${fromCol}] на [${toRow},${toCol}]`);
    
    if (gameState.moveInProgress) {
        console.log('Движение уже в процессе');
        return;
    }
    gameState.moveInProgress = true;

    const piece = gameState.board[fromRow][fromCol];
    if (!piece) {
        console.log('На начальной позиции нет шашки');
        gameState.moveInProgress = false;
        return;
    }

    console.log(`Тип шашки: ${piece.type}, ${piece.king ? 'дамка' : 'обычная'}`);
    
    let capturedPieces = [];
    const isKing = piece.king;

    // Определяем сбитые шашки
    if (isKing) {
        console.log('Обработка хода дамки');
        const dirR = Math.sign(toRow - fromRow);
        const dirC = Math.sign(toCol - fromCol);
        let enemyFound = false;

        for (let dist = 1; dist < Math.abs(toRow - fromRow); dist++) {
            const r = fromRow + dist * dirR;
            const c = fromCol + dist * dirC;
            if (!inBounds(r, c)) break;

            const p = gameState.board[r][c];
            if (p && p.type !== piece.type && !enemyFound) {
                console.log(`Найдена шашка противника на [${r},${c}]`);
                capturedPieces.push({ row: r, col: c });
                enemyFound = true;
            }
        }
    } else {
        // Для обычной шашки
        if (Math.abs(toRow - fromRow) === 2) {
            const midRow = (fromRow + toRow) >> 1;
            const midCol = (fromCol + toCol) >> 1;
            const midPiece = gameState.board[midRow][midCol];
            
            if (midPiece && midPiece.type !== piece.type) {
                console.log(`Найдена шашка противника на [${midRow},${midCol}]`);
                capturedPieces.push({ row: midRow, col: midCol });
            }
        }
    }

    // Создаем копию шашки для анимации
    const pieceCopy = {...piece};
    
    // Немедленно обновляем состояние доски
    gameState.board[fromRow][fromCol] = null;
    gameState.board[toRow][toCol] = pieceCopy;
    
    // Удаляем сбитые шашки
    capturedPieces.forEach(({row, col}) => {
        gameState.board[row][col] = null;
    });

    // Проверяем превращение в дамку
    if (!pieceCopy.king && ((pieceCopy.type === 'white' && toRow === 0) || 
                           (pieceCopy.type === 'black' && toRow === 7))) {
        pieceCopy.king = true;
        console.log(`Шашка превратилась в дамку на [${toRow},${toCol}]`);
    }

    // Сохраняем информацию о ходе
    gameState.lastMove = {
        fromRow, fromCol,
        toRow, toCol,
        capturedPieces,
        pieceType: pieceCopy.type,
        wasKing: piece.king // Сохраняем исходное состояние (до превращения)
    };

    console.log(`Количество сбитых шашек: ${capturedPieces.length}`);
    
    // Запускаем анимацию с обновленным состоянием
    animateMove(fromRow, fromCol, toRow, toCol, capturedPieces, pieceCopy.king, () => {
        console.log('Анимация завершена, проверяем продолжение взятия...');
        
        // Проверяем возможность продолжения взятия
        if (capturedPieces.length > 0) {
            const canContinue = pieceCopy.king 
                ? canKingContinueCapture(toRow, toCol)
                : canContinueCapture(toRow, toCol);
            
            console.log(`Можно продолжить рубить: ${canContinue}`);
            
            if (canContinue) {
                gameState.captureChain = { row: toRow, col: toCol };
                highlightCell(toRow, toCol, true);
                
                // Если это компьютер, сразу продолжаем цепочку
                if (gameState.againstComputer && gameState.currentPlayer === 'black') {
                    setTimeout(computerContinueCapture, 800);
                }
                
                gameState.moveInProgress = false;
                return;
            }
        }
        
        // Если продолжения нет, завершаем ход
        completeMove();
    });
}




// Обработка завершения обычного хода
function processMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces) {
    console.log('Обработка завершения хода...');
    
    // Проверяем, что шашка на месте
    const piece = gameState.board[toRow]?.[toCol];
    if (!piece) {
        console.error('Шашка не найдена в целевой позиции');
        completeMove();
        return;
    }

    // Удаляем сбитые шашки из состояния игры
    capturedPieces.forEach(({ row, col }) => {
        if (gameState.board[row]?.[col]) {
            gameState.board[row][col] = null;
        }
    });

    // Проверяем превращение в дамку
    if (!piece.king && ((piece.type === 'white' && toRow === 0) || 
                       (piece.type === 'black' && toRow === 7))) {
        piece.king = true;
        console.log(`Шашка превратилась в дамку на [${toRow},${toCol}]`);
    }

    // Проверяем возможность продолжения взятия
    if (capturedPieces.length > 0) {
        const canContinue = piece.king 
            ? canKingContinueCapture(toRow, toCol)
            : canContinueCapture(toRow, toCol);
        
        console.log(`Можно продолжить рубить: ${canContinue}`);
        
        if (canContinue) {
            gameState.captureChain = { row: toRow, col: toCol };
            highlightCell(toRow, toCol, true);
            gameState.moveInProgress = false;
            
            // Для компьютера сразу продолжаем цепочку
            if (gameState.againstComputer && gameState.currentPlayer === 'black') {
                setTimeout(computerContinueCapture, 800);
            }
            return;
        }
    }
    
    completeMove();
}

// Обработка завершения хода дамки
function processKingMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces) {
    const piece = gameState.board[fromRow][fromCol];

    // Удаляем сбитые шашки
    capturedPieces.forEach(({ row, col }) => {
        gameState.board[row][col] = null;
    });

    // Перемещаем дамку
    gameState.board[fromRow][fromCol] = null;
    gameState.board[toRow][toCol] = piece;

    redrawPiece(toRow, toCol, piece);

    // Проверяем возможность продолжения взятия
    if (canKingContinueCapture(toRow, toCol)) {
        gameState.captureChain = { row: toRow, col: toCol };
        highlightCell(toRow, toCol, true);
        gameState.moveInProgress = false;
        return;
    }

    completeMove();
}

function redrawPiece(row, col, piece) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.innerHTML = '';
    const newPiece = document.createElement('img');
    newPiece.className = 'piece piece-move';
    newPiece.src = `images/${piece.type}-${piece.king ? 'king' : 'piece'}.png`;
    newPiece.alt = `${piece.type} ${piece.king ? 'king' : 'piece'}`;
    cell.appendChild(newPiece);
}

function completeMove() {
    console.log('Завершение хода...');
    
    // Добавляем очки за взятие (если были)
    if (gameState.lastMove?.capturedPieces?.length) {
        addScore(gameState.currentPlayer, gameState.lastMove.capturedPieces.length);
    }
    
    // Проверяем, окончена ли игра
    if (isGameOver()) {
        console.log('Игра окончена');
        showGameOver();
        return;
    }

    // Сбрасываем цепочку взятий и переключаем игрока
    gameState.captureChain = null;
    gameState.currentPlayer = (gameState.currentPlayer === 'white') ? 'black' : 'white';
    updateStatus();
    gameState.moveInProgress = false;

    // Если игра с компьютером и сейчас его ход
    if (gameState.againstComputer && gameState.currentPlayer === 'black') {
        setTimeout(computerMove, 800);
    }
}





function isGameOver() {
    // Проверяем есть ли у текущего игрока доступные ходы
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = gameState.board[r][c];
            if (piece && piece.type === gameState.currentPlayer) {
                const { moves, captures } = findMovesAndCaptures(r, c);
                if (moves.length > 0 || captures.length > 0) return false;
            }
        }
    }
    return true;
}

// Показать экран завершения игры
function showGameOver() {
    stopTimer();
    
    const winner = gameState.currentPlayer === 'white' ? 'Чёрные' : 'Белые';
    const winnerScore = gameState.currentPlayer === 'white' ? gameState.scores.black : gameState.scores.white;
    const timePlayed = `${String(gameState.timer.minutes).padStart(2, '0')}:${String(gameState.timer.seconds).padStart(2, '0')}`;
    
    const message = `Игра окончена!\nПобедили ${winner}!\n\nСчёт: ${winnerScore}\nВремя игры: ${timePlayed}`;
    
    alert(message);
    showScreen('menu');
}


// Проверка возможности продолжения взятия дамкой
// Проверка возможности продолжения взятия дамкой
function canKingContinueCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece || !piece.king) {
        console.log(`На позиции [${row},${col}] нет дамки`);
        return false;
    }

    console.log(`--- Проверка продолжения взятия для дамки [${row},${col}] ---`);
    
    for (const { r: dr, c: dc } of DIRECTIONS.king) {
        console.log(`Проверяем направление: [${dr},${dc}]`);
        
        let enemyFound = null;
        let enemyPos = null;
        
        for (let dist = 1; dist < BOARD_SIZE; dist++) {
            const r = row + dr * dist;
            const c = col + dc * dist;
            
            if (!inBounds(r, c)) {
                console.log(`  [${r},${c}] - за пределами доски`);
                break;
            }

            const cellPiece = gameState.board[r][c];
            console.log(`  Клетка [${r},${c}]: ${cellPiece ? cellPiece.type + (cellPiece.king ? ' дамка' : ' шашка') : 'пусто'}`);
            
            if (!enemyFound) {
                if (cellPiece) {
                    if (cellPiece.type === piece.type) {
                        console.log('    Своя шашка - прерываем направление');
                        break;
                    } else {
                        console.log('    Найден противник');
                        enemyFound = cellPiece;
                        enemyPos = { r, c };
                    }
                }
            } else {
                if (!cellPiece) {
                    console.log(`    Пустая клетка после врага - можно рубить до [${r},${c}]`);
                    return true;
                } else {
                    console.log('    Клетка занята после врага - нельзя рубить');
                    break;
                }
            }
        }
    }
    
    console.log('--- Продолжение взятия не найдено ---');
    return false;
}

// Проверка взятия для обычной шашки и дамки
function canCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return false;

    console.log(`Проверка взятия для [${row},${col}] (${piece.type} ${piece.king ? 'дамка' : 'шашка'})`);

    const directions = piece.king ? DIRECTIONS.king : DIRECTIONS.any;

    for (const { r: dr, c: dc } of directions) {
        if (piece.king) {
            console.log(` Направление: [${dr},${dc}]`);
            let enemyFound = false;

            for (let dist = 1; dist < BOARD_SIZE; dist++) {
                const r = row + dr * dist;
                const c = col + dc * dist;

                if (!inBounds(r, c)) {
                    console.log(`  [${r},${c}] - за границей`);
                    break;
                }

                const cellPiece = gameState.board[r][c];
                console.log(`  Клетка [${r},${c}]: ${cellPiece ? cellPiece.type + (cellPiece.king ? ' дамка' : ' шашка') : 'пусто'}`);

                if (!enemyFound) {
                    if (cellPiece) {
                        if (cellPiece.type === piece.type) {
                            console.log('    Своя шашка - стоп');
                            break;
                        } else {
                            console.log('    Найден противник');
                            enemyFound = true;
                        }
                    }
                } else {
                    if (!cellPiece) {
                        console.log('    Пусто после врага - можно рубить');
                        return true;
                    } else {
                        console.log('    Клетка занята после врага - нельзя рубить');
                        break;
                    }
                }
            }
        } else {
            const enemyR = row + dr;
            const enemyC = col + dc;
            const landR = row + 2 * dr;
            const landC = col + 2 * dc;

            if (inBounds(enemyR, enemyC) && inBounds(landR, landC)) {
                const enemyPiece = gameState.board[enemyR][enemyC];
                const landingCell = gameState.board[landR][landC];

                if (enemyPiece && enemyPiece.type !== piece.type && !landingCell) {
                    console.log(`Можно рубить через [${enemyR},${enemyC}] на [${landR},${landC}]`);
                    return true;
                }
            }
        }
    }

    console.log('Возможных взятий не найдено');
    return false;
}





function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}



// Проверка взятий дамкой
function canKingCapture(row, col) {
  const piece = gameState.board[row][col];
  if (!piece || !piece.king) return false;

  for (const { r: dr, c: dc } of DIRECTIONS.king) {
    let enemyFound = false;
    for (let dist = 1; dist < BOARD_SIZE; dist++) {
      const rCheck = row + dr * dist;
      const cCheck = col + dc * dist;
      if (!inBounds(rCheck, cCheck)) break;

      const cellPiece = gameState.board[rCheck][cCheck];
      if (!enemyFound) {
        if (cellPiece && cellPiece.type === piece.type) break;
        if (cellPiece && cellPiece.type !== piece.type) enemyFound = true;
      } else {
        if (!cellPiece) return true; // есть возможность взятия после врага
        else break;
      }
    }
  }
  return false;
}


// --- Поиск ходов и взятий для шашки (используется ИИ) ---
function findMovesAndCaptures(row, col) {
  const piece = gameState.board[row][col];
  const moves = [];
  const captures = [];
  if (!piece) return { moves, captures };

  const dirs = piece.king ? DIRECTIONS.king : DIRECTIONS.any;

  for (const { r: dr, c: dc } of dirs) {
    if (piece.king) {
      let enemyFound = false;
      for (let dist = 1; dist < BOARD_SIZE; dist++) {
        const rCheck = row + dr * dist;
        const cCheck = col + dc * dist;
        if (!inBounds(rCheck, cCheck)) break;

        const cellPiece = gameState.board[rCheck][cCheck];
        if (!enemyFound) {
          if (!cellPiece) {
            if (!hasCaptures(piece.type)) {
              moves.push({ fromRow: row, fromCol: col, toRow: rCheck, toCol: cCheck });
            }
          } else if (cellPiece.type === piece.type) {
            break;
          } else {
            enemyFound = true;
          }
        } else {
          if (!cellPiece) {
            captures.push({ fromRow: row, fromCol: col, toRow: rCheck, toCol: cCheck });
          } else {
            break;
          }
        }
      }
    } else {
      const newRow = row + dr;
      const newCol = col + dc;

      if (inBounds(newRow, newCol) && !gameState.board[newRow][newCol]) {
        // Добавляем обычный ход только если нет обязательных взятий
        if (!hasCaptures(piece.type)) {
          moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
        }
      }

      // Проверка взятия
      const enemyRow = row + dr;
      const enemyCol = col + dc;
      const landingRow = row + 2 * dr;
      const landingCol = col + 2 * dc;

      if (
        inBounds(enemyRow, enemyCol) &&
        inBounds(landingRow, landingCol)
      ) {
        const enemyPiece = gameState.board[enemyRow][enemyCol];
        if (enemyPiece && enemyPiece.type !== piece.type && !gameState.board[landingRow][landingCol]) {
          captures.push({ fromRow: row, fromCol: col, toRow: landingRow, toCol: landingCol });
        }
      }
    }
  }

  return { moves, captures };
}


// --- Обработка клика игрока ---
function handleCellClick(row, col) {
  if (gameState.moveInProgress) return;
  if (gameState.againstComputer && gameState.currentPlayer !== 'white') return;

  // --- Цепочка рубок ---
  if (gameState.captureChain) {
    const { row: cr, col: cc } = gameState.captureChain;

    if (row === cr && col === cc) return;

    const clickedPiece = gameState.board[row][col];
    if (clickedPiece && clickedPiece.type !== gameState.currentPlayer) return;

    const piece = gameState.board[cr][cc];
    if (!piece) return;

    const rowDiff = row - cr;
    const colDiff = col - cc;

    if (piece.king) {
      // --- Цепочка взятий дамкой ---
      const dirR = Math.sign(rowDiff);
      const dirC = Math.sign(colDiff);
      let r = cr + dirR;
      let c = cc + dirC;
      let enemy = null;

      while (inBounds(r, c) && (r !== row || c !== col)) {
        const p = gameState.board[r][c];
        if (p) {
          if (p.type === piece.type) break;
          if (!enemy) {
            enemy = { row: r, col: c };
          } else {
            enemy = null;
            break;
          }
        }
        r += dirR;
        c += dirC;
      }

      if (enemy && !gameState.board[row][col]) {
        makeMove(cr, cc, row, col);
      }
    } else {
      // --- Цепочка взятий обычной шашкой ---
      if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
        const midRow = cr + rowDiff / 2;
        const midCol = cc + colDiff / 2;
        const midPiece = gameState.board[midRow][midCol];

        if (midPiece && midPiece.type !== piece.type && !gameState.board[row][col]) {
          makeMove(cr, cc, row, col);
        }
      }
    }
    return;
  }

  // --- Выбор шашки ---
  const piece = gameState.board[row][col];
  if (piece && piece.type === gameState.currentPlayer) {
    if (hasCaptures(gameState.currentPlayer) && !canCapture(row, col)) return;

    clearSelection();
    highlightCell(row, col, true);
    gameState.selectedPiece = { row, col };
  }

  // --- Попытка хода по пустой клетке ---
  else if (!piece && gameState.selectedPiece) {
    const { row: fromRow, col: fromCol } = gameState.selectedPiece;

    if (hasCaptures(gameState.currentPlayer)) {
      const rowDiff = row - fromRow;
      const colDiff = col - fromCol;

      const selectedPiece = gameState.board[fromRow][fromCol];
      if (!selectedPiece) return;

      if (!selectedPiece.king) {
        // обычная шашка должна прыгать через 2 клетки
        if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return;
      }
    }

    if (isValidMove(fromRow, fromCol, row, col)) {
      makeMove(fromRow, fromCol, row, col);
      gameState.selectedPiece = null;
      clearSelection();
    }
  }
}

function clearSelection() {
  document.querySelectorAll('.piece.selected').forEach(el => el.classList.remove('selected'));
}

// --- Ход компьютера ---
async function computerMove() {
  if (gameState.moveInProgress) return;

  // Если в процессе цепочки взятий — продолжить рубить
  if (gameState.captureChain) {
    await computerContinueCapture();
    return;
  }

  const allMoves = [];
  const allCaptures = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = gameState.board[r][c];
      if (p && p.type === 'black') {
        const { moves, captures } = findMovesAndCaptures(r, c);
        allMoves.push(...moves);
        allCaptures.push(...captures);
      }
    }
  }

  let moveToMake = null;

  if (allCaptures.length) {
    // Берём ход с захватом
    moveToMake = allCaptures[0];
  } else if (allMoves.length) {
    if (gameState.difficulty === 'easy') {
      moveToMake = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else {
      // Предпочитаем ходы к центру доски
      const centerMoves = allMoves.filter(m => {
        const distBefore = Math.abs(m.fromRow - 3.5) + Math.abs(m.fromCol - 3.5);
        const distAfter = Math.abs(m.toRow - 3.5) + Math.abs(m.toCol - 3.5);
        return distAfter < distBefore;
      });
      moveToMake = centerMoves.length
        ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
        : allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  if (moveToMake) {
    // Сделать ход и дождаться завершения (анимации, обработки)
    await new Promise(resolve => {
      function onMoveComplete() {
        document.removeEventListener('moveComplete', onMoveComplete);
        resolve();
      }
      document.addEventListener('moveComplete', onMoveComplete);
      makeMove(moveToMake.fromRow, moveToMake.fromCol, moveToMake.toRow, moveToMake.toCol);
    });

    // После хода проверить, есть ли продолжение цепочки взятий
    if (gameState.captureChain) {
      // Если есть, продолжить рубить
      await computerMove();
    } else {
      // Ход окончен, переключаем ход на белых
      gameState.currentPlayer = 'white';
      updateStatus();
      gameState.moveInProgress = false;
    }
  } else {
    alert('Победили белые! Компьютер не может ходить.');
    showScreen('menu');
  }
}


// --- Продолжение цепочки рубки компьютера ---
// --- Продолжение цепочки рубки компьютера ---
function computerContinueCapture() {
    if (!gameState.captureChain) return;

    const { row, col } = gameState.captureChain;
    const piece = gameState.board[row][col];
    if (!piece) return;

    const { captures } = findMovesAndCaptures(row, col);
    if (captures.length === 0) {
        endComputerTurn();
        return;
    }

    // Выбираем взятие с максимальным количеством последующих взятий
    let bestCapture = null;
    let maxAdditionalCaptures = -1;

    for (const capture of captures) {
        // Временное состояние для симуляции
        const tempState = JSON.parse(JSON.stringify(gameState));
        
        // Симулируем ход
        tempState.board[capture.toRow][capture.toCol] = tempState.board[row][col];
        tempState.board[row][col] = null;
        
        // Удаляем сбитую шашку
        if (piece.king) {
            const dirR = Math.sign(capture.toRow - row);
            const dirC = Math.sign(capture.toCol - col);
            for (let d = 1; d < Math.max(Math.abs(capture.toRow-row), Math.abs(capture.toCol-col)); d++) {
                const r = row + d * dirR;
                const c = col + d * dirC;
                if (tempState.board[r][c] && tempState.board[r][c].type !== piece.type) {
                    tempState.board[r][c] = null;
                    break;
                }
            }
        } else {
            const midRow = (row + capture.toRow) >> 1;
            const midCol = (col + capture.toCol) >> 1;
            tempState.board[midRow][midCol] = null;
        }

        // Проверяем продолжения
        const additionalCaptures = findMovesAndCaptures(capture.toRow, capture.toCol).captures.length;
        
        if (additionalCaptures > maxAdditionalCaptures) {
            maxAdditionalCaptures = additionalCaptures;
            bestCapture = capture;
        }
    }

    if (bestCapture) {
        makeMove(bestCapture.fromRow, bestCapture.fromCol, 
                bestCapture.toRow, bestCapture.toCol);
    } else {
        endComputerTurn();
    }
}

function canContinueCapture(row, col) {
    const piece = gameState.board[row]?.[col];
    if (!piece || piece.king) return false;

    console.log(`Проверка продолжения взятия для обычной шашки на [${row},${col}]`);

    const directions = [
        { r: -2, c: -2 }, { r: -2, c: 2 },
        { r: 2, c: -2 }, { r: 2, c: 2 }
    ];

    for (const { r: dr, c: dc } of directions) {
        const toRow = row + dr;
        const toCol = col + dc;
        const midRow = row + dr/2;
        const midCol = col + dc/2;

        if (inBounds(toRow, toCol) && inBounds(midRow, midCol)) {
            const midPiece = gameState.board[midRow][midCol];
            const toPiece = gameState.board[toRow][toCol];
            
            if (midPiece && midPiece.type !== piece.type && !toPiece) {
                console.log(`Можно рубить через [${midRow},${midCol}] на [${toRow},${toCol}]`);
                return true;
            }
        }
    }
    return false;
}

// --- Обновление статуса игры ---
function updateStatus() {
  gameElements.status.textContent = `Ход игрока: ${gameState.currentPlayer === 'white' ? 'Белые' : 'Чёрные'}`;
}
function applyBoardStyle() {
    const board = gameElements.board;
    board.classList.remove('board-classic', 'board-wood', 'board-modern');

    switch(settings.boardStyle) {
        case 'classic':
            board.classList.add('board-classic');
            break;
        case 'wood':
            board.classList.add('board-wood');
            break;
        case 'modern':
            board.classList.add('board-modern');
            break;
    }
}



// Загрузка настроек
function loadSettings() {
    const savedSettings = localStorage.getItem('checkersSettings');
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
    }
    
    document.getElementById('sound-toggle').checked = settings.sound;
    document.getElementById('board-style').value = settings.boardStyle;
    document.getElementById('difficulty').value = settings.difficulty;

    applyBoardStyle();
}

function saveSettings() {
    settings.sound = document.getElementById('sound-toggle').checked;
    settings.boardStyle = document.getElementById('board-style').value;
    settings.difficulty = document.getElementById('difficulty').value;
    
    localStorage.setItem('checkersSettings', JSON.stringify(settings));
    alert('Настройки сохранены!');
    applyBoardStyle();
    showScreen('menu');
}


// Запуск
init();
