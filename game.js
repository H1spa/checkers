// DOM элементы
const BOARD_SIZE = 8;
const DIRECTIONS = {
  king: [{ r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }],
  black: [{ r: 1, c: -1 }, { r: 1, c: 1 }],
  white: [{ r: -1, c: -1 }, { r: -1, c: 1 }]
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
    captureChain: null // Для цепочек рубок у бота
};

// Инициализация игры
function init() {
    setupEventListeners();
    loadSettings();
    showScreen('menu');
    playSound('click');
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
        captureChain: null
    };
    
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

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Ход должен быть по диагонали
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    // Конечная клетка должна быть пустой
    if (gameState.board[toRow][toCol]) return false;

    // === ДАМКА ===
    if (piece.king) {
        const dirR = Math.sign(rowDiff);
        const dirC = Math.sign(colDiff);
        let enemyFound = null;
        let lastEnemyPos = null;

        for (let dist = 1; dist < Math.abs(rowDiff); dist++) {
            const r = fromRow + dist * dirR;
            const c = fromCol + dist * dirC;

            if (!inBounds(r, c)) return false;

            const cellPiece = gameState.board[r][c];
            if (cellPiece) {
                if (cellPiece.type === piece.type) return false; // нельзя через своих

                if (enemyFound) return false; // уже есть враг — второго быть не должно

                enemyFound = cellPiece;
                lastEnemyPos = { row: r, col: c };
            }
        }

        if (enemyFound) {
            // Проверим, что to находится после врага в том же направлении
            const afterEnemyR = lastEnemyPos.row + dirR;
            const afterEnemyC = lastEnemyPos.col + dirC;

            if (!inBounds(afterEnemyR, afterEnemyC)) return false;
            if (Math.sign(toRow - lastEnemyPos.row) !== dirR ||
                Math.sign(toCol - lastEnemyPos.col) !== dirC) return false;

            return true;
        }

        // Без рубки дамка может двигаться только если нет других возможных взятий
        return !hasCaptures(piece.type);
    }

    // === ОБЫЧНАЯ ШАШКА ===

    const direction = piece.type === 'black' ? 1 : -1;

    // Простой ход на 1 клетку по диагонали
    if (rowDiff === direction && Math.abs(colDiff) === 1) {
        return !hasCaptures(piece.type); // Только если нет обязательных взятий
    }

    // Взятие через одну клетку
    if (rowDiff === 2 * direction && Math.abs(colDiff) === 2) {
        const midRow = fromRow + direction;
        const midCol = fromCol + Math.sign(colDiff);
        const enemyPiece = gameState.board[midRow][midCol];

        if (
            enemyPiece &&
            enemyPiece.type !== piece.type &&
            !gameState.board[toRow][toCol]
        ) {
            return true;
        }
    }

    return false;
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

function hasCaptures(playerColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = gameState.board[r][c];
            if (piece && piece.type === playerColor && canCapture(r, c)) {
                return true;
            }
        }
    }
    return false;
}

