// ゲーム設定
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PLAYER_SPEED: 5,
    BULLET_SPEED: 7,
    INVADER_SPEED: 1,
    INVADER_DROP_SPEED: 20,
    INVADER_BULLET_SPEED: 3,
    INVADER_ROWS: 5,
    INVADER_COLS: 11,
    INVADER_SPACING_X: 60,
    INVADER_SPACING_Y: 50,
    INVADER_START_X: 100,
    INVADER_START_Y: 100,
    BARRIER_COUNT: 4,
    BARRIER_WIDTH: 80,
    BARRIER_HEIGHT: 60,
    UFO_SPEED: 2,
    UFO_SPAWN_CHANCE: 0.001
};

// スコア設定
const SCORES = {
    INVADER_TOP: 30,
    INVADER_MIDDLE: 20,
    INVADER_BOTTOM: 10,
    UFO: [50, 100, 150, 300]
};

// ゲーム状態
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1,
    shotCount: 0
};

// キャンバスとコンテキスト
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲームオブジェクト
let player = null;
let playerBullet = null;
let invaders = [];
let invaderBullets = [];
let barriers = [];
let ufo = null;
let particles = [];

// キー入力状態
const keys = {
    left: false,
    right: false,
    space: false,
    enter: false
};

// プレイヤークラス
class Player {
    constructor() {
        this.x = GAME_CONFIG.CANVAS_WIDTH / 2 - 20;
        this.y = GAME_CONFIG.CANVAS_HEIGHT - 60;
        this.width = 40;
        this.height = 20;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
    }

    update() {
        if (keys.left && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.right && this.x < GAME_CONFIG.CANVAS_WIDTH - this.width) {
            this.x += this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#00ff00';
        // シンプルなプレイヤー形状
        ctx.fillRect(this.x + 15, this.y, 10, 5);
        ctx.fillRect(this.x + 5, this.y + 5, 30, 10);
        ctx.fillRect(this.x, this.y + 15, 40, 5);
    }

    shoot() {
        if (!playerBullet) {
            playerBullet = new Bullet(this.x + this.width / 2 - 2, this.y, -GAME_CONFIG.BULLET_SPEED, '#00ff00');
            gameState.shotCount++;
        }
    }
}

// 弾丸クラス
class Bullet {
    constructor(x, y, speedY, color) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speedY = speedY;
        this.color = color;
    }

    update() {
        this.y += this.speedY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isOffScreen() {
        return this.y < 0 || this.y > GAME_CONFIG.CANVAS_HEIGHT;
    }
}

// インベーダークラス
class Invader {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 24;
        this.type = type; // 0: bottom, 1: middle, 2: top
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update() {
        this.animTimer++;
        if (this.animTimer > 30) {
            this.animFrame = 1 - this.animFrame;
            this.animTimer = 0;
        }
    }

    draw() {
        ctx.fillStyle = '#00ff00';
        const frame = this.animFrame;
        
        // インベーダーの形状（簡略化されたドット絵風）
        if (this.type === 2) { // 上段（タコ）
            this.drawSquid(frame);
        } else if (this.type === 1) { // 中段（カニ）
            this.drawCrab(frame);
        } else { // 下段（イカ）
            this.drawOctopus(frame);
        }
    }

    drawSquid(frame) {
        const patterns = [
            [
                '  ████████  ',
                '████████████',
                '██████████████',
                '██  ████  ██',
                '████████████',
                '  ██    ██  ',
                ' ██  ██  ██ ',
                '██        ██'
            ],
            [
                '  ████████  ',
                '████████████',
                '██████████████',
                '██  ████  ██',
                '████████████',
                '  ██    ██  ',
                ' ██  ██  ██ ',
                '  ██    ██  '
            ]
        ];
        this.drawPattern(patterns[frame]);
    }

    drawCrab(frame) {
        const patterns = [
            [
                ' ██      ██ ',
                '  ████████  ',
                ' ██████████ ',
                '██  ████  ██',
                '████████████',
                '██  ████  ██',
                '██        ██',
                '  ██    ██  '
            ],
            [
                ' ██      ██ ',
                '██████████████',
                '██████████████',
                '██  ████  ██',
                '████████████',
                ' ██  ██  ██ ',
                '██  ████  ██',
                '  ██    ██  '
            ]
        ];
        this.drawPattern(patterns[frame]);
    }

