// ==========================================
// --- КОНСТАНТЫ И НАСТРОЙКИ (Обновленные) ---
// ==========================================

// --- Размеры и сетка ---
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 1024;
const GRID_CELL_SIZE = 32; // Должно совпадать с размером block.png и fuel.png

// --- Цвета и прозрачность ---
const COLOR_BRAKE = 0xaaaaaa; // Серый ( для торможения)
const COLOR_ACCELERATE = 0xadd6dd; // Голубой (для ускорения)
const COLOR_RED = 0x3dc9b0;       // Красный (перегрев/буст)
const COLOR_REVERSE = 0xffa500; // Оранжевый (задний ход)
const CUBE_COLOR = 0xffff00;     // Желтый для куба

const ZONE_ALPHA_DEFAULT = 0.3; // Базовая прозрачность зон
const ZONE_ALPHA_HOVER = 1.0;  // Альфа при наведении
const GHOST_ALPHA = 0.4;
const TRAJECTORY_COLOR = 0xffffff;
const TRAJECTORY_ALPHA = 0.7;
const TRAJECTORY_DASH_LENGTH = 10;
const TRAJECTORY_GAP_LENGTH = 5;
const CUBE_ALPHA = 1.0;

// --- Параметры машины ---
const carRadius = 20; //
const MIN_SPEED = 0.1; // Минимальная игровая скорость
const MAX_SPEED = 5.0; // Максимальная игровая скорость
const SPEED_INCREMENT = 1; // Максимальное изменение скорости за ход (+/-) в 'working' зоне
const RED_ZONE_SPEED_BOOST = 1.5; // Величина ускорения от красной зоны
const RED_ZONE_COOLDOWN_TURNS = 2; // Ходов кулдауна после использования красной зоны

// --- Параметры арки (GUI) ---
const BASE_INNER_RADIUS_GUI = 30;
const ARC_THICKNESS_GUI = 50;
const GREEN_ZONE_RATIO = 0.6; // Отношение серой+голубой зоны ко всей толщине
const BASE_ANGLE_DEG = 120;

// --- Факторы влияния скорости на ВИД арки (GUI) ---
const SPEED_TO_GUI_RADIUS_FACTOR = 40;
const GUI_THICKNESS_REDUCTION_FACTOR = 0.1;
const MAX_GUI_ANGLE_REDUCTION_FACTOR = 5;
const MIN_ARC_ANGLE_DEG = 25;
const MIN_ARC_THICKNESS = 20;

// --- Параметры арки ЗАДНЕГО ХОДА (GUI) ---
const REVERSE_ARC_INNER_RADIUS = 25;
const REVERSE_ARC_THICKNESS = 35;
const REVERSE_ARC_ANGLE_DEG = 20;

// --- Параметры расчета ДИСТАНЦИИ хода (от клика по арке) ---
const MIN_MOVE_DISTANCE_FACTOR = 0.5;
const MAX_MOVE_DISTANCE_FACTOR = 2.5;
const SPEED_TO_DISTANCE_MULTIPLIER = 15;

// --- Параметры движения и скорости ---
const BASE_PHYSICS_MOVE_SPEED_FACTOR = 1.0; // Базовый фактор скорости анимации (связан с дистанцией)
const CLICK_POS_ANIM_SPEED_FACTOR = 0.8;    // Влияние дальности клика на скорость анимации
// --- Множители скорости анимации в зависимости от игровой скорости ---
const MIN_ANIM_SPEED_MULTIPLIER = 0.8; // Множитель скорости анимации при MIN_SPEED
const MAX_ANIM_SPEED_MULTIPLIER = 3.5; // Множитель скорости анимации при MAX_SPEED
// --- Минимальная скорость анимации (пикселей/сек) ---
const MIN_VISUAL_ANIM_SPEED = 50;
// ---
const TURN_DURATION = 300; // Время поворота для переднего хода
const STOP_DISTANCE_THRESHOLD = 5;
const MIN_STOP_SPEED = 0;

// --- Параметры движения ЗАДНИМ ХОДОМ ---
const REVERSE_MOVE_DISTANCE = GRID_CELL_SIZE * 1.25; // Фиксированная дистанция назад
const REVERSE_SPEED_ANIMATION = 50; // Фиксированная скорость анимации назад

// --- Параметры генерации уровня ---
const CUBE_TEXTURE_KEY = 'cubeTexture';
const NOISE_SCALE = 150;
const START_AREA_CLEAR_RADIUS_FACTOR = 3;
const CUBE_SIZE_FACTOR = 0.8;

// --- КЛЮЧИ для загруженных ассетов ---
const SAND_TEXTURE_KEY = 'sandTexture';
const OBSTACLE_IMAGE_KEY = 'obstacleBlock';
const MAIN_BG_KEY = 'mainBg';
const START_BUTTON_KEY = 'startButton';
const CAR_PLAYER_KEY = 'car_player';
const RESTART_BUTTON_KEY = 'restartButton';
const NEXT_LEVEL_BUTTON_KEY = 'nextLevelButton';
const FUEL_PICKUP_KEY = 'fuelPickup'; 

// --- Параметры прогрессии ---
const TOTAL_LEVELS = 10;
const INITIAL_OBSTACLE_THRESHOLD = 0.7; // Стартовая частота припятствий
const OBSTACLE_THRESHOLD_DECREMENT = 0.05;
const MIN_OBSTACLE_THRESHOLD = 0.2;

// --- Параметры ТОПЛИВА (FUEL) --- 
const INITIAL_FUEL = 10;
const FUEL_CONSUMPTION_PER_MOVE = 1;
const FUEL_GAIN_ON_PICKUP = 3;
const FUEL_LOW_THRESHOLD = 3; // Порог, при котором индикатор становится красным
const FUEL_COLOR_NORMAL = '#ffffff'; // Белый цвет текста
const FUEL_COLOR_LOW = '#ff0000'; // Красный цвет текста при низком топливе

// --- Параметры эффектов ---
const FLASH_DURATION = 300;
const FLASH_COLOR = 0xff0000; // Красный для столкновения/конца топлива
const WIN_FLASH_COLOR = 0x00ff00;
const SHAKE_DURATION = 300;
const SHAKE_INTENSITY = 0.01;
const RESTART_DELAY = 1000; // Увеличена задержка для чтения сообщения

// ==============================
// --- СЦЕНА ГЛАВНОГО МЕНЮ ---
// ==============================
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        console.log("Preloading Main Menu assets...");
        this.load.image(MAIN_BG_KEY, 'assets/MainBG.jpg');
        this.load.image(START_BUTTON_KEY, 'assets/STARTGAME.png');
    }

    create() {
        console.log("Creating Main Menu Scene...");

        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, MAIN_BG_KEY)
            .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

        const startButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 350, START_BUTTON_KEY)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            console.log("Start button clicked!");
            // Инициализируем реестр перед стартом игры
            this.registry.set('currentLevel', 1);
            this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
            this.scene.start('GameScene');
        });
    }
}