// Универсальная анимация движения шашки (обычной или дамки)
function animateMove(fromRow, fromCol, toRow, toCol, capturedPieces = [], isKing = false) {
    const cellFrom = document.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const cellTo = document.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
    const pieceImg = cellFrom.querySelector('.piece');
    if (!pieceImg) return;

    const clone = pieceImg.cloneNode(true);
    clone.classList.add('moving-piece');

    const fromRect = cellFrom.getBoundingClientRect();
    const toRect = cellTo.getBoundingClientRect();

    clone.style.setProperty('--tx', `${toRect.left - fromRect.left}px`);
    clone.style.setProperty('--ty', `${toRect.top - fromRect.top}px`);
    clone.style.left = `${fromRect.left + window.scrollX}px`;
    clone.style.top = `${fromRect.top + window.scrollY}px`;
    clone.style.position = 'absolute';
    clone.style.zIndex = '1000';

    document.body.appendChild(clone);
    pieceImg.remove();

    // Удаляем сбитые шашки сразу
    capturedPieces.forEach(({ row, col }) => {
        const capturedCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const capturedPiece = capturedCell?.querySelector('.piece');
        if (capturedPiece) capturedPiece.remove();
    });

    // Звук
    if (settings.sound) {
        const audio = new Audio(`sounds/${capturedPieces.length ? 'capture' : 'move'}.wav`);
        audio.volume = capturedPieces.length ? 1 : 0.5;
        audio.play();
    }

    setTimeout(() => {
        clone.remove();
        if (isKing) {
            processKingMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces);
        } else {
            processMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces);
        }
    }, 300);
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
    if (gameState.moveInProgress) return;
    gameState.moveInProgress = true;

    const piece = gameState.board[fromRow][fromCol];
    if (!piece) {
        gameState.moveInProgress = false;
        return;
    }

    let capturedPieces = [];
    const isKing = piece.king;

    if (isKing) {
        const dirR = Math.sign(toRow - fromRow);
        const dirC = Math.sign(toCol - fromCol);
        
        for (let dist = 1; dist < Math.abs(toRow - fromRow); dist++) {
            const r = fromRow + dist * dirR;
            const c = fromCol + dist * dirC;
            if (!inBounds(r, c)) break;
            
            const p = gameState.board[r][c];
            if (p && p.type !== piece.type) {
                capturedPieces.push({ row: r, col: c });
            }
        }
    } else {
        // Обычная шашка
        if (Math.abs(toRow - fromRow) === 2) {
            capturedPieces.push({
                row: (fromRow + toRow) >> 1,
                col: (fromCol + toCol) >> 1
            });
        }
    }

    animateMove(fromRow, fromCol, toRow, toCol, capturedPieces, isKing);
}