    drawOctopus(frame) {
        const patterns = [
            [
                '    ████    ',
                '  ████████  ',
                ' ██████████ ',
                '██  ████  ██',
                '████████████',
                '  ██    ██  ',
                ' ██      ██ ',
                '██        ██'
            ],
            [
                '    ████    ',
                '  ████████  ',
                ' ██████████ ',
                '██  ████  ██',
                '████████████',
                '  ██    ██  ',
                ' ██      ██ ',
                '  ██    ██  '
            ]
        ];
        this.drawPattern(patterns[frame]);
    }

    drawPattern(pattern) {
        const pixelSize = 2;
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === '█') {
                    ctx.fillRect(
                        this.x + col * pixelSize,
                        this.y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }

    getScore() {
        switch (this.type) {
            case 2: return SCORES.INVADER_TOP;
            case 1: return SCORES.INVADER_MIDDLE;
            default: return SCORES.INVADER_BOTTOM;
        }
    }

    shoot() {
        return new Bullet(this.x + this.width / 2 - 2, this.y + this.height, GAME_CONFIG.INVADER_BULLET_SPEED, '#ff0000');
    }
}

// UFOクラス
class UFO {
    constructor() {
        this.x = -50;
        this.y = 50;
        this.width = 48;
        this.height = 24;
        this.speed = GAME_CONFIG.UFO_SPEED;
        this.direction = 1;
    }

    update() {
        this.x += this.speed * this.direction;
    }

    draw() {
        ctx.fillStyle = '#ff0000';
        // UFOの形状
        ctx.fillRect(this.x + 8, this.y + 8, 32, 8);
        ctx.fillRect(this.x + 4, this.y + 12, 40, 4);
        ctx.fillRect(this.x, this.y + 16, 48, 8);
        
        // 窓
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 12, this.y + 4, 6, 6);
        ctx.fillRect(this.x + 20, this.y + 4, 6, 6);
        ctx.fillRect(this.x + 28, this.y + 4, 6, 6);
    }

    isOffScreen() {
        return this.x > GAME_CONFIG.CANVAS_WIDTH + 50;
    }