// ===========================
// --- КЛАСС СЦЕНЫ ИГРЫ ---
// ===========================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Инициализируем переменные сцены
        this.car = null;
        this.controlArcGraphics = null;
        this.trajectoryGraphics = null;
        this.ghostCar = null;
        this.infoText = null;
        this.levelText = null;
        this.fuelText = null; //
        this.arcParams = {};
        this.isMoving = false;
        this.obstaclesGroup = null;
        this.collectibleGroup = null;
        this.fuelPickupGroup = null; // <<< НОВАЯ ПЕРЕМЕННАЯ для группы пикапов топлива
        this.cube = null;
        this.noise = null;
        this.winText = null;
        this.nextLevelButton = null;
        this.restartLevelText = null;
        this.levelComplete = false;
        this.playAgainButton = null;
        this.gameOver = false; // <<< Флаг для предотвращения двойного срабатывания game over
        this.hoveredArcZone = null;
        this.backgroundTile = null;
        this.restartButtonObject = null;

        // Переменные уровня (будут загружены из реестра в create)
        this.currentLevel = 1;
        this.currentObstacleThreshold = INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL; // <<< НОВАЯ ПЕРЕМЕННАЯ для текущего топлива

        // Переменные для спавна (чтобы не передавать их постоянно)
        this.occupiedCellsForSpawning = null;
        this.gridWidthForSpawning = 0;
        this.gridHeightForSpawning = 0;
    }

    startNewGame() {
    console.log("Starting New Game from Win screen...");
    // Сбрасываем значения в реестре к начальным
    this.registry.set('currentLevel', 1);
    this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
    // Если есть другие параметры для сброса (счет и т.д.), добавьте их здесь

    // Возвращаемся в главное меню
    if (this.scene.isActive(this.scene.key)) {
         this.scene.start('MainMenuScene');
    }
}

    preload() {
        console.log("Preloading GameScene assets...");
        this.load.image(CAR_PLAYER_KEY, 'assets/car_player.png');
        this.load.image(SAND_TEXTURE_KEY, 'assets/sand_texture.jpg');
        this.load.image(OBSTACLE_IMAGE_KEY, 'assets/block.png');
        this.load.image(RESTART_BUTTON_KEY, 'assets/restart.png');
        this.load.image(NEXT_LEVEL_BUTTON_KEY, 'assets/NEXTLEVEL.png'); 
        this.load.image(FUEL_PICKUP_KEY, 'assets/fuel.png'); // <<< ЗАГРУЗКА АССЕТА ТОПЛИВА (убедитесь, что файл есть!)
        this.createCubeTexture();
    }

    createCubeTexture() {
        if (this.textures.exists(CUBE_TEXTURE_KEY)) return;
        const size = GRID_CELL_SIZE * CUBE_SIZE_FACTOR;
        const gfx = this.make.graphics({ x: 0, y: 0, add: false }).fillStyle(CUBE_COLOR, CUBE_ALPHA).fillRect(0, 0, size, size);
        gfx.generateTexture(CUBE_TEXTURE_KEY, size, size).destroy();
        console.log("Cube texture created.");
    }

    create() {
        // Получаем данные из реестра
        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.currentObstacleThreshold = this.registry.get('obstacleThreshold') || INITIAL_OBSTACLE_THRESHOLD;

        console.log(`Creating scene for Level ${this.currentLevel}... Obstacle Threshold: ${this.currentObstacleThreshold.toFixed(2)}`);
        this.isMoving = false;
        this.levelComplete = false;
        this.gameOver = false; // Сбрасываем флаг game over
        this.hoveredArcZone = null;
        this.fuel = INITIAL_FUEL; // Инициализируем топливо для уровня

        // Проверка SimplexNoise
        if (typeof SimplexNoise === 'undefined') {
            console.error("SimplexNoise library not found!");
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Error: SimplexNoise library not loaded!", { color: 'red', fontSize: '20px', backgroundColor: 'black', align: 'center', padding: 10 }).setOrigin(0.5);
            return;
        }
        this.noise = new SimplexNoise();

        // Фон
        this.backgroundTile = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, SAND_TEXTURE_KEY)
            .setOrigin(0, 0)
            .setDepth(-20);

        // Группы физики
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.collectibleGroup = this.physics.add.group();
        this.fuelPickupGroup = this.physics.add.group(); // <<< СОЗДАНИЕ ГРУППЫ ДЛЯ ТОПЛИВА

        // Создание уровня (использует this.currentObstacleThreshold)
        // Эта функция теперь сохраняет occupiedCells, gridWidth, gridHeight в this
        this.createLevel();

        // Машина игрока
        this.car = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, CAR_PLAYER_KEY);
        this.car.setOrigin(0.5, 0.5).setScale(0.5).setDataEnabled();
        this.car.setData({
            speed: MIN_SPEED,
            nextSpeed: undefined,
            redCooldown: 0,
            nextRedCooldown: undefined,
            accelDisabled: false,
            nextAccelDisabled: undefined
        });
        this.car.angle = -90;
        this.car.body.setCircle(carRadius);
        this.car.body.setOffset(30, 0);
        this.car.setCollideWorldBounds(true).setDepth(10);

        // Спавн ПИКАПА ТОПЛИВА после создания уровня и машины
        // Используем сохраненные данные сетки
        this.spawnFuelPickup(this.occupiedCellsForSpawning, this.gridWidthForSpawning, this.gridHeightForSpawning);

        // Графика для управления
        this.controlArcGraphics = this.add.graphics().setDepth(5);
        this.trajectoryGraphics = this.add.graphics().setDepth(6);
        this.ghostCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
            .setOrigin(0.5, 0.5).setScale(this.car.scale)
            .setAlpha(GHOST_ALPHA).setVisible(false).setDepth(7);

        // --- Текстовые элементы ---
        // Отладочный текст
        this.infoText = this.add.text(10, 10, '', { font: '16px Courier New', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)' }).setDepth(20);

        // Счетчик уровней
        this.levelText = this.add.text(200, 5, `Level ${this.currentLevel} / ${TOTAL_LEVELS}`, { font: 'bold 20px Courier New', fill: '#ffffff', align: 'left', stroke: '#000000', strokeThickness: 4})
            .setOrigin(0, 0) // Выравнивание по левому верхнему углу
            .setDepth(21);

        // <<< ИНДИКАТОР ТОПЛИВА ---
        this.fuelText = this.add.text(GAME_WIDTH / 2, 5, '', { font: 'bold 24px "Courier New", Courier, monospace', fill: FUEL_COLOR_NORMAL, align: 'center', stroke: '#000000', strokeThickness: 3})
            .setOrigin(0.5, 0) // Выравнивание по верхнему центру
            .setDepth(21);
        this.updateFuelDisplay(); // Инициализация текста топлива

        // --- ГРАФИЧЕСКАЯ КНОПКА "ИГРАТЬ СНОВА" (ДЛЯ ЭКРАНА ПОБЕДЫ, ИСПОЛЬЗУЕТ STARTGAME.png) ---
        this.playAgainButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, START_BUTTON_KEY) // Используем ключ START_BUTTON_KEY
            .setOrigin(0.5)
            .setDepth(25)
            .setScale(0.8) // Масштаб можно подстроить, 1.0 - оригинальный
            .setVisible(false) // Изначально невидима
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.startNewGame, this); // Вызывает новую функцию startNewGame

        // --- КНОПКА РЕСТАРТА ---
        const restartButtonX = GAME_WIDTH - 5;
        const restartButtonY = 5;
        this.restartButtonObject = this.add.image(restartButtonX, restartButtonY, RESTART_BUTTON_KEY)
             .setOrigin(1, 0)
             .setDepth(22)
             .setInteractive({ useHandCursor: true });

        this.restartButtonObject.on('pointerdown', () => {
            console.log("Restart button clicked!");
             if (!this.isMoving && !this.levelComplete && !this.gameOver) {
                 this.scene.restart();
             }
        });

        // Текст победы
        this.winText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'LEVEL COMPLETE!', { font: 'bold 48px Courier New', fill: '#ffff00', stroke: '#634125', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(25).setVisible(false);

        // Кнопка/текст следующего уровня
                this.nextLevelButton = null; // Инициализируем как null
        if (this.currentLevel < TOTAL_LEVELS) {
            // Создаем ГРАФИЧЕСКУЮ кнопку только если есть следующий уровень
            this.nextLevelButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, NEXT_LEVEL_BUTTON_KEY)
                .setOrigin(0.5)
                .setScale(0.75) 
                .setDepth(25)
                .setVisible(false) // Изначально невидима
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', this.startNextLevel, this);
        }

        if (this.currentLevel < TOTAL_LEVELS) {
             this.nextLevelButton.setInteractive({ useHandCursor: true }).on('pointerdown', this.startNextLevel, this);
        }

        // Текст рестарта уровня (Game Over)
        this.restartLevelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', { font: 'bold 48px Courier New', fill: '#ffff00', stroke: '#634125', strokeThickness: 6, align: 'center' })
            .setOrigin(0.5).setDepth(26).setVisible(false);

        // Настройка ввода
        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handleSceneClick, this);
        this.input.on('pointermove', this.handlePointerMove, this);

        // Настройка коллайдеров
        this.physics.add.overlap(this.car, this.obstaclesGroup, this.handleCollision, null, this);
        this.physics.add.overlap(this.car, this.collectibleGroup, this.handleCollectCube, null, this);
        this.physics.add.overlap(this.car, this.fuelPickupGroup, this.handleCollectFuelPickup, null, this); // <<< КОЛЛАЙДЕР ДЛЯ ТОПЛИВА

        console.log("Initial calculation and drawing...");
        if (this.car) {
            this.calculateAndDrawState();
        }
        this.setupDebugControls();
        this.input.keyboard.enabled = true;
        console.log("Game Scene created/restarted.");
    }

    // --- Генерация уровня ---
    createLevel() {
        console.log("Creating level obstacles, border, and cube...");
        if (this.obstaclesGroup) this.obstaclesGroup.clear(true, true);
        if (this.collectibleGroup) this.collectibleGroup.clear(true, true);
        if (this.fuelPickupGroup) this.fuelPickupGroup.clear(true, true); // Очищаем и пикапы
        if (!this.noise) { console.error("Noise generator not initialized!"); return; }

        const noiseGenerator = this.noise; const scale = NOISE_SCALE;
        const threshold = this.currentObstacleThreshold;
        const startClearRadius = GRID_CELL_SIZE * START_AREA_CLEAR_RADIUS_FACTOR;
        const gridWidth = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);
        const gridHeight = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);
        if (gridHeight <= 0 || gridWidth <= 0) { console.error("Invalid grid dimensions calculated:", gridWidth, gridHeight); return; }
        const occupiedCells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

        // Заполняем стартовую зону как занятую
        const startGridX = Math.floor(GAME_WIDTH / 2 / GRID_CELL_SIZE);
        const startGridY = Math.floor(GAME_HEIGHT / 2 / GRID_CELL_SIZE);
        const clearRadiusGrid = Math.ceil(startClearRadius / GRID_CELL_SIZE);
        for (let dy = -clearRadiusGrid; dy <= clearRadiusGrid; dy++) {
            for (let dx = -clearRadiusGrid; dx <= clearRadiusGrid; dx++) {
                const checkX = startGridX + dx;
                const checkY = startGridY + dy;
                 if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
                    if (Phaser.Math.Distance.Between(startGridX, startGridY, checkX, checkY) <= clearRadiusGrid) {
                         occupiedCells[checkY][checkX] = true; // Помечаем как занято для спавна
                    }
                 }
            }
        }


        // Генерация препятствий по шуму
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            for (let gridX = 0; gridX < gridWidth; gridX++) {
                const cellCenterX = gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                // Пропускаем, если уже помечено как занято (стартовая зона)
                if (occupiedCells[gridY][gridX]) {
                    continue;
                }

                if (noiseGenerator.noise2D(cellCenterX / scale, cellCenterY / scale) > threshold) {
                    if(this.obstaclesGroup) {
                        this.obstaclesGroup.create(cellCenterX, cellCenterY, OBSTACLE_IMAGE_KEY);
                    }
                    occupiedCells[gridY][gridX] = true;
                }
            }
        }
        console.log(`Generated ${this.obstaclesGroup ? this.obstaclesGroup.getLength() : 0} obstacles from noise.`);

        // Генерация границ
        let borderObstaclesCount = 0;
        if (this.obstaclesGroup) {
             for (let gridX = 0; gridX < gridWidth; gridX++) {
                 if (gridHeight <= 0) break;
                 const topX = gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2; const topY = GRID_CELL_SIZE / 2; const bottomY = (gridHeight - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                 if (!occupiedCells[0][gridX]) { this.obstaclesGroup.create(topX, topY, OBSTACLE_IMAGE_KEY); occupiedCells[0][gridX] = true; borderObstaclesCount++; }
                 if (gridHeight > 1 && !occupiedCells[gridHeight - 1][gridX]) { this.obstaclesGroup.create(topX, bottomY, OBSTACLE_IMAGE_KEY); occupiedCells[gridHeight - 1][gridX] = true; borderObstaclesCount++; }
             }
             for (let gridY = 1; gridY < gridHeight - 1; gridY++) {
                 if (gridWidth <= 0) break;
                 const leftX = GRID_CELL_SIZE / 2; const leftY = gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2; const rightX = (gridWidth - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                 if (!occupiedCells[gridY][0]) { this.obstaclesGroup.create(leftX, leftY, OBSTACLE_IMAGE_KEY); occupiedCells[gridY][0] = true; borderObstaclesCount++; }
                 if (gridWidth > 1 && !occupiedCells[gridY][gridWidth - 1]) { this.obstaclesGroup.create(rightX, leftY, OBSTACLE_IMAGE_KEY); occupiedCells[gridY][gridWidth - 1] = true; borderObstaclesCount++; }
             }
        }
        console.log(`Added ${borderObstaclesCount} border obstacles.`);
        if(this.obstaclesGroup) this.obstaclesGroup.setDepth(-1);
        console.log(`Total obstacles on level: ${this.obstaclesGroup ? this.obstaclesGroup.getLength() : 0}.`);

        // Спавн куба (цели)
        this.spawnCube(occupiedCells, gridWidth, gridHeight); // Эта функция тоже пометит клетку куба как занятую

        // <<< Сохраняем карту занятых клеток и размеры сетки для спавна пикапов
        this.occupiedCellsForSpawning = occupiedCells;
        this.gridWidthForSpawning = gridWidth;
        this.gridHeightForSpawning = gridHeight;
    }

    // --- Спавн куба-цели ---
    spawnCube(occupiedCells, gridWidth, gridHeight) {
        if (!this.collectibleGroup) { console.error("Collectible group not initialized!"); return; }
        let cubeSpawned = false; let attempts = 0; const maxAttempts = gridWidth * gridHeight;
        while (!cubeSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1); const randomGridY = Phaser.Math.Between(0, gridHeight - 1);
            if (randomGridY >= 0 && randomGridY < occupiedCells.length && randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length && !occupiedCells[randomGridY][randomGridX]) {
                const cubeX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2; const cubeY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                this.cube = this.collectibleGroup.create(cubeX, cubeY, CUBE_TEXTURE_KEY);
                if (this.cube) {
                    this.cube.setOrigin(0.5).setDepth(0);
                    this.tweens.add({ targets: this.cube, scaleY: this.cube.scaleY * 1.1, scaleX: this.cube.scaleX * 0.9, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', duration: 800 });
                    occupiedCells[randomGridY][randomGridX] = true; // <<< Помечаем клетку как занятую
                    cubeSpawned = true; console.log(`Cube spawned at grid (${randomGridX}, ${randomGridY})`);
                } else { console.error("Failed to create cube sprite."); break; }
            }
            attempts++;
        }
        if (!cubeSpawned && attempts >= maxAttempts) { console.warn("Could not find a free cell to spawn the cube!"); }
    }

    // --- <<< НОВАЯ ФУНКЦИЯ: Спавн пикапа топлива ---
    spawnFuelPickup(occupiedCells, gridWidth, gridHeight) {
        if (!this.fuelPickupGroup || !occupiedCells) { console.error("Fuel pickup group or occupiedCells not initialized!"); return; }
        let pickupSpawned = false; let attempts = 0; const maxAttempts = gridWidth * gridHeight;

        console.log("Attempting to spawn fuel pickup...");

        while (!pickupSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
            const randomGridY = Phaser.Math.Between(0, gridHeight - 1);

            // Проверяем, что клетка существует в массиве и свободна
            if (randomGridY >= 0 && randomGridY < occupiedCells.length &&
                randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length &&
                !occupiedCells[randomGridY][randomGridX])
            {
                const pickupX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const pickupY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                const pickup = this.fuelPickupGroup.create(pickupX, pickupY, FUEL_PICKUP_KEY);
                if (pickup) {
                    pickup.setOrigin(0.5).setDepth(0);
                     // Убедимся, что размер пикапа соответствует ячейке
                    pickup.setDisplaySize(GRID_CELL_SIZE, GRID_CELL_SIZE);
                    // Добавим небольшую анимацию пульсации, если хотите
                    this.tweens.add({
                        targets: pickup,
                        scale: 1.1,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        duration: 700
                    });
                    occupiedCells[randomGridY][randomGridX] = true; // <<< Помечаем клетку как занятую
                    pickupSpawned = true;
                    console.log(`Fuel pickup spawned at grid (${randomGridX}, ${randomGridY})`);
                } else {
                    console.error("Failed to create fuel pickup sprite.");
                    break; // Выход из цикла, если спрайт не создался
                }
            }
            attempts++;
        }

        if (!pickupSpawned && attempts >= maxAttempts) {
            console.warn("Could not find a free cell to spawn the fuel pickup!");
        }
    }

    // --- <<< НОВАЯ ФУНКЦИЯ: Обновление отображения топлива ---
    updateFuelDisplay() {
        if (!this.fuelText || !this.fuelText.active) return;

        let fuelString = "FUEL: ";
        // // Этот вариант показывает красные первые 3 палки ВСЕГДА
        // for (let i = 0; i < INITIAL_FUEL; i++) {
        //     if (i < this.fuel) { // Если эта единица топлива есть
        //        fuelString += "I";
        //     } else {
        //        // Можно добавить пробел для пустого места: fuelString += " ";
        //     }
        // }
        // // Примечание: Phaser.Text не поддерживает раскраску отдельных символов легко.
        // // Этот код окрасит ВЕСЬ текст в красный, если топливо НИЖЕ порога.
        // if (this.fuel <= FUEL_LOW_THRESHOLD) {
        //     this.fuelText.setFill(FUEL_COLOR_LOW);
        // } else {
        //     this.fuelText.setFill(FUEL_COLOR_NORMAL);
        // }

        // --- Альтернативный, более простой вариант: Цифра + цвет при низком уровне ---
        fuelString = `FUEL: ${this.fuel}`;
        if (this.fuel <= FUEL_LOW_THRESHOLD) {
            this.fuelText.setFill(FUEL_COLOR_LOW); // Красный текст при низком топливе
        } else {
            this.fuelText.setFill(FUEL_COLOR_NORMAL); // Белый текст в норме
        }
        // --- Конец альтернативного варианта ---


        try {
            this.fuelText.setText(fuelString);
        } catch (e) {
            console.warn("Error updating fuel text:", e);
        }
    }

    // --- Обработка сбора куба ---
    handleCollectCube(car, cube) {
        if (!cube || !cube.active || this.levelComplete || this.gameOver) return;
        console.log(`Cube collected! Level ${this.currentLevel} Complete!`);
        this.levelComplete = true;
        this.hoveredArcZone = null;

        this.tweens.killTweensOf(cube); cube.destroy(); this.cube = null;

        if (this.isMoving && this.car?.body) {
            this.tweens.killTweensOf(this.car);
            this.car.body.stop();
             if (this.physics.world) this.physics.world.destination = null;
        }
        if (this.car?.body) this.car.body.enable = false;
        this.isMoving = false; // Останавливаем движение немедленно

        if(this.controlArcGraphics) this.controlArcGraphics.clear();
        if(this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if(this.ghostCar) this.ghostCar.setVisible(false);

        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.keyboard.enabled = false;

        if(this.winText) this.winText.setVisible(true);
        if(this.nextLevelButton) this.nextLevelButton.setVisible(true);
        if(this.cameras.main) this.cameras.main.flash(400, WIN_FLASH_COLOR);
        this.updateInfoText();

        if (this.winText) {
    // Проверяем, был ли это последний уровень
    if (this.currentLevel >= TOTAL_LEVELS) {
        // --- ПОБЕДА В ИГРЕ ---
        this.winText.setText('YOU WIN!').setVisible(true);
        // Показываем кнопку "Play Again" (использует STARTGAME.png)
        if (this.playAgainButton) { // Используем новую кнопку
            this.playAgainButton.setVisible(true);
        }
         // Скрываем кнопку "Next Level", если она вдруг есть
        if (this.nextLevelButton) {
             this.nextLevelButton.setVisible(false);
        }
    } else {
        // --- ЗАВЕРШЕНИЕ ОБЫЧНОГО УРОВНЯ ---
        this.winText.setText('LEVEL COMPLETE!').setVisible(true);
        // Показываем кнопку "Next Level" (NEXTLEVEL.png)
        if (this.nextLevelButton) {
            this.nextLevelButton.setVisible(true);
        }
         // Скрываем кнопку "Play Again"
        if (this.playAgainButton) { // Используем новую кнопку
             this.playAgainButton.setVisible(false);
        }
    }
}
    }
    
    // --- <<< НОВАЯ ФУНКЦИЯ: Обработка сбора топлива ---
    handleCollectFuelPickup(car, pickup) {
        if (!pickup || !pickup.active || this.levelComplete || this.gameOver) return;

        console.log("Collected fuel pickup!");

        // Удаляем пикап из карты занятых клеток, чтобы на его месте мог появиться новый
        const gridX = Math.floor(pickup.x / GRID_CELL_SIZE);
        const gridY = Math.floor(pickup.y / GRID_CELL_SIZE);
        if (this.occupiedCellsForSpawning && gridY >= 0 && gridY < this.gridHeightForSpawning && gridX >= 0 && gridX < this.gridWidthForSpawning) {
            this.occupiedCellsForSpawning[gridY][gridX] = false;
        }

        this.tweens.killTweensOf(pickup); // Останавливаем анимацию
        pickup.destroy(); // Уничтожаем собранный пикап

        // Добавляем топливо, но не больше максимума
        this.fuel = Math.min(this.fuel + FUEL_GAIN_ON_PICKUP, INITIAL_FUEL);
        console.log(`Fuel increased to: ${this.fuel}`);
        this.updateFuelDisplay(); // Обновляем UI
        this.updateInfoText(); // Обновляем дебаг текст

        // Спавним новый пикап
        this.spawnFuelPickup(this.occupiedCellsForSpawning, this.gridWidthForSpawning, this.gridHeightForSpawning);
    }


    // --- <<< НОВАЯ ФУНКЦИЯ: Запуск Game Over ---
    triggerGameOver(message) {
        if (this.gameOver || this.levelComplete) return; // Предотвращаем повторный запуск
        this.gameOver = true;
        this.isMoving = false;
        this.hoveredArcZone = null;
        console.log("GAME OVER:", message);

        // Останавливаем машину и анимации
        if (this.car) {
            this.tweens.killTweensOf(this.car);
            if (this.car.body) {
                this.car.body.stop();
                this.car.body.enable = false;
            }
        }
         if (this.physics.world) this.physics.world.destination = null;

        // Скрываем UI управления
        if(this.controlArcGraphics) this.controlArcGraphics.clear();
        if(this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if(this.ghostCar) this.ghostCar.setVisible(false);

        // Отключаем ввод
        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.keyboard.enabled = false;

        // Показываем сообщение о рестарте
        if (this.restartLevelText) {
            this.restartLevelText.setText(message).setVisible(true);
        }

        // Эффекты камеры
        if(this.cameras.main) {
            this.cameras.main.flash(FLASH_DURATION, FLASH_COLOR); // Используем красный цвет
            this.cameras.main.shake(SHAKE_DURATION, SHAKE_INTENSITY);
        }

        // Запланированный перезапуск сцены
        this.time.delayedCall(RESTART_DELAY, () => {
             if (this.scene.isActive(this.scene.key)) {
                 this.scene.restart(); // Перезапускаем текущую сцену
             }
        });
    }

    // --- Обработка столкновения ---
    handleCollision(car, obstacle) {
         // Срабатывает только если двигались, не в конце уровня/игры и объект - препятствие
         if (this.isMoving && !this.levelComplete && !this.gameOver && this.car?.body && this.obstaclesGroup && this.obstaclesGroup.contains(obstacle)) {
             console.log(`Collision detected!`);
             this.triggerGameOver(`CRASH! LEVEL ${this.currentLevel}`); // <<< Используем новую функцию
         }
    }

    // --- <<< НОВАЯ ФУНКЦИЯ: Обработка конца топлива ---
    handleOutOfFuel() {
        if (this.gameOver || this.levelComplete) return; // Дополнительная проверка
        console.log("Fuel depleted!");
        this.triggerGameOver(`OUT OF FUEL! LEVEL ${this.currentLevel}`); // <<< Используем новую функцию
    }


    // --- Переход на следующий уровень ---
    startNextLevel() {
        if (!this.levelComplete || this.currentLevel >= TOTAL_LEVELS) return;
        if (this.nextLevelButton) this.nextLevelButton.disableInteractive();
        console.log("Starting next level...");

        // Обновляем данные в реестре
        const nextLevel = this.currentLevel + 1;
        const nextObstacleThreshold = Math.max(MIN_OBSTACLE_THRESHOLD, this.currentObstacleThreshold - OBSTACLE_THRESHOLD_DECREMENT);
        this.registry.set('currentLevel', nextLevel);
        this.registry.set('obstacleThreshold', nextObstacleThreshold);

        if (this.scene.isActive(this.scene.key)) {
             this.scene.restart();
        }
    }


    // --- Расчет и отрисовка состояния ---
    calculateAndDrawState() {
        if (!this.car || !this.car.body) return;

        if (this.isMoving || this.levelComplete || this.gameOver) { // <<< Добавлена проверка gameOver
            if(this.controlArcGraphics) this.controlArcGraphics.clear();
            if(this.trajectoryGraphics) this.trajectoryGraphics.clear();
            if(this.ghostCar) this.ghostCar.setVisible(false);
            this.updateInfoText();
            return;
        };

        this.calculateArcGuiParams();
        this.drawControlArc();
        this.updateInfoText();
    }

    // =====================================================
    // --- ФУНКЦИИ АРКИ (Без изменений в логике отрисовки/расчета зон) ---
    // =====================================================

    calculateArcGuiParams() {
        if (!this.car) return;
        const speed = this.car.getData('speed') ?? MIN_SPEED;
        const normSpeed = Phaser.Math.Clamp((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

        const arcCenterX = this.car.x; const arcCenterY = this.car.y;

        const radiusFactor = SPEED_TO_GUI_RADIUS_FACTOR * normSpeed;
        const innerRadius = BASE_INNER_RADIUS_GUI + radiusFactor;

        const baseThick = ARC_THICKNESS_GUI;
        const thickReduce = baseThick * normSpeed * GUI_THICKNESS_REDUCTION_FACTOR;
        const arcThickness = Math.max(MIN_ARC_THICKNESS, baseThick - thickReduce);

        const outerRadius = innerRadius + arcThickness;
        const workingRadius = innerRadius + arcThickness * GREEN_ZONE_RATIO;
        const brakeZoneThickness = workingRadius - innerRadius;
        const neutralRadius = (brakeZoneThickness > 0) ? innerRadius + brakeZoneThickness / 2 : innerRadius;

        const angleReductionMultiplier = 1 / (normSpeed * (MAX_GUI_ANGLE_REDUCTION_FACTOR - 1) + 1);
        const angleDeg = Math.max(MIN_ARC_ANGLE_DEG, BASE_ANGLE_DEG * angleReductionMultiplier);
        const halfAngleRad = Phaser.Math.DegToRad(angleDeg / 2);

        this.arcParams = {
            centerX: arcCenterX, centerY: arcCenterY,
            innerRadius: Math.max(0, innerRadius),
            neutralRadius: Math.max(0, neutralRadius),
            workingRadius: Math.max(0, workingRadius),
            outerRadius: Math.max(0, outerRadius),
            halfAngleRad: halfAngleRad,
            orientationRad: carAngleRad
        };
    }

    fillAnnularSector(graphics, cx, cy, innerR, outerR, startA, endA, color, alpha) {
        if (!graphics || !isFinite(cx) || !isFinite(cy) || !isFinite(innerR) || !isFinite(outerR) || outerR <= innerR || innerR < 0) return;
        graphics.fillStyle(color, alpha); graphics.beginPath();
        graphics.arc(cx, cy, outerR, startA, endA, false); graphics.arc(cx, cy, innerR, endA, startA, true);
        graphics.closePath(); graphics.fillPath();
    }

      drawControlArc() {
        if (!this.controlArcGraphics || !this.car) return;
        const ap = this.arcParams;
        this.controlArcGraphics.clear();
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;
        const hovered = this.hoveredArcZone;

        const HOVER_ALPHA = ZONE_ALPHA_HOVER;
        const DEFAULT_RED_ALPHA = ZONE_ALPHA_DEFAULT;
        const DEFAULT_ACCEL_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_BRAKE_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_REVERSE_ALPHA = ZONE_ALPHA_DEFAULT + 0.2;

        if (ap && ap.outerRadius > ap.innerRadius && ap.halfAngleRad > 0 && ap.innerRadius >= 0) {
            const startAngle = ap.orientationRad - ap.halfAngleRad;
            const endAngle = ap.orientationRad + ap.halfAngleRad;

            if (ap.workingRadius < ap.outerRadius && !redCooldownActive) {
                const redInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
                if (redInnerRadius < ap.outerRadius) {
                    const alpha = (hovered === 'red') ? HOVER_ALPHA : DEFAULT_RED_ALPHA;
                    this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, redInnerRadius, ap.outerRadius, startAngle, endAngle, COLOR_RED, alpha);
                }
            }

            if (ap.neutralRadius < ap.workingRadius && !accelIsDisabled) {
                 const alpha = (hovered === 'accelerate') ? HOVER_ALPHA : DEFAULT_ACCEL_ALPHA;
                this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.neutralRadius, ap.workingRadius, startAngle, endAngle, COLOR_ACCELERATE, alpha);
            }

            if (ap.innerRadius < ap.neutralRadius) {
                 const alpha = (hovered === 'brake') ? HOVER_ALPHA : DEFAULT_BRAKE_ALPHA;
                this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.innerRadius, ap.neutralRadius, startAngle, endAngle, COLOR_BRAKE, alpha);
            }
        }

        if (currentSpeed === MIN_SPEED) {
            const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
            const reverseOrientationRad = carAngleRad + Math.PI;
            const halfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const startAngleRev = reverseOrientationRad - halfReverseAngleRad;
            const endAngleRev = reverseOrientationRad + halfReverseAngleRad;
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            const alpha = (hovered === 'reverse') ? HOVER_ALPHA : DEFAULT_REVERSE_ALPHA;
            this.fillAnnularSector(
                this.controlArcGraphics, this.car.x, this.car.y,
                innerRRev, outerRRev, startAngleRev, endAngleRev,
                COLOR_REVERSE, alpha
            );
        }
    }

    getArcZoneForPoint(pointX, pointY) {
        if (!this.car || this.gameOver || this.levelComplete) return null; // <<< Добавлена проверка gameOver/levelComplete
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        const dx = pointX - this.car.x;
        const dy = pointY - this.car.y;
        const distSqr = dx * dx + dy * dy;
        const pointAngleRad = Math.atan2(dy, dx);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

        if (currentSpeed === MIN_SPEED) {
            const reverseOrientationRad = carAngleRad + Math.PI;
            const halfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            if (distSqr >= innerRRev * innerRRev && distSqr <= outerRRev * outerRRev) {
                const relativeAngleRadRev = Phaser.Math.Angle.Wrap(pointAngleRad - reverseOrientationRad);
                if (Math.abs(relativeAngleRadRev) <= halfReverseAngleRad) {
                    return 'reverse';
                }
            }
        }

        const ap = this.arcParams;
        if (!ap || ap.innerRadius < 0 || ap.outerRadius <= ap.innerRadius) return null;

        if (distSqr < ap.innerRadius * ap.innerRadius || distSqr > ap.outerRadius * ap.outerRadius) {
            return null;
        }
        const relativeAngleRadFwd = Phaser.Math.Angle.Wrap(pointAngleRad - ap.orientationRad);
        if (Math.abs(relativeAngleRadFwd) > ap.halfAngleRad) {
            return null;
        }

        const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;

        if (distSqr <= ap.neutralRadius * ap.neutralRadius) {
            return 'brake';
        } else if (distSqr <= ap.workingRadius * ap.workingRadius) {
            return accelIsDisabled ? null : 'accelerate';
        } else if (distSqr < actualRedInnerRadius * actualRedInnerRadius) {
             return null;
        } else {
            return redCooldownActive ? null : 'red';
        }
    }

    // --- Обработка движения мыши (Обновление UI) ---
    handlePointerMove(pointer) {
         // Не обновляем, если идет движение, игра закончена или машина неактивна
         if (this.isMoving || this.levelComplete || this.gameOver || !this.car) {
             // Если зона была подсвечена, убираем подсветку
             if (this.hoveredArcZone !== null) {
                 this.hoveredArcZone = null;
                 // Перерисовываем арку без подсветки, только если игра еще идет
                 if (this.controlArcGraphics && !this.isMoving && !this.levelComplete && !this.gameOver) {
                    this.calculateAndDrawState(); // Пересчитать и перерисовать все
                 }
             }
             // Скрываем призрак и траекторию
             if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
             if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
             return;
         }

         // Если игра идет и мы не двигаемся
         if (!this.trajectoryGraphics || !this.ghostCar || !this.controlArcGraphics) return;

         const pointerX = pointer.worldX; const pointerY = pointer.worldY;
         const newZone = this.getArcZoneForPoint(pointerX, pointerY);

         // Если зона изменилась, обновляем ховер и перерисовываем арку
         if (newZone !== this.hoveredArcZone) {
             this.hoveredArcZone = newZone;
             this.drawControlArc(); // Просто перерисовать арку с новым ховером
         }

         // Показываем призрак и траекторию, если над активной зоной
         if (this.hoveredArcZone) {
             let targetX, targetY, targetAngleRad;
             const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

             if (this.hoveredArcZone === 'reverse') {
                 const reverseAngleRad = carAngleRad + Math.PI;
                 targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                 targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                 targetAngleRad = carAngleRad;
             } else {
                 const targetData = this.calculateTargetFromArcPoint(pointerX, pointerY);
                 if (targetData) {
                     targetX = targetData.targetX;
                     targetY = targetData.targetY;
                     targetAngleRad = targetData.targetAngleRad;
                 } else {
                     if (this.ghostCar) this.ghostCar.setVisible(false);
                     if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
                      return;
                 }
             }

             this.ghostCar.setPosition(targetX, targetY).setAngle(Phaser.Math.RadToDeg(targetAngleRad)).setVisible(true);
             this.drawTrajectory(this.car.x, this.car.y, targetX, targetY);

         } else {
             if (this.ghostCar) this.ghostCar.setVisible(false);
             if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
         }
     }

    // --- Отрисовка траектории (Без изменений) ---
    drawTrajectory(startX, startY, endX, endY) {
        if (!this.trajectoryGraphics) return;
        this.trajectoryGraphics.clear().lineStyle(2, TRAJECTORY_COLOR, TRAJECTORY_ALPHA);
        const dist = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
        const dashLen = TRAJECTORY_DASH_LENGTH;
        const gapLen = TRAJECTORY_GAP_LENGTH;
        const totalPatternLen = dashLen + gapLen;
        let currentDist = 0;
        this.trajectoryGraphics.beginPath();
        while (currentDist < dist) {
            const dStartX = startX + Math.cos(angle) * currentDist;
            const dStartY = startY + Math.sin(angle) * currentDist;
            const dEndX = startX + Math.cos(angle) * Math.min(currentDist + dashLen, dist);
            const dEndY = startY + Math.sin(angle) * Math.min(currentDist + dashLen, dist);
            this.trajectoryGraphics.moveTo(dStartX, dStartY).lineTo(dEndX, dEndY);
            currentDist += totalPatternLen;
        }
        this.trajectoryGraphics.strokePath();
    }

    // --- Расчет цели из точки на арке (Без изменений) ---
    calculateTargetFromArcPoint(arcPointX, arcPointY) {
        if (!this.car || this.arcParams?.innerRadius === undefined) return null;
        const ap = this.arcParams;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        const targetAngleRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, arcPointX, arcPointY);
        const clickDistanceCarCenter = Phaser.Math.Distance.Between(this.car.x, this.car.y, arcPointX, arcPointY);

        let relativeClickDistOverallArc = 0.5;
        const arcThickness = ap.outerRadius - ap.innerRadius;
        if (arcThickness > 0) {
            relativeClickDistOverallArc = Phaser.Math.Clamp((clickDistanceCarCenter - ap.innerRadius) / arcThickness, 0, 1);
        }

        let relativeClickDistInWorkingZone = 0;
        const workingZoneThickness = ap.workingRadius - ap.innerRadius;
        if (workingZoneThickness > 0) {
            const distFromNeutral = clickDistanceCarCenter - ap.neutralRadius;
            const halfWorkingThickness = workingZoneThickness / 2;
            if (halfWorkingThickness > 0) {
                 relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfWorkingThickness, -1, 1);
            }
        }

        const currentMidRadius = ap.innerRadius + arcThickness / 2;
        const baseDist = Phaser.Math.Linear(MIN_MOVE_DISTANCE_FACTOR * currentMidRadius, MAX_MOVE_DISTANCE_FACTOR * currentMidRadius, relativeClickDistOverallArc);
        const totalMoveDist = baseDist + currentSpeed * SPEED_TO_DISTANCE_MULTIPLIER;

        const targetX = this.car.x + Math.cos(targetAngleRad) * totalMoveDist;
        const targetY = this.car.y + Math.sin(targetAngleRad) * totalMoveDist;

        return {
            targetX, targetY, targetAngleRad,
            relativeClickDistOverallArc: relativeClickDistOverallArc,
            relativeClickDistInWorkingZone: relativeClickDistInWorkingZone
        };
    }

    // --- Обработка клика по сцене (Инициирует ход) ---
    handleSceneClick(pointer) {
         // Не обрабатываем клик, если идет движение или игра закончена
         if (this.isMoving || this.levelComplete || this.gameOver || !this.car) return;
         const clickX = pointer.worldX; const clickY = pointer.worldY;

         const clickArcZone = this.getArcZoneForPoint(clickX, clickY);

         if (clickArcZone) {
            // <<< ПРОВЕРКА ТОПЛИВА ПЕРЕД ХОДОМ
            if (this.fuel <= 0) {
                console.log("Attempted move with zero fuel.");
                this.handleOutOfFuel(); // Немедленно вызываем конец игры
                return; // Не выполняем ход
            }
            // Топливо есть, продолжаем

             if (clickArcZone === 'reverse') {
                 console.log("Clicked REVERSE arc");
                 const reverseAngleRad = Phaser.Math.DegToRad(this.car.angle + 180);
                 const targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                 const targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                 this.handleReverseMove(targetX, targetY);
             } else {
                 const targetData = this.calculateTargetFromArcPoint(clickX, clickY);
                 if (targetData) {
                     this.handleMove(
                         targetData.targetX, targetData.targetY,
                         clickArcZone, // 'brake', 'accelerate', 'red'
                         targetData.relativeClickDistOverallArc,
                         targetData.relativeClickDistInWorkingZone
                     );
                 } else {
                     console.warn("Could not calculate target from FORWARD arc click despite active zone.");
                 }
             }
         }
     }

    // --- Обработка основного хода (Вперед) ---
    handleMove(targetX, targetY, clickArcZone, relativeClickDistOverallArc, relativeClickDistInWorkingZone) {
        if (this.isMoving || this.levelComplete || this.gameOver || !this.car?.body) return;

        // <<< ПРОВЕРКА И РАСХОД ТОПЛИВА (Повторная проверка на всякий случай)
        if (this.fuel <= 0) {
            this.handleOutOfFuel();
            return;
        }
        this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
        console.log(`Fuel consumed. Remaining: ${this.fuel}`);
        this.updateFuelDisplay();
        this.updateInfoText();
        // --- Конец проверки топлива ---

        this.hoveredArcZone = null;
        this.isMoving = true;
        if(this.controlArcGraphics) this.controlArcGraphics.clear();
        if(this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if(this.ghostCar) this.ghostCar.setVisible(false);

        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        let speedForNextTurn = currentSpeed;

        if (clickArcZone === 'accelerate' || clickArcZone === 'brake') {
             const speedFactor = (relativeClickDistInWorkingZone < 0) ? 0.5 : 1.0;
             const speedChange = relativeClickDistInWorkingZone * SPEED_INCREMENT * speedFactor;
             speedForNextTurn = currentSpeed + speedChange;
              this.car.setData('nextRedCooldown', undefined);
              this.car.setData('nextAccelDisabled', undefined);
             console.log(`FORWARD Move: Click in ${clickArcZone} (RelPos: ${relativeClickDistInWorkingZone.toFixed(2)}). Speed change: ${speedChange.toFixed(2)}`);
        } else if (clickArcZone === 'red') {
             console.log(`FORWARD Move: Click in RED zone. Applying boost!`);
             speedForNextTurn = currentSpeed + RED_ZONE_SPEED_BOOST;
             this.car.setData('nextRedCooldown', RED_ZONE_COOLDOWN_TURNS);
             this.car.setData('nextAccelDisabled', true);
        }

        speedForNextTurn = Phaser.Math.Clamp(speedForNextTurn, MIN_SPEED, MAX_SPEED);
        this.car.setData('nextSpeed', speedForNextTurn);
        console.log(`FORWARD Move End: Next Turn Planned - Speed: ${speedForNextTurn.toFixed(2)}, Next Red CD: ${this.car.getData('nextRedCooldown')}, Next Accel Disabled: ${this.car.getData('nextAccelDisabled')}`);

        // --- Запуск физического движения и поворота ---
        const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);

        const currentAngleDeg = this.car.angle;
        const angleToTargetRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, targetX, targetY);
        const rawTargetAngleDeg = Phaser.Math.RadToDeg(angleToTargetRad);
        const shortestAngleDiff = Phaser.Math.Angle.ShortestBetween(currentAngleDeg, rawTargetAngleDeg);
        const finalAngleDeg = currentAngleDeg + shortestAngleDiff;
        console.log(`Rotation: Current=${currentAngleDeg.toFixed(1)}, RawTarget=${rawTargetAngleDeg.toFixed(1)}, Diff=${shortestAngleDiff.toFixed(1)}, FinalTarget=${finalAngleDeg.toFixed(1)}`);
        this.tweens.add({
            targets: this.car,
            angle: finalAngleDeg,
            duration: TURN_DURATION,
            ease: 'Linear'
        });

        const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const animationSpeedMultiplier = Phaser.Math.Linear(MIN_ANIM_SPEED_MULTIPLIER, MAX_ANIM_SPEED_MULTIPLIER, normCurrentSpeed);
        const baseAnimSpeed = moveDistance * BASE_PHYSICS_MOVE_SPEED_FACTOR;
        const clickPosBonus = (1 + relativeClickDistOverallArc * CLICK_POS_ANIM_SPEED_FACTOR);
        const desiredPhysicsSpeed = baseAnimSpeed * clickPosBonus * animationSpeedMultiplier;
        const finalAnimSpeed = Math.max(desiredPhysicsSpeed, MIN_VISUAL_ANIM_SPEED);
        console.log(`Animation Speed Calculation: normCurrentSpeed=${normCurrentSpeed.toFixed(2)}, animMultiplier=${animationSpeedMultiplier.toFixed(2)}, baseAnim=${baseAnimSpeed.toFixed(2)}, clickBonus=${clickPosBonus.toFixed(2)}, finalAnimSpeed=${finalAnimSpeed.toFixed(2)}`);

        this.physics.moveTo(this.car, targetX, targetY, finalAnimSpeed);
        if (this.physics.world) this.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);

        // <<< Проверка на конец топлива СРАЗУ ПОСЛЕ НАЧАЛА ДВИЖЕНИЯ (если вдруг это был последний юнит)
        if (this.fuel <= 0) {
            // Не вызываем game over сразу, даем машине доехать ход,
            // проверка будет в update при достижении цели.
            console.log("Fuel reached zero during this move.");
        }
    }

    // --- Обработка хода назад ---
    handleReverseMove(targetX, targetY) {
        if (this.isMoving || this.levelComplete || this.gameOver || !this.car?.body) return;
        if (this.car.getData('speed') !== MIN_SPEED) {
            console.warn("Attempted reverse move but speed is not MIN_SPEED!");
            return;
        }

        // <<< ПРОВЕРКА И РАСХОД ТОПЛИВА
        if (this.fuel <= 0) {
            this.handleOutOfFuel();
            return;
        }
        this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
        console.log(`Fuel consumed (Reverse). Remaining: ${this.fuel}`);
        this.updateFuelDisplay();
        this.updateInfoText();
        // --- Конец проверки топлива ---


        console.log("Executing REVERSE Move");
        this.hoveredArcZone = null;
        this.isMoving = true;
        if(this.controlArcGraphics) this.controlArcGraphics.clear();
        if(this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if(this.ghostCar) this.ghostCar.setVisible(false);
        // this.updateInfoText(); // Уже вызван

        this.car.setData('nextSpeed', MIN_SPEED);
        this.car.setData('nextRedCooldown', 0);
        this.car.setData('nextAccelDisabled', false);
        console.log(`REVERSE Move: Next Turn Planned - Speed: ${MIN_SPEED.toFixed(2)}, Resetting Cooldowns.`);

        this.physics.moveTo(this.car, targetX, targetY, REVERSE_SPEED_ANIMATION);
        if (this.physics.world) this.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);

         // <<< Проверка на конец топлива СРАЗУ ПОСЛЕ НАЧАЛА ДВИЖЕНИЯ
         if (this.fuel <= 0) {
             console.log("Fuel reached zero during this reverse move.");
         }
    }

    // =====================================================
    // --- КОНЕЦ ФУНКЦИЙ АРКИ ---
    // =====================================================


    // --- Update цикл ---
    update(time, delta) {
         // Не обновляем логику движения, если игра закончена
         if (this.gameOver || this.levelComplete || !this.car || !this.car.body || !this.car.active) return;

         if (this.isMoving && this.physics.world?.destination) {
             const destination = this.physics.world.destination;
             const distanceToTarget = Phaser.Math.Distance.Between(this.car.x, this.car.y, destination.x, destination.y);
             const speed = this.car.body.velocity.length();

             // Условие остановки
             if (distanceToTarget < STOP_DISTANCE_THRESHOLD || (speed < MIN_STOP_SPEED && speed > 0) ) {

                 this.car.body.reset(destination.x, destination.y);
                 this.physics.world.destination = null;

                 // Применение состояния для СЛЕДУЮЩЕГО хода
                 const nextSpeed = this.car.getData('nextSpeed');
                 const nextRedCooldown = this.car.getData('nextRedCooldown');
                 const nextAccelDisabled = this.car.getData('nextAccelDisabled');

                 if (nextSpeed !== undefined) {
                     this.car.setData('speed', nextSpeed);
                 }

                 let currentRedCooldown = this.car.getData('redCooldown') ?? 0;
                 if (nextRedCooldown !== undefined) {
                     currentRedCooldown = nextRedCooldown;
                 } else if (currentRedCooldown > 0) {
                     currentRedCooldown--;
                 }
                 this.car.setData('redCooldown', currentRedCooldown);

                 const accelDisabledForThisTurn = nextAccelDisabled === true;
                 this.car.setData('accelDisabled', accelDisabledForThisTurn);

                 this.car.setData('nextSpeed', undefined);
                 this.car.setData('nextRedCooldown', undefined);
                 this.car.setData('nextAccelDisabled', undefined);

                 this.isMoving = false; // Завершили ход
                 console.log("Turn finished. Ready for next input.");

                 // <<< ПРОВЕРКА НА КОНЕЦ ТОПЛИВА ПОСЛЕ ОСТАНОВКИ
                 if (this.fuel <= 0 && !this.gameOver && !this.levelComplete) {
                     this.handleOutOfFuel();
                     return; // Выходим из update, т.к. игра закончилась
                 }
                 // --- Конец проверки топлива ---

                 // Обновляем состояние UI после остановки, если игра продолжается
                 if (this.scene.isActive(this.scene.key) && !this.levelComplete && !this.gameOver) {
                     const pointer = this.input.activePointer;
                     this.hoveredArcZone = this.getArcZoneForPoint(pointer.worldX, pointer.worldY); // Обновляем ховер
                     this.calculateAndDrawState(); // Перерисовать арку с новым состоянием
                     this.handlePointerMove(pointer); // Обновить призрак/траекторию согласно новому состоянию
                 } else {
                     this.updateInfoText(); // Обновить текст, если игра закончена/неактивна
                 }
             }
         } else if (!this.isMoving) {
              // Если стоим и игра идет, обновляем инфо (полезно для debug клавиш)
              this.updateInfoText();
         }
     }

    // --- Обновление текста информации ---
    updateInfoText() {
        if (!this.infoText || !this.car || !this.infoText.active) return;
        const speed = this.car.getData('speed') ?? 0;
        const redCooldown = this.car.getData('redCooldown') ?? 0;
        const accelDisabled = this.car.getData('accelDisabled') ?? false;
        const currentFuel = this.fuel; // <<< Получаем текущее топливо

        let statusText = '';
        if (this.gameOver) {
             statusText = 'GAME OVER';
        } else if (this.levelComplete) {
            statusText = 'Level Complete!';
        } else if (this.isMoving) {
            statusText = 'Moving...';
        } else {
            statusText = 'Ready for input';
        }

        let cooldownText = redCooldown > 0 ? ` | Red CD: ${redCooldown}` : '';
        let accelText = accelDisabled ? ' | ACCEL OFF' : '';

        const textLines = [
            `Speed: ${speed.toFixed(1)}${cooldownText}${accelText}`,
            `Fuel: ${currentFuel}`, // <<< Добавляем строку с топливом
            // `Threshold: ${this.currentObstacleThreshold.toFixed(2)}`, // Раскомментировать для отладки порога
            statusText,
            // 'Arrows: Debug Speed/Angle',
            // 'P: Debug Skip Level',
            // 'R: Debug Reset Threshold',
            // 'F: Debug Add Fuel' // <<< Можно добавить для отладки
        ];
        try {
            if (this.infoText.active) {
                this.infoText.setText(textLines);
            }
        } catch (e) {
            console.warn("Error updating info text:", e);
        }
    }


    // --- Настройка отладочных клавиш ---
    setupDebugControls() {
        if (!this.input?.keyboard) { console.warn("Keyboard input not available"); return; }
        this.input.keyboard.off('keydown-W');
        this.input.keyboard.off('keydown-S');
        this.input.keyboard.off('keydown-A');
        this.input.keyboard.off('keydown-D');
        this.input.keyboard.off('keydown-P');
        this.input.keyboard.off('keydown-R');
        this.input.keyboard.off('keydown-F'); // <<< Убираем старый обработчик, если был

        const checkDebugInput = () => this.car?.active && !this.isMoving && !this.levelComplete && !this.gameOver;

        this.input.keyboard.on('keydown-W', () => {
            if (!checkDebugInput()) return;
            let s = Phaser.Math.Clamp((this.car.getData('speed') ?? MIN_SPEED) + 0.5, MIN_SPEED, MAX_SPEED);
            this.car.setData('speed', s);
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-S', () => {
            if (!checkDebugInput()) return;
            let s = Phaser.Math.Clamp((this.car.getData('speed') ?? MIN_SPEED) - 0.5, MIN_SPEED, MAX_SPEED);
            this.car.setData('speed', s);
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-A', () => {
            if (!checkDebugInput()) return;
            this.car.angle -= 15;
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-D', () => {
            if (!checkDebugInput()) return;
            this.car.angle += 15;
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-P', () => { // Skip Level
            if (checkDebugInput() && this.cube?.active) {
                console.log("Debug: Skipping level...");
                this.handleCollectCube(this.car, this.cube);
            }
        });
        this.input.keyboard.on('keydown-R', () => { // Reset Threshold in Registry
            console.log("Debug: Resetting obstacle threshold in registry to initial value for next level restart.");
            this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
            // this.updateInfoText(); // Обновим текст, если там отображается порог
        });
        // <<< Добавим клавишу F для добавления топлива (отладка)
        this.input.keyboard.on('keydown-F', () => {
             if (checkDebugInput()) {
                 this.fuel = Math.min(this.fuel + 5, INITIAL_FUEL); // Добавляем 5 единиц
                 console.log(`Debug: Added fuel. Current: ${this.fuel}`);
                 this.updateFuelDisplay();
                 this.updateInfoText();
             }
        });
    }

} // --- Конец класса GameScene ---


// ==============================
// --- КОНФИГУРАЦИЯ PHASER ---
// ==============================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'phaser-game',
    scene: [MainMenuScene, GameScene], // Запускаем с меню
    antialias: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false // Поставьте true для отладки физики
        }
    },
    resolution: window.devicePixelRatio || 1,
    render: {
        pixelArt: false
    }
};

// ====================
// --- ЗАПУСК ИГРЫ ---
// ====================
window.onload = () => {
    if (typeof SimplexNoise === 'undefined') {
        console.error("SimplexNoise library is not loaded! Check index.html.");
        const gameContainer = document.getElementById('phaser-game');
        if(gameContainer) {
             gameContainer.innerHTML = '<div style="color: red; padding: 20px; border: 1px solid red; font-family: sans-serif;">Error: SimplexNoise library not found. Please check index.html.</div>';
        }
    } else {
        const game = new Phaser.Game(config);
        console.log("Phaser Game instance created.");
    }
};