// Обработка завершения обычного хода
function processMoveCompletion(fromRow, fromCol, toRow, toCol, capturedPieces) {
    const piece = gameState.board[fromRow][fromCol];

    // Удаляем сбитые шашки
    capturedPieces.forEach(({ row, col }) => {
        gameState.board[row][col] = null;
    });

    gameState.board[fromRow][fromCol] = null;
    gameState.board[toRow][toCol] = piece;

    // Превращение в дамку
    if ((piece.type === 'white' && toRow === 0) || (piece.type === 'black' && toRow === 7)) {
        piece.king = true;
    }

    redrawPiece(toRow, toCol, piece);

    if (capturedPieces.length && canCapture(toRow, toCol)) {
        gameState.captureChain = { row: toRow, col: toCol };
        highlightCell(toRow, toCol, true);
        gameState.moveInProgress = false;
        return;
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
    gameState.captureChain = null;
    
    // Проверка окончания игры
    if (isGameOver()) {
        showGameOver();
        return;
    }
    
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    updateStatus();
    gameState.moveInProgress = false;

    if (gameState.againstComputer && gameState.currentPlayer === 'black') {
        setTimeout(computerMove, 100);
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

function showGameOver() {
    const winner = gameState.currentPlayer === 'white' ? 'Чёрные' : 'Белые';
    alert(`Игра окончена! Победили ${winner}!`);
    showScreen('menu');
}

// Проверка возможности продолжения взятия дамкой
function canKingContinueCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece || !piece.king) return false;

    for (const { r: dr, c: dc } of DIRECTIONS.king) {
        let enemyFound = false;
        for (let dist = 1; dist < BOARD_SIZE; dist++) {
            const r = row + dr * dist;
            const c = col + dc * dist;
            if (!inBounds(r, c)) break;

            const cellPiece = gameState.board[r][c];
            if (cellPiece) {
                if (cellPiece.type === piece.type) break;
                if (!enemyFound && cellPiece.type !== piece.type) {
                    enemyFound = true;
                    // Проверяем есть ли пустая клетка за врагом
                    for (let d2 = dist + 1; d2 < BOARD_SIZE; d2++) {
                        const r2 = row + dr * d2;
                        const c2 = col + dc * d2;
                        if (!inBounds(r2, c2)) break;
                        if (!gameState.board[r2][c2]) return true;
                        if (gameState.board[r2][c2]) break;
                    }
                }
            }
        }
    }
    return false;
}

// Проверка взятия для обычной шашки и дамки
function canCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return false;

    if (piece.king) {
        // Логика для дамки
        for (const { r: dr, c: dc } of DIRECTIONS.king) {
            let enemyFound = false;
            for (let dist = 1; dist < BOARD_SIZE; dist++) {
                const r = row + dr * dist;
                const c = col + dc * dist;
                if (!inBounds(r, c)) break;

                const cellPiece = gameState.board[r][c];

                if (cellPiece) {
                    if (cellPiece.type === piece.type) break; // Своя шашка — дальше нельзя

                    if (cellPiece.type !== piece.type && !enemyFound) {
                        enemyFound = true;
                        continue; // Проверим, есть ли пустая клетка дальше
                    } else {
                        break; // Уже нашли врага и теперь вторая фигура — нельзя
                    }
                } else {
                    if (enemyFound) {
                        return true; // Пустая клетка за врагом — можно рубить
                    }
                    // Просто пустая клетка, идём дальше
                }
            }
        }
        return false;
    } else {
        // Логика для обычной шашки
        const directions = piece.type === 'black'
            ? [{ r: 1, c: -1 }, { r: 1, c: 1 }]
            : [{ r: -1, c: -1 }, { r: -1, c: 1 }];

        for (const { r: dr, c: dc } of directions) {
            const enemyR = row + dr;
            const enemyC = col + dc;
            const landingR = row + 2 * dr;
            const landingC = col + 2 * dc;

            if (inBounds(enemyR, enemyC) && inBounds(landingR, landingC)) {
                const enemyPiece = gameState.board[enemyR][enemyC];
                const landingCell = gameState.board[landingR][landingC];

                if (
                    enemyPiece &&
                    enemyPiece.type !== piece.type &&
                    !landingCell
                ) {
                    return true; // Возможность захвата
                }
            }
        }
        return false;
    }
}




function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}