    getScore() {
        // ショット回数に基づいてスコアを決定（簡略化）
        const index = gameState.shotCount % SCORES.UFO.length;
        return SCORES.UFO[index];
    }
}

// バリアクラス
class Barrier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.BARRIER_WIDTH;
        this.height = GAME_CONFIG.BARRIER_HEIGHT;
        this.blocks = [];
        this.initBlocks();
    }

    initBlocks() {
        const blockSize = 4;
        const pattern = [
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████',
            '████████████████████'
        ];

        for (let row = 0; row < pattern.length; row++) {
            this.blocks[row] = [];
            for (let col = 0; col < pattern[row].length; col++) {
                this.blocks[row][col] = pattern[row][col] === '█';
            }
        }
    }

    draw() {
        ctx.fillStyle = '#00ff00';
        const blockSize = 4;
        for (let row = 0; row < this.blocks.length; row++) {
            for (let col = 0; col < this.blocks[row].length; col++) {
                if (this.blocks[row][col]) {
                    ctx.fillRect(
                        this.x + col * blockSize,
                        this.y + row * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }

    checkCollision(bullet) {
        const blockSize = 4;
        const startRow = Math.floor((bullet.y - this.y) / blockSize);
        const endRow = Math.floor((bullet.y + bullet.height - this.y) / blockSize);
        const startCol = Math.floor((bullet.x - this.x) / blockSize);
        const endCol = Math.floor((bullet.x + bullet.width - this.x) / blockSize);

        for (let row = Math.max(0, startRow); row <= Math.min(this.blocks.length - 1, endRow); row++) {
            for (let col = Math.max(0, startCol); col <= Math.min(this.blocks[row].length - 1, endCol); col++) {
                if (this.blocks[row][col]) {
                    // ダメージを与える
                    this.damageArea(row, col, 2);
                    return true;
                }
            }
        }
        return false;
    }

    damageArea(centerRow, centerCol, radius) {
        for (let row = centerRow - radius; row <= centerRow + radius; row++) {
            for (let col = centerCol - radius; col <= centerCol + radius; col++) {
                if (row >= 0 && row < this.blocks.length && col >= 0 && col < this.blocks[row].length) {
                    const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                    if (distance <= radius) {
                        this.blocks[row][col] = false;
                    }
                }
            }
        }
    }
}

// 衝突判定
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ゲーム初期化
function initGame() {
    gameState = {
        isRunning: true,
        isPaused: false,
        score: 0,
        lives: 3,
        level: 1,
        shotCount: 0
    };

    player = new Player();
    playerBullet = null;
    invaders = [];
    invaderBullets = [];
    barriers = [];
    ufo = null;
    particles = [];

    // インベーダー生成
    for (let row = 0; row < GAME_CONFIG.INVADER_ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.INVADER_COLS; col++) {
            const x = GAME_CONFIG.INVADER_START_X + col * GAME_CONFIG.INVADER_SPACING_X;
            const y = GAME_CONFIG.INVADER_START_Y + row * GAME_CONFIG.INVADER_SPACING_Y;
            let type;
            if (row === 0) type = 2; // 上段
            else if (row <= 2) type = 1; // 中段
            else type = 0; // 下段
            
            invaders.push(new Invader(x, y, type));
        }
    }

    // バリア生成
    const barrierSpacing = GAME_CONFIG.CANVAS_WIDTH / (GAME_CONFIG.BARRIER_COUNT + 1);
    for (let i = 0; i < GAME_CONFIG.BARRIER_COUNT; i++) {
        const x = barrierSpacing * (i + 1) - GAME_CONFIG.BARRIER_WIDTH / 2;
        const y = GAME_CONFIG.CANVAS_HEIGHT - 200;
        barriers.push(new Barrier(x, y));
    }

    updateUI();
    hideStartScreen();
}

// UI更新
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
}

// スタート画面を隠す
function hideStartScreen() {
    document.getElementById('startScreen').classList.add('hidden');
}

// ゲームオーバー画面を表示
function showGameOverScreen() {
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// ゲームオーバー画面を隠す
function hideGameOverScreen() {
    document.getElementById('gameOverScreen').classList.add('hidden');
}

// インベーダーの移動ロジック
let invaderDirection = 1;
let invaderMoveTimer = 0;
const invaderMoveDelay = 60; // フレーム数

function updateInvaders() {
    invaderMoveTimer++;
    
    // インベーダーの数が少ないほど速く移動
    const speedMultiplier = Math.max(1, 6 - Math.floor(invaders.length / 10));
    const currentMoveDelay = Math.max(10, invaderMoveDelay - speedMultiplier * 5);
    
    if (invaderMoveTimer >= currentMoveDelay) {
        invaderMoveTimer = 0;
        
        // 端に到達したかチェック
        let shouldDrop = false;
        for (let invader of invaders) {
            if ((invaderDirection > 0 && invader.x + invader.width >= GAME_CONFIG.CANVAS_WIDTH - 20) ||
                (invaderDirection < 0 && invader.x <= 20)) {
                shouldDrop = true;
                break;
            }
        }
        
        if (shouldDrop) {
            // 下に移動して方向転換
            for (let invader of invaders) {
                invader.y += GAME_CONFIG.INVADER_DROP_SPEED;
            }
            invaderDirection *= -1;
        } else {
            // 横に移動
            for (let invader of invaders) {
                invader.x += GAME_CONFIG.INVADER_SPEED * invaderDirection * speedMultiplier;
            }
        }
    }
    
    // インベーダーのアニメーション更新
    for (let invader of invaders) {
        invader.update();
    }
    
    // インベーダーの射撃
    if (Math.random() < 0.02 && invaders.length > 0) {
        const shooter = invaders[Math.floor(Math.random() * invaders.length)];
        invaderBullets.push(shooter.shoot());
    }
}

// UFO生成
function spawnUFO() {
    if (!ufo && Math.random() < GAME_CONFIG.UFO_SPAWN_CHANCE) {
        ufo = new UFO();
    }
}

// ゲームループ
function gameLoop() {
    if (!gameState.isRunning) return;
    
    // 画面クリア
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // プレイヤー更新・描画
    player.update();
    player.draw();
    
    // プレイヤーの弾更新・描画
    if (playerBullet) {
        playerBullet.update();
        playerBullet.draw();
        
        if (playerBullet.isOffScreen()) {
            playerBullet = null;
        }
    }
    
    // インベーダー更新・描画
    updateInvaders();
    for (let invader of invaders) {
        invader.draw();
    }
    
    // インベーダーの弾更新・描画
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        bullet.update();
        bullet.draw();
        
        if (bullet.isOffScreen()) {
            invaderBullets.splice(i, 1);
        }
    }
    
    // UFO更新・描画
    spawnUFO();
    if (ufo) {
        ufo.update();
        ufo.draw();
        
        if (ufo.isOffScreen()) {
            ufo = null;
        }
    }
    
    // バリア描画
    for (let barrier of barriers) {
        barrier.draw();
    }
    
    // 衝突判定
    checkCollisions();
    
    // ゲーム状態チェック
    checkGameState();
    
    requestAnimationFrame(gameLoop);
}

// 衝突判定処理
function checkCollisions() {
    // プレイヤーの弾とインベーダー
    if (playerBullet) {
        for (let i = invaders.length - 1; i >= 0; i--) {
            const invader = invaders[i];
            if (checkCollision(playerBullet, invader)) {
                gameState.score += invader.getScore();
                invaders.splice(i, 1);
                playerBullet = null;
                updateUI();
                break;
            }
        }
        
        // プレイヤーの弾とUFO
        if (ufo && checkCollision(playerBullet, ufo)) {
            gameState.score += ufo.getScore();
            ufo = null;
            playerBullet = null;
            updateUI();
        }
        
        // プレイヤーの弾とバリア
        if (playerBullet) {
            for (let barrier of barriers) {
                if (barrier.checkCollision(playerBullet)) {
                    playerBullet = null;
                    break;
                }
            }
        }
    }
    
    // インベーダーの弾とプレイヤー
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        if (checkCollision(bullet, player)) {
            gameState.lives--;
            invaderBullets.splice(i, 1);
            updateUI();
            
            if (gameState.lives <= 0) {
                gameOver();
            }
            break;
        }
        
        // インベーダーの弾とバリア
        for (let barrier of barriers) {
            if (barrier.checkCollision(bullet)) {
                invaderBullets.splice(i, 1);
                break;
            }
        }
    }
    
    // インベーダーとプレイヤー（侵略チェック）
    for (let invader of invaders) {
        if (invader.y + invader.height >= player.y) {
            gameOver();
            break;
        }
    }
}