// Проверка взятий дамкой
function canKingContinueCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece || !piece.king) return false;

    for (const { r: dr, c: dc } of DIRECTIONS.king) {
        let enemyFound = false;

        for (let dist = 1; dist < BOARD_SIZE; dist++) {
            const r = row + dr * dist;
            const c = col + dc * dist;
            if (!inBounds(r, c)) break;

            const cellPiece = gameState.board[r][c];

            if (cellPiece) {
                if (cellPiece.type === piece.type) break; // своя — стоп
                if (!enemyFound) {
                    enemyFound = true; // нашли врага — продолжаем смотреть дальше
                } else {
                    break; // уже нашли врага, а это вторая фигура — нельзя
                }
            } else {
                if (enemyFound) {
                    return true; // пустая клетка за врагом — можно рубить
                }
                // иначе просто пустая клетка — идём дальше
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

  const dirs = piece.king ? DIRECTIONS.king : DIRECTIONS[piece.type];

  if (piece.king) {
    for (const { r: dr, c: dc } of dirs) {
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
          } else break;
        }
      }
    }
  } else {
    for (const { r: dr, c: dc } of dirs) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (inBounds(newRow, newCol) && !gameState.board[newRow][newCol]) {
        moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
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

  // Если в цепочке рубок, разрешаем ходить только шашкой в цепочке
  if (gameState.captureChain) {
    const { row: cr, col: cc } = gameState.captureChain;
    if (row === cr && col === cc) return; // клик по текущей шашке — игнорируем

    const clickedPiece = gameState.board[row][col];
    // 🔒 Ограничение: нельзя кликать по шашкам соперника
    if (clickedPiece && clickedPiece.type !== gameState.currentPlayer) return;

    const rowDiff = row - cr;
    const colDiff = col - cc;

    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = cr + rowDiff / 2;
      const midCol = cc + colDiff / 2;
      const midPiece = gameState.board[midRow][midCol];

      if (midPiece && midPiece.type !== gameState.currentPlayer) {
        makeMove(cr, cc, row, col);
      }
    }
    return;
  }

  const piece = gameState.board[row][col];
  if (piece && piece.type === gameState.currentPlayer) {
    if (hasCaptures(gameState.currentPlayer) && !canCapture(row, col)) return;

    clearSelection();
    highlightCell(row, col, true);
    gameState.selectedPiece = { row, col };
  } else if (!piece && gameState.selectedPiece) {
    const { row: fromRow, col: fromCol } = gameState.selectedPiece;

    if (hasCaptures(gameState.currentPlayer)) {
      const rowDiff = row - fromRow;
      const colDiff = col - fromCol;
      if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return;
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
function computerMove() {
  if (gameState.moveInProgress) return;

  if (gameState.captureChain) {
    computerContinueCapture();
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
      moveToMake = centerMoves.length ? centerMoves[Math.floor(Math.random() * centerMoves.length)] : allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  if (moveToMake) {
    makeMove(moveToMake.fromRow, moveToMake.fromCol, moveToMake.toRow, moveToMake.toCol);
  } else {
    alert('Победили белые! Компьютер не может ходить.');
    showScreen('menu');
  }
}

// --- Продолжение цепочки рубки компьютера ---
function computerContinueCapture() {
    if (!gameState.captureChain) return;

    const { row, col } = gameState.captureChain;
    const piece = gameState.board[row][col];
    if (!piece) {
        endComputerTurn();
        return;
    }

    // Находим все возможные продолжения взятия
    const { captures } = findMovesAndCaptures(row, col);
    
    if (captures.length === 0) {
        endComputerTurn();
        return;
    }

    // Выбираем взятие с максимальным количеством последующих взятий
    let bestCapture = captures[0];
    let maxAdditionalCaptures = 0;

    for (const capture of captures) {
        // Временная симуляция хода
        const tempBoard = JSON.parse(JSON.stringify(gameState.board));
        tempBoard[capture.toRow][capture.toCol] = tempBoard[row][col];
        tempBoard[row][col] = null;
        
        // Удаляем сбитую шашку (для дамки - особый случай)
        if (piece.king) {
            const dirR = Math.sign(capture.toRow - row);
            const dirC = Math.sign(capture.toCol - col);
            for (let dist = 1; dist < Math.max(Math.abs(capture.toRow - row), Math.abs(capture.toCol - col)); dist++) {
                const r = row + dist * dirR;
                const c = col + dist * dirC;
                if (tempBoard[r][c] && tempBoard[r][c].type !== piece.type) {
                    tempBoard[r][c] = null;
                    break;
                }
            }
        } else {
            const midRow = (row + capture.toRow) >> 1;
            const midCol = (col + capture.toCol) >> 1;
            tempBoard[midRow][midCol] = null;
        }

        // Проверяем возможные продолжения
        const additionalCaptures = findMovesAndCaptures(capture.toRow, capture.toCol).captures.length;
        
        if (additionalCaptures > maxAdditionalCaptures) {
            maxAdditionalCaptures = additionalCaptures;
            bestCapture = capture;
        }
    }

    makeMove(bestCapture.fromRow, bestCapture.fromCol, bestCapture.toRow, bestCapture.toCol);
}

function canContinueCapture(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return false;
    return piece.king ? canKingContinueCapture(row, col) : canCapture(row, col);
}

function endComputerTurn() {
  gameState.captureChain = null;
  gameState.currentPlayer = 'white';
  updateStatus();
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