// ゲーム状態チェック
function checkGameState() {
    // 全インベーダー撃破
    if (invaders.length === 0) {
        nextLevel();
    }
}

// 次のレベル
function nextLevel() {
    gameState.level++;
    gameState.shotCount = 0;
    
    // インベーダー再生成
    invaders = [];
    for (let row = 0; row < GAME_CONFIG.INVADER_ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.INVADER_COLS; col++) {
            const x = GAME_CONFIG.INVADER_START_X + col * GAME_CONFIG.INVADER_SPACING_X;
            const y = GAME_CONFIG.INVADER_START_Y + row * GAME_CONFIG.INVADER_SPACING_Y;
            let type;
            if (row === 0) type = 2;
            else if (row <= 2) type = 1;
            else type = 0;
            
            invaders.push(new Invader(x, y, type));
        }
    }
    
    // バリア再生成
    barriers = [];
    const barrierSpacing = GAME_CONFIG.CANVAS_WIDTH / (GAME_CONFIG.BARRIER_COUNT + 1);
    for (let i = 0; i < GAME_CONFIG.BARRIER_COUNT; i++) {
        const x = barrierSpacing * (i + 1) - GAME_CONFIG.BARRIER_WIDTH / 2;
        const y = GAME_CONFIG.CANVAS_HEIGHT - 200;
        barriers.push(new Barrier(x, y));
    }
    
    invaderBullets = [];
    playerBullet = null;
    ufo = null;
    
    updateUI();
}

// ゲームオーバー
function gameOver() {
    gameState.isRunning = false;
    showGameOverScreen();
}

// キーイベント
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
            keys.right = true;
            e.preventDefault();
            break;
        case 'Space':
            if (gameState.isRunning) {
                player.shoot();
            }
            e.preventDefault();
            break;
        case 'Enter':
            if (!gameState.isRunning) {
                initGame();
                gameLoop();
            }
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'Space':
            keys.space = false;
            break;
    }
});

// リスタートボタン
document.getElementById('restartButton').addEventListener('click', () => {
    hideGameOverScreen();
    initGame();
    gameLoop();
});

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // ゲーム開始待機状態
});

