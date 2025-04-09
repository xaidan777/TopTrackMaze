// ==========================================
// --- КОНСТАНТЫ И НАСТРОЙКИ (Обновленные) ---
// ==========================================

// --- Размеры и сетка ---
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 1024;
const GRID_CELL_SIZE = 32; // Должно совпадать с размером block.png и fuel.png

// --- Цвета и прозрачность ---
const COLOR_BRAKE = 0xaaaaaa;    // Серый ( для торможения)
const COLOR_ACCELERATE = 0xadd6dd; // Голубой (для ускорения)
const COLOR_RED = 0x3dc9b0;      // Красный (перегрев/буст)
const COLOR_REVERSE = 0xffa500;  // Оранжевый (задний ход)

const ZONE_ALPHA_DEFAULT = 0.3;  
const ZONE_ALPHA_HOVER = 1.0;  
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
const BASE_PHYSICS_MOVE_SPEED_FACTOR = 1.0;
const CLICK_POS_ANIM_SPEED_FACTOR = 0.8;
const MIN_ANIM_SPEED_MULTIPLIER = 0.8;
const MAX_ANIM_SPEED_MULTIPLIER = 3.5;
const MIN_VISUAL_ANIM_SPEED = 50;
const TURN_DURATION = 300;
const STOP_DISTANCE_THRESHOLD = 5;
const MIN_STOP_SPEED = 0;

// --- Параметры движения ЗАДНИМ ХОДОМ ---
const REVERSE_MOVE_DISTANCE = GRID_CELL_SIZE * 1.25;
const REVERSE_SPEED_ANIMATION = 50;

// --- Параметры генерации уровня ---
const NOISE_SCALE = 150;
const START_AREA_CLEAR_RADIUS_FACTOR = 3;

// (Вместо CUBE_COLOR и CUBE_TEXTURE_KEY вводим нормальный ключ портала)
const PORTAL_KEY = 'portal';

// --- Параметры препятствий и другие ---
const CUBE_SIZE_FACTOR = 0.8; // если надо масштабировать
const OBSTACLE_THRESHOLD_DECREMENT = 0.05;
const MIN_OBSTACLE_THRESHOLD = 0.2;
const TOTAL_LEVELS = 10;
const INITIAL_OBSTACLE_THRESHOLD = 0.7;

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
const INITIAL_FUEL = 10;
const FUEL_CONSUMPTION_PER_MOVE = 1;
const FUEL_GAIN_ON_PICKUP = 5;
const FUEL_LOW_THRESHOLD = 3;
const FUEL_COLOR_NORMAL = '#ffffff';
const FUEL_COLOR_LOW = '#ff0000';

// --- Параметры эффектов ---
const FLASH_DURATION = 300;
const FLASH_COLOR = 0xff0000;
const WIN_FLASH_COLOR = 0x00ff00;
const SHAKE_DURATION = 300;
const SHAKE_INTENSITY = 0.01;
const RESTART_DELAY = 1000;


// ==============================
// --- КЛАСС СЦЕНЫ ГЛАВНОГО МЕНЮ ---
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
                this.car = null;
        this.controlArcGraphics = null;
        this.trajectoryGraphics = null;
        this.ghostCar = null;
        this.infoText = null;
        this.levelText = null;
        this.fuelText = null;
        this.arcParams = {};
        this.isMoving = false;
        this.obstaclesGroup = null;
        this.collectibleGroup = null;
        this.fuelPickupGroup = null;
        this.cube = null;
        this.noise = null;
        this.winText = null;
        this.nextLevelButton = null;
        this.restartLevelText = null;
        this.levelComplete = false;
        this.playAgainButton = null;
        this.gameOver = false;
        this.hoveredArcZone = null;
        this.backgroundTile = null;
        this.restartButtonObject = null;
                this.prevDistanceToTarget = undefined;

        this.currentLevel = 1;
        this.currentObstacleThreshold = INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL;

        this.occupiedCellsForSpawning = null;
        this.gridWidthForSpawning = 0;
        this.gridHeightForSpawning = 0;
    }

    startNewGame() {
        console.log("Starting New Game from Win screen...");
        this.registry.set('currentLevel', 1);
        this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);

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
        this.load.image(FUEL_PICKUP_KEY, 'assets/fuel.png');

        // Подгружаем портал (иконка) под нормальным строковым ключом
        this.load.image(PORTAL_KEY, 'assets/portal.png');
    }

    create() {
        this.movesHistory = [];  // Очищаем историю перед каждым новым уровнем
        console.log("Phaser version:", Phaser.VERSION);
        // Достаём данные из реестра
        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.currentObstacleThreshold = this.registry.get('obstacleThreshold') || INITIAL_OBSTACLE_THRESHOLD;

        console.log(`Creating scene for Level ${this.currentLevel}... Obstacle Threshold: ${this.currentObstacleThreshold.toFixed(2)}`);
        this.isMoving = false;
        this.levelComplete = false;
        this.gameOver = false;
        this.hoveredArcZone = null;
        this.fuel = INITIAL_FUEL;

        if (typeof SimplexNoise === 'undefined') {
            console.error("SimplexNoise library not found!");
            this.add.text(
                GAME_WIDTH / 2, GAME_HEIGHT / 2,
                "Error: SimplexNoise library not loaded!",
                {
                    color: 'red', fontSize: '20px', backgroundColor: 'black',
                    align: 'center', padding: 10
                }
            ).setOrigin(0.5);
            return;
        }
        this.noise = new SimplexNoise();

        // Фон (tileSprite)
        this.backgroundTile = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, SAND_TEXTURE_KEY)
            .setOrigin(0, 0)
            .setDepth(-20);

        // Группы
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.collectibleGroup = this.physics.add.group();
        this.fuelPickupGroup = this.physics.add.group();

        // Генерируем уровень
        this.createLevel();

        // Машина
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

        // Спавним пикап топлива
        for (let i = 0; i < 2; i++) {
            this.spawnFuelPickup(
                this.occupiedCellsForSpawning, 
                this.gridWidthForSpawning, 
                this.gridHeightForSpawning
            );
        }

        // Графика арки и траектории
        this.controlArcGraphics = this.add.graphics().setDepth(5);
        this.trajectoryGraphics = this.add.graphics().setDepth(6);
        this.ghostCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
            .setOrigin(0.5, 0.5).setScale(this.car.scale)
            .setAlpha(GHOST_ALPHA).setVisible(false).setDepth(7);

        // Тексты
        this.infoText = this.add.text(10, 10, '', {
            font: '16px Courier New',
            fill: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)'
        }).setDepth(20);

        this.levelText = this.add.text(200, 5, `Level ${this.currentLevel} / ${TOTAL_LEVELS}`, {
            font: 'bold 20px Courier New',
            fill: '#ffffff',
            align: 'left',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0).setDepth(21);

        this.fuelText = this.add.text(GAME_WIDTH / 2, 5, '', {
            font: 'bold 24px "Courier New", Courier, monospace',
            fill: FUEL_COLOR_NORMAL,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(21);
        this.updateFuelDisplay();

        // Кнопка "Играть снова" (для экрана последнего уровня)
        this.playAgainButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, START_BUTTON_KEY)
            .setOrigin(0.5)
            .setDepth(25)
            .setScale(0.8)
            .setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.startNewGame, this);

        // Кнопка "Рестарт уровня"
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
        this.winText = this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50,
            'LEVEL COMPLETE!', {
                font: 'bold 48px Courier New',
                fill: '#ffff00',
                stroke: '#634125',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(25).setVisible(false);

        // Кнопка перехода на следующий уровень
        this.nextLevelButton = null;
        if (this.currentLevel < TOTAL_LEVELS) {
            this.nextLevelButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, NEXT_LEVEL_BUTTON_KEY)
                .setOrigin(0.5)
                .setScale(0.75)
                .setDepth(25)
                .setVisible(false)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', this.startNextLevel, this);
        }

        // Текст "Game Over" (при столкновении/нет топлива)
        this.restartLevelText = this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, '',
            {
                font: 'bold 48px Courier New',
                fill: '#ffff00',
                stroke: '#634125',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(26).setVisible(false);

        // Ввод мыши
        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handleSceneClick, this);
        this.input.on('pointermove', this.handlePointerMove, this);

        // Физические столкновения
        this.physics.add.overlap(this.car, this.obstaclesGroup, this.handleCollision, null, this);
        this.physics.add.overlap(this.car, this.collectibleGroup, this.handleCollectCube, null, this);
        this.physics.add.overlap(this.car, this.fuelPickupGroup, this.handleCollectFuelPickup, null, this);

        // Первая отрисовка
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
        if (this.fuelPickupGroup) this.fuelPickupGroup.clear(true, true);

        if (!this.noise) {
            console.error("Noise generator not initialized!");
            return;
        }
        const noiseGenerator = this.noise;
        const scale = NOISE_SCALE;
        const threshold = this.currentObstacleThreshold;
        const startClearRadius = GRID_CELL_SIZE * START_AREA_CLEAR_RADIUS_FACTOR;

        const gridWidth = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);
        const gridHeight = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);
        if (gridHeight <= 0 || gridWidth <= 0) {
            console.error("Invalid grid dimensions calculated:", gridWidth, gridHeight);
            return;
        }
        const occupiedCells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

        // Стартовая зона вокруг машины
        const startGridX = Math.floor(GAME_WIDTH / 2 / GRID_CELL_SIZE);
        const startGridY = Math.floor(GAME_HEIGHT / 2 / GRID_CELL_SIZE);
        const clearRadiusGrid = Math.ceil(startClearRadius / GRID_CELL_SIZE);
        for (let dy = -clearRadiusGrid; dy <= clearRadiusGrid; dy++) {
            for (let dx = -clearRadiusGrid; dx <= clearRadiusGrid; dx++) {
                const checkX = startGridX + dx;
                const checkY = startGridY + dy;
                if (
                    checkX >= 0 && checkX < gridWidth &&
                    checkY >= 0 && checkY < gridHeight
                ) {
                    if (
                        Phaser.Math.Distance.Between(
                            startGridX, startGridY,
                            checkX, checkY
                        ) <= clearRadiusGrid
                    ) {
                        occupiedCells[checkY][checkX] = true;
                    }
                }
            }
        }

        // Препятствия из Simplex Noise
        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const cellCenterX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                if (occupiedCells[gy][gx]) continue; // Занятая ячейка

                if (noiseGenerator.noise2D(cellCenterX / scale, cellCenterY / scale) > threshold) {
                    if (this.obstaclesGroup) {
                        this.obstaclesGroup.create(cellCenterX, cellCenterY, OBSTACLE_IMAGE_KEY);
                    }
                    occupiedCells[gy][gx] = true;
                }
            }
        }
        console.log(`Generated ${this.obstaclesGroup ? this.obstaclesGroup.getLength() : 0} obstacles from noise.`);

        // Границы
        let borderObstaclesCount = 0;
        if (this.obstaclesGroup) {
            for (let gx = 0; gx < gridWidth; gx++) {
                if (gridHeight <= 0) break;
                const topX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const topY = GRID_CELL_SIZE / 2;
                const bottomY = (gridHeight - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                
                if (!occupiedCells[0][gx]) {
                    this.obstaclesGroup.create(topX, topY, OBSTACLE_IMAGE_KEY);
                    occupiedCells[0][gx] = true; 
                    borderObstaclesCount++;
                }
                if (gridHeight > 1 && !occupiedCells[gridHeight - 1][gx]) {
                    this.obstaclesGroup.create(topX, bottomY, OBSTACLE_IMAGE_KEY);
                    occupiedCells[gridHeight - 1][gx] = true;
                    borderObstaclesCount++;
                }
            }
            for (let gy = 1; gy < gridHeight - 1; gy++) {
                if (gridWidth <= 0) break;
                const leftX = GRID_CELL_SIZE / 2;
                const leftY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const rightX = (gridWidth - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                
                if (!occupiedCells[gy][0]) {
                    this.obstaclesGroup.create(leftX, leftY, OBSTACLE_IMAGE_KEY);
                    occupiedCells[gy][0] = true;
                    borderObstaclesCount++;
                }
                if (gridWidth > 1 && !occupiedCells[gy][gridWidth - 1]) {
                    this.obstaclesGroup.create(rightX, leftY, OBSTACLE_IMAGE_KEY);
                    occupiedCells[gy][gridWidth - 1] = true;
                    borderObstaclesCount++;
                }
            }
        }
        console.log(`Added ${borderObstaclesCount} border obstacles.`);
        if (this.obstaclesGroup) this.obstaclesGroup.setDepth(-1);
        console.log(`Total obstacles on level: ${this.obstaclesGroup ? this.obstaclesGroup.getLength() : 0}.`);

        // Спавн "куба" (портала)
        this.spawnCube(occupiedCells, gridWidth, gridHeight);

        // Сохраняем карту
        this.occupiedCellsForSpawning = occupiedCells;
        this.gridWidthForSpawning = gridWidth;
        this.gridHeightForSpawning = gridHeight;
    }

    // --- Спавн куба-цели (иконка портала) ---
    spawnCube(occupiedCells, gridWidth, gridHeight) {
    if (!this.collectibleGroup) {
        console.error("Collectible group not initialized!");
        return;
    }

    let cubeSpawned = false;
    let attempts = 0;
    const maxAttempts = gridWidth * gridHeight;

    // Считаем, что машина стоит в центре сцены:
    const startGridX = Math.floor(GAME_WIDTH / 2 / GRID_CELL_SIZE);
    const startGridY = Math.floor(GAME_HEIGHT / 2 / GRID_CELL_SIZE);

    while (!cubeSpawned && attempts < maxAttempts) {
        const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
        const randomGridY = Phaser.Math.Between(0, gridHeight - 1);

        // Проверяем, что клетка не занята
        if (!occupiedCells[randomGridY][randomGridX]) {

            // Проверяем, чтобы расстояние в клетках до машины было >= 8
            const distanceInCells = Phaser.Math.Distance.Between(
                randomGridX, 
                randomGridY, 
                startGridX, 
                startGridY
            );

            if (distanceInCells >= 8) {
                const cubeX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cubeY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                this.cube = this.collectibleGroup.create(cubeX, cubeY, PORTAL_KEY);
                if (this.cube) {
                    this.cube.setOrigin(0.5).setDepth(0);
                    // Лёгкая анимация "покачивания"
                    this.tweens.add({
                        targets: this.cube,
                        scaleY: this.cube.scaleY * 1.1,
                        scaleX: this.cube.scaleX * 0.9,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        duration: 800
                    });

                    occupiedCells[randomGridY][randomGridX] = true;
                    cubeSpawned = true;
                    console.log(`Portal spawned at grid (${randomGridX}, ${randomGridY})`);
                } else {
                    console.error("Failed to create cube sprite.");
                    break;
                }
            }
        }

        attempts++;
    }

    if (!cubeSpawned && attempts >= maxAttempts) {
        console.warn("Could not find a free cell for the portal!");
    }
}

    // --- Спавн пикапа топлива ---
    spawnFuelPickup(occupiedCells, gridWidth, gridHeight) {
        if (!this.fuelPickupGroup || !occupiedCells) {
            console.error("Fuel pickup group or occupiedCells not initialized!");
            return;
        }
        let pickupSpawned = false;
        let attempts = 0;
        const maxAttempts = gridWidth * gridHeight;

        console.log("Attempting to spawn fuel pickup...");

        while (!pickupSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
            const randomGridY = Phaser.Math.Between(0, gridHeight - 1);

            if (
                randomGridY >= 0 && randomGridY < occupiedCells.length &&
                randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length &&
                !occupiedCells[randomGridY][randomGridX]
            ) {
                const pickupX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const pickupY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                const pickup = this.fuelPickupGroup.create(pickupX, pickupY, FUEL_PICKUP_KEY);
                if (pickup) {
                    pickup.setOrigin(0.5).setDepth(0);
                    pickup.setDisplaySize(GRID_CELL_SIZE, GRID_CELL_SIZE);

                    this.tweens.add({
                        targets: pickup,
                        scale: 1.1,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        duration: 700
                    });
                    occupiedCells[randomGridY][randomGridX] = true;
                    pickupSpawned = true;
                    console.log(`Fuel pickup spawned at grid (${randomGridX}, ${randomGridY})`);
                } else {
                    console.error("Failed to create fuel pickup sprite.");
                    break;
                }
            }
            attempts++;
        }
        if (!pickupSpawned && attempts >= maxAttempts) {
            console.warn("Could not find a free cell to spawn the fuel pickup!");
        }
    }

    // --- Обновление UI топлива ---
    updateFuelDisplay() {
        if (!this.fuelText || !this.fuelText.active) return;
        let fuelString = `FUEL: ${this.fuel}`;

        if (this.fuel <= FUEL_LOW_THRESHOLD) {
            this.fuelText.setFill(FUEL_COLOR_LOW);
        } else {
            this.fuelText.setFill(FUEL_COLOR_NORMAL);
        }
        try {
            this.fuelText.setText(fuelString);
        } catch (e) {
            console.warn("Error updating fuel text:", e);
        }
    }

    // --- Сбор куба (портала) ---
    handleCollectCube(car, cube) {
        if (!cube || !cube.active || this.levelComplete || this.gameOver) return;
        console.log(`Cube collected! Level ${this.currentLevel} Complete!`);
        this.levelComplete = true;
        this.hoveredArcZone = null;

        this.tweens.killTweensOf(cube);
        cube.destroy();
        this.cube = null;

        if (this.isMoving && this.car?.body) {
            this.tweens.killTweensOf(this.car);
            this.car.body.stop();
            if (this.physics.world) this.physics.world.destination = null;
        }
        if (this.car?.body) this.car.body.enable = false;
        this.isMoving = false;

        if (this.controlArcGraphics) this.controlArcGraphics.clear();
        if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if (this.ghostCar) this.ghostCar.setVisible(false);

        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.keyboard.enabled = false;

        if (this.winText) this.winText.setVisible(true);
        if (this.nextLevelButton) this.nextLevelButton.setVisible(true);
        this.startReplay();
        if (this.cameras.main) this.cameras.main.flash(400, WIN_FLASH_COLOR);
        this.updateInfoText();

        if (this.winText) {
            if (this.currentLevel >= TOTAL_LEVELS) {
                this.winText.setText('YOU WIN!').setVisible(true);
                if (this.playAgainButton) {
                    this.playAgainButton.setVisible(true);
                }
                if (this.nextLevelButton) {
                    this.nextLevelButton.setVisible(false);
                }
            } else {
                this.winText.setText('LEVEL COMPLETE!').setVisible(true);
                if (this.nextLevelButton) {
                    this.nextLevelButton.setVisible(true);
                }
                if (this.playAgainButton) {
                    this.playAgainButton.setVisible(false);
                }
            }
        }
    }

    // --- Сбор топлива ---
    handleCollectFuelPickup(car, pickup) {
        if (!pickup || !pickup.active || this.levelComplete || this.gameOver) return;

        console.log("Collected fuel pickup!");

        const gridX = Math.floor(pickup.x / GRID_CELL_SIZE);
        const gridY = Math.floor(pickup.y / GRID_CELL_SIZE);
        if (
            this.occupiedCellsForSpawning &&
            gridY >= 0 && gridY < this.gridHeightForSpawning &&
            gridX >= 0 && gridX < this.gridWidthForSpawning
        ) {
            this.occupiedCellsForSpawning[gridY][gridX] = false;
        }

        this.tweens.killTweensOf(pickup);
        pickup.destroy();

        this.fuel = Math.min(this.fuel + FUEL_GAIN_ON_PICKUP, INITIAL_FUEL);
        console.log(`Fuel increased to: ${this.fuel}`);
        this.updateFuelDisplay();
        this.updateInfoText();

        this.spawnFuelPickup(
            this.occupiedCellsForSpawning,
            this.gridWidthForSpawning,
            this.gridHeightForSpawning
        );
    }

    // --- Гейм-овер при нуле топлива или столкновении ---
    triggerGameOver(message) {
        if (this.gameOver || this.levelComplete) return;
        this.gameOver = true;
        this.isMoving = false;
        this.hoveredArcZone = null;
        console.log("GAME OVER:", message);

        if (this.car) {
            this.tweens.killTweensOf(this.car);
            if (this.car.body) {
                this.car.body.stop();
                this.car.body.enable = false;
            }
        }
        if (this.physics.world) this.physics.world.destination = null;

        if (this.controlArcGraphics) this.controlArcGraphics.clear();
        if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if (this.ghostCar) this.ghostCar.setVisible(false);

        this.input.off('pointerdown', this.handleSceneClick, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.keyboard.enabled = false;

        if (this.restartLevelText) {
            this.restartLevelText.setText(message).setVisible(true);
        }
        if (this.cameras.main) {
            this.cameras.main.flash(FLASH_DURATION, FLASH_COLOR);
            this.cameras.main.shake(SHAKE_DURATION, SHAKE_INTENSITY);
        }
        this.time.delayedCall(RESTART_DELAY, () => {
            if (this.scene.isActive(this.scene.key)) {
                this.scene.restart();
            }
        });
    }

    // --- Столкновение ---
    handleCollision(car, obstacle) {
        if (
            this.isMoving &&
            !this.levelComplete &&
            !this.gameOver &&
            this.car?.body &&
            this.obstaclesGroup &&
            this.obstaclesGroup.contains(obstacle)
        ) {
            console.log(`Collision detected!`);
            this.triggerGameOver(`CRASH! LEVEL ${this.currentLevel}`);
        }
    }

    handleOutOfFuel() {
        if (this.gameOver || this.levelComplete) return;
        console.log("Fuel depleted!");
        this.triggerGameOver(`OUT OF FUEL! LEVEL ${this.currentLevel}`);
    }

    // --- Следующий уровень ---
    startNextLevel() {
        if (!this.levelComplete || this.currentLevel >= TOTAL_LEVELS) return;
        if (this.nextLevelButton) this.nextLevelButton.disableInteractive();
        console.log("Starting next level...");

        const nextLevel = this.currentLevel + 1;
        const nextObstacleThreshold = Math.max(
            MIN_OBSTACLE_THRESHOLD,
            this.currentObstacleThreshold - OBSTACLE_THRESHOLD_DECREMENT
        );
        this.registry.set('currentLevel', nextLevel);
        this.registry.set('obstacleThreshold', nextObstacleThreshold);

        if (this.scene.isActive(this.scene.key)) {
            this.scene.restart();
        }
    }

    // --- Расчет и отрисовка UI управления ---
    calculateAndDrawState() {
        if (!this.car || !this.car.body) return;

        if (this.isMoving || this.levelComplete || this.gameOver) {
            if (this.controlArcGraphics) this.controlArcGraphics.clear();
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
            if (this.ghostCar) this.ghostCar.setVisible(false);
            this.updateInfoText();
            return;
        }
        this.calculateArcGuiParams();
        this.drawControlArc();
        this.updateInfoText();
    }

    calculateArcGuiParams() {
        if (!this.car) return;
        const speed = this.car.getData('speed') ?? MIN_SPEED;
        const normSpeed = Phaser.Math.Clamp((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

        const arcCenterX = this.car.x;
        const arcCenterY = this.car.y;

        const radiusFactor = SPEED_TO_GUI_RADIUS_FACTOR * normSpeed;
        const innerRadius = BASE_INNER_RADIUS_GUI + radiusFactor;

        const baseThick = ARC_THICKNESS_GUI;
        const thickReduce = baseThick * normSpeed * GUI_THICKNESS_REDUCTION_FACTOR;
        const arcThickness = Math.max(MIN_ARC_THICKNESS, baseThick - thickReduce);

        const outerRadius = innerRadius + arcThickness;
        const workingRadius = innerRadius + arcThickness * GREEN_ZONE_RATIO;
        const brakeZoneThickness = workingRadius - innerRadius;
        const neutralRadius = (brakeZoneThickness > 0)
            ? innerRadius + brakeZoneThickness / 2
            : innerRadius;

        const angleReductionMultiplier = 1 / (normSpeed * (MAX_GUI_ANGLE_REDUCTION_FACTOR - 1) + 1);
        const angleDeg = Math.max(MIN_ARC_ANGLE_DEG, BASE_ANGLE_DEG * angleReductionMultiplier);
        const halfAngleRad = Phaser.Math.DegToRad(angleDeg / 2);

        this.arcParams = {
            centerX: arcCenterX,
            centerY: arcCenterY,
            innerRadius: Math.max(0, innerRadius),
            neutralRadius: Math.max(0, neutralRadius),
            workingRadius: Math.max(0, workingRadius),
            outerRadius: Math.max(0, outerRadius),
            halfAngleRad: halfAngleRad,
            orientationRad: carAngleRad
        };
    }

    fillAnnularSector(graphics, cx, cy, innerR, outerR, startA, endA, color, alpha) {
        if (
            !graphics ||
            !isFinite(cx) ||
            !isFinite(cy) ||
            !isFinite(innerR) ||
            !isFinite(outerR) ||
            outerR <= innerR ||
            innerR < 0
        ) return;

        graphics.fillStyle(color, alpha);
        graphics.beginPath();
        graphics.arc(cx, cy, outerR, startA, endA, false);
        graphics.arc(cx, cy, innerR, endA, startA, true);
        graphics.closePath();
        graphics.fillPath();
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

        if (
            ap &&
            ap.outerRadius > ap.innerRadius &&
            ap.halfAngleRad > 0 &&
            ap.innerRadius >= 0
        ) {
            const startAngle = ap.orientationRad - ap.halfAngleRad;
            const endAngle = ap.orientationRad + ap.halfAngleRad;

            if (ap.workingRadius < ap.outerRadius && !redCooldownActive) {
                const redInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
                if (redInnerRadius < ap.outerRadius) {
                    const alpha = (hovered === 'red') ? HOVER_ALPHA : DEFAULT_RED_ALPHA;
                    this.fillAnnularSector(
                        this.controlArcGraphics,
                        ap.centerX,
                        ap.centerY,
                        redInnerRadius,
                        ap.outerRadius,
                        startAngle,
                        endAngle,
                        COLOR_RED,
                        alpha
                    );
                }
            }

            if (ap.neutralRadius < ap.workingRadius && !accelIsDisabled) {
                const alpha = (hovered === 'accelerate') ? HOVER_ALPHA : DEFAULT_ACCEL_ALPHA;
                this.fillAnnularSector(
                    this.controlArcGraphics,
                    ap.centerX,
                    ap.centerY,
                    ap.neutralRadius,
                    ap.workingRadius,
                    startAngle,
                    endAngle,
                    COLOR_ACCELERATE,
                    alpha
                );
            }

            if (ap.innerRadius < ap.neutralRadius) {
                const alpha = (hovered === 'brake') ? HOVER_ALPHA : DEFAULT_BRAKE_ALPHA;
                this.fillAnnularSector(
                    this.controlArcGraphics,
                    ap.centerX,
                    ap.centerY,
                    ap.innerRadius,
                    ap.neutralRadius,
                    startAngle,
                    endAngle,
                    COLOR_BRAKE,
                    alpha
                );
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
                this.controlArcGraphics,
                this.car.x,
                this.car.y,
                innerRRev,
                outerRRev,
                startAngleRev,
                endAngleRev,
                COLOR_REVERSE,
                alpha
            );
        }
    }

    getArcZoneForPoint(pointX, pointY) {
        if (!this.car || this.gameOver || this.levelComplete) return null;
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
            if (
                distSqr >= innerRRev * innerRRev &&
                distSqr <= outerRRev * outerRRev
            ) {
                const relativeAngleRadRev = Phaser.Math.Angle.Wrap(pointAngleRad - reverseOrientationRad);
                if (Math.abs(relativeAngleRadRev) <= halfReverseAngleRad) {
                    return 'reverse';
                }
            }
        }

        const ap = this.arcParams;
        if (!ap || ap.innerRadius < 0 || ap.outerRadius <= ap.innerRadius) return null;

        if (
            distSqr < ap.innerRadius * ap.innerRadius ||
            distSqr > ap.outerRadius * ap.outerRadius
        ) {
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

    handlePointerMove(pointer) {
        if (
            this.isMoving ||
            this.levelComplete ||
            this.gameOver ||
            !this.car
        ) {
            if (this.hoveredArcZone !== null) {
                this.hoveredArcZone = null;
                if (
                    this.controlArcGraphics &&
                    !this.isMoving &&
                    !this.levelComplete &&
                    !this.gameOver
                ) {
                    this.calculateAndDrawState();
                }
            }
            if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
            return;
        }

        if (!this.trajectoryGraphics || !this.ghostCar || !this.controlArcGraphics) return;

        const pointerX = pointer.worldX;
        const pointerY = pointer.worldY;
        const newZone = this.getArcZoneForPoint(pointerX, pointerY);

        if (newZone !== this.hoveredArcZone) {
            this.hoveredArcZone = newZone;
            this.drawControlArc();
        }

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

            this.ghostCar
                .setPosition(targetX, targetY)
                .setAngle(Phaser.Math.RadToDeg(targetAngleRad))
                .setVisible(true);
            this.drawTrajectory(this.car.x, this.car.y, targetX, targetY);
        } else {
            if (this.ghostCar) this.ghostCar.setVisible(false);
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        }
    }

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

    calculateTargetFromArcPoint(arcPointX, arcPointY) {
        if (!this.car || !this.arcParams?.innerRadius) return null;
        const ap = this.arcParams;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        const targetAngleRad = Phaser.Math.Angle.Between(
            this.car.x, this.car.y,
            arcPointX, arcPointY
        );
        const clickDistanceCarCenter = Phaser.Math.Distance.Between(
            this.car.x, this.car.y,
            arcPointX, arcPointY
        );

        let relativeClickDistOverallArc = 0.5;
        const arcThickness = ap.outerRadius - ap.innerRadius;
        if (arcThickness > 0) {
            relativeClickDistOverallArc = Phaser.Math.Clamp(
                (clickDistanceCarCenter - ap.innerRadius) / arcThickness,
                0, 1
            );
        }

        let relativeClickDistInWorkingZone = 0;
        const workingZoneThickness = ap.workingRadius - ap.innerRadius;
        if (workingZoneThickness > 0) {
            const distFromNeutral = clickDistanceCarCenter - ap.neutralRadius;
            const halfWorkingThickness = workingZoneThickness / 2;
            if (halfWorkingThickness > 0) {
                relativeClickDistInWorkingZone = Phaser.Math.Clamp(
                    distFromNeutral / halfWorkingThickness,
                    -1, 1
                );
            }
        }

        const currentMidRadius = ap.innerRadius + arcThickness / 2;
        const baseDist = Phaser.Math.Linear(
            MIN_MOVE_DISTANCE_FACTOR * currentMidRadius,
            MAX_MOVE_DISTANCE_FACTOR * currentMidRadius,
            relativeClickDistOverallArc
        );
        const totalMoveDist = baseDist + currentSpeed * SPEED_TO_DISTANCE_MULTIPLIER;

        const targetX = this.car.x + Math.cos(targetAngleRad) * totalMoveDist;
        const targetY = this.car.y + Math.sin(targetAngleRad) * totalMoveDist;

        return {
            targetX,
            targetY,
            targetAngleRad,
            relativeClickDistOverallArc,
            relativeClickDistInWorkingZone
        };
    }

    handleSceneClick(pointer) {
        if (this.isMoving || this.levelComplete || this.gameOver || !this.car) return;
        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        const clickArcZone = this.getArcZoneForPoint(clickX, clickY);
        if (clickArcZone) {
            // Проверка топлива
            if (this.fuel <= 0) {
                console.log("Attempted move with zero fuel.");
                this.handleOutOfFuel();
                return;
            }
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
                        targetData.targetX,
                        targetData.targetY,
                        clickArcZone,
                        targetData.relativeClickDistOverallArc,
                        targetData.relativeClickDistInWorkingZone
                    );
                } else {
                    console.warn("Could not calculate target from FORWARD arc click despite active zone.");
                }
            }
        }
    }

    handleMove(targetX, targetY, clickArcZone, relativeClickDistOverallArc, relativeClickDistInWorkingZone) {
    if (this.isMoving || this.levelComplete || this.gameOver || !this.car?.body) return;

    // Проверяем топливо
    if (this.fuel <= 0) {
        this.handleOutOfFuel();
        return;
    }
    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
    console.log(`Fuel consumed. Remaining: ${this.fuel}`);
    this.updateFuelDisplay();
    this.updateInfoText();

    this.hoveredArcZone = null;
    this.isMoving = true;
    if (this.controlArcGraphics) this.controlArcGraphics.clear();
    if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
    if (this.ghostCar) this.ghostCar.setVisible(false);

    const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
    let speedForNextTurn = currentSpeed;

    // Определяем изменение скорости (ускорение/торможение/красная зона)
    if (clickArcZone === 'accelerate' || clickArcZone === 'brake') {
        const speedFactor = (relativeClickDistInWorkingZone < 0) ? 0.5 : 1.0;
        const speedChange = relativeClickDistInWorkingZone * SPEED_INCREMENT * speedFactor;
        speedForNextTurn = currentSpeed + speedChange;
        this.car.setData('nextRedCooldown', undefined);
        this.car.setData('nextAccelDisabled', undefined);
        console.log(
            `FORWARD Move: Click in ${clickArcZone} (RelPos: ${relativeClickDistInWorkingZone.toFixed(2)})` +
            `. Speed change: ${speedChange.toFixed(2)}`
        );
    } else if (clickArcZone === 'red') {
        console.log(`FORWARD Move: Click in RED zone. Applying boost!`);
        speedForNextTurn = currentSpeed + RED_ZONE_SPEED_BOOST;
        this.car.setData('nextRedCooldown', RED_ZONE_COOLDOWN_TURNS);
        this.car.setData('nextAccelDisabled', true);
    }

    speedForNextTurn = Phaser.Math.Clamp(speedForNextTurn, MIN_SPEED, MAX_SPEED);
    this.car.setData('nextSpeed', speedForNextTurn);

    console.log(
        `FORWARD Move End: Next Turn Planned - Speed: ${speedForNextTurn.toFixed(2)},` +
        ` Next Red CD: ${this.car.getData('nextRedCooldown')},` +
        ` Next Accel Disabled: ${this.car.getData('nextAccelDisabled')}`
    );

    // Считаем дистанцию, угол поворота
    const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);

    const currentAngleDeg = this.car.angle;
    const angleToTargetRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, targetX, targetY);
    const rawTargetAngleDeg = Phaser.Math.RadToDeg(angleToTargetRad);
    const shortestAngleDiff = Phaser.Math.Angle.ShortestBetween(currentAngleDeg, rawTargetAngleDeg);
    const finalAngleDeg = currentAngleDeg + shortestAngleDiff;

    console.log(
        `Rotation: Current=${currentAngleDeg.toFixed(1)}, RawTarget=${rawTargetAngleDeg.toFixed(1)}, ` +
        `Diff=${shortestAngleDiff.toFixed(1)}, FinalTarget=${finalAngleDeg.toFixed(1)}`
    );

    // Анимация поворота
    this.tweens.add({
        targets: this.car,
        angle: finalAngleDeg,
        duration: TURN_DURATION,
        ease: 'Linear'
    });

    // Рассчитываем скорость анимации, аналогично вашему коду
    const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
    const animationSpeedMultiplier = Phaser.Math.Linear(MIN_ANIM_SPEED_MULTIPLIER, MAX_ANIM_SPEED_MULTIPLIER, normCurrentSpeed);
    const baseAnimSpeed = moveDistance * BASE_PHYSICS_MOVE_SPEED_FACTOR;
    const clickPosBonus = (1 + relativeClickDistOverallArc * CLICK_POS_ANIM_SPEED_FACTOR);
    const desiredPhysicsSpeed = baseAnimSpeed * clickPosBonus * animationSpeedMultiplier;
    const finalAnimSpeed = Math.max(desiredPhysicsSpeed, MIN_VISUAL_ANIM_SPEED);

    console.log(
        `Animation Speed Calculation: normCurrentSpeed=${normCurrentSpeed.toFixed(2)}, ` +
        `animMultiplier=${animationSpeedMultiplier.toFixed(2)}, ` +
        `baseAnim=${baseAnimSpeed.toFixed(2)}, clickBonus=${clickPosBonus.toFixed(2)}, ` +
        `finalAnimSpeed=${finalAnimSpeed.toFixed(2)}`
    );

    this.physics.moveTo(this.car, targetX, targetY, finalAnimSpeed);
    if (this.physics.world) {
        this.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
    }

    // === Запоминаем ход для будущего "повтора" ===
    const moveTime = (moveDistance / finalAnimSpeed) * 1000; // в мс
    this.movesHistory.push({
        startX: this.car.x,
        startY: this.car.y,
        fromAngleDeg: currentAngleDeg,
        finalAngleDeg,
        targetX,
        targetY,
        turnDuration: TURN_DURATION,
        moveTime
    });
    }

    handleReverseMove(targetX, targetY) {
    if (this.isMoving || this.levelComplete || this.gameOver || !this.car?.body) return;
    if (this.car.getData('speed') !== MIN_SPEED) {
        console.warn("Attempted reverse move but speed is not MIN_SPEED!");
        return;
    }

    // Топливо
    if (this.fuel <= 0) {
        this.handleOutOfFuel();
        return;
    }
    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
    console.log(`Fuel consumed (Reverse). Remaining: ${this.fuel}`);
    this.updateFuelDisplay();
    this.updateInfoText();

    console.log("Executing REVERSE Move");
    this.hoveredArcZone = null;
    this.isMoving = true;
    if (this.controlArcGraphics) this.controlArcGraphics.clear();
    if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
    if (this.ghostCar) this.ghostCar.setVisible(false);

    this.car.setData('nextSpeed', MIN_SPEED);
    this.car.setData('nextRedCooldown', 0);
    this.car.setData('nextAccelDisabled', false);

    console.log(`REVERSE Move: Next Turn Planned - Speed: ${MIN_SPEED.toFixed(2)}, Resetting Cooldowns.`);

    this.physics.moveTo(this.car, targetX, targetY, REVERSE_SPEED_ANIMATION);
    if (this.physics.world) {
        this.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
    }

    // === Запоминаем этот ход для "повтора" ===
    // Поворота нет (машина не разворачивается),
    // так что finalAngleDeg = car.angle (не меняется)
    const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);
    const moveTime = (moveDistance / REVERSE_SPEED_ANIMATION) * 1000;
    const currentAngleDeg = this.car.angle;

    this.movesHistory.push({
        startX: this.car.x,
        startY: this.car.y,
        fromAngleDeg: currentAngleDeg,
        finalAngleDeg: currentAngleDeg,
        targetX,
        targetY,
        turnDuration: 0, // нет поворота
        moveTime
    });
    }

    update(time, delta) {
    if (this.gameOver || this.levelComplete || !this.car || !this.car.body || !this.car.active) {
        return;
    }

    // Если машина движется и у нас есть точка назначения
    if (this.isMoving && this.physics.world?.destination) {
        const destination = this.physics.world.destination;
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.car.x,
            this.car.y,
            destination.x,
            destination.y
        );
        const speed = this.car.body.velocity.length();

        // Проверяем overshoot (пролёт точки):
        if (this.prevDistanceToTarget !== undefined) {
            if (distanceToTarget > this.prevDistanceToTarget) {
                console.log("Overshoot detected — snapping to destination");
                this.car.body.reset(destination.x, destination.y);
                this.finishMove();
                return;
            }
        }

        // Обычное условие остановки (достаточно близко или скорость почти 0)
        if (
            distanceToTarget < STOP_DISTANCE_THRESHOLD ||
            (speed < MIN_STOP_SPEED && speed > 0)
        ) {
            this.car.body.reset(destination.x, destination.y);
            this.finishMove();
            return;
        }

        // Обновляем "предыдущее расстояние"
        this.prevDistanceToTarget = distanceToTarget;

    } else if (!this.isMoving) {
        // Если стоим — просто обновляем инфо и сбрасываем prevDistance
        this.updateInfoText();
        this.prevDistanceToTarget = undefined;
    }
}

finishMove() {
    // Сброс физической цели
    this.physics.world.destination = null;
    this.isMoving = false;

    // Применяем отложенные значения (nextSpeed и т.п.)
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

    // Сбрасываем временные поля
    this.car.setData('nextSpeed', undefined);
    this.car.setData('nextRedCooldown', undefined);
    this.car.setData('nextAccelDisabled', undefined);

    console.log("Turn finished. Ready for next input.");

    // Проверка топлива
    if (this.fuel <= 0 && !this.gameOver && !this.levelComplete) {
        this.handleOutOfFuel();
        return;
    }

    // Если игра продолжается, обновим UI
    if (this.scene.isActive(this.scene.key) && !this.levelComplete && !this.gameOver) {
        const pointer = this.input.activePointer;
        this.hoveredArcZone = this.getArcZoneForPoint(pointer.worldX, pointer.worldY);
        this.calculateAndDrawState();
        this.handlePointerMove(pointer);
    } else {
        this.updateInfoText();
    }
}

    startReplay() {
    // Если не было ходов — ничего не делаем
    if (!this.movesHistory || this.movesHistory.length === 0) {
        console.log("No moves to replay.");
        return;
    }

    // Прячем реальную машину
    if (this.car) {
        this.car.setVisible(false);
    }
    if (this.ghostCar) {
        this.ghostCar.setVisible(false);
    }
    if (this.controlArcGraphics) this.controlArcGraphics.clear();
    if (this.trajectoryGraphics) this.trajectoryGraphics.clear();

    // Создаём отдельный спрайт для повтора
    this.replayCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
        .setDepth(this.car.depth)
        .setScale(0.5)
        .setAngle(this.car.angle);

    // Ставим в начальную позицию и угол из первого хода
    const firstMove = this.movesHistory[0];
    this.replayCar.setPosition(firstMove.startX, firstMove.startY);
    this.replayCar.setAngle(firstMove.fromAngleDeg);

    // Начинаем пошаговый реплей
    this.currentReplayIndex = 0;  // будем идти по movesHistory
    console.log("Replay started...");

    this.replayNextMove();
}

// Эта функция проигрывает 1 ход, затем вызывает себя для следующего
replayNextMove() {
    if (this.currentReplayIndex >= this.movesHistory.length) {
        console.log("Replay finished (all moves played).");
        return;
    }

    const step = this.movesHistory[this.currentReplayIndex];
    this.currentReplayIndex++;

    // Ставим машину в старт положения этого шага
    this.replayCar.setPosition(step.startX, step.startY);
    this.replayCar.setAngle(step.fromAngleDeg);

    // Считаем расстояние и разницу углов
    const distance = Phaser.Math.Distance.Between(
        step.startX, 
        step.startY, 
        step.targetX, 
        step.targetY
    );
    const angleDiff = Math.abs(step.finalAngleDeg - step.fromAngleDeg);

    // Фиксированные скорости в реплее (для плавности):
    const MOVE_SPEED_PX_SEC = 200;     // пикселей/сек для движения
    const ROTATE_SPEED_DEG_SEC = 90;   // градусов/сек для поворота

    // Время на перемещение и время на поворот
    const timeForMove = (distance / MOVE_SPEED_PX_SEC) * 1000; 
    const timeForRotate = (angleDiff / ROTATE_SPEED_DEG_SEC) * 10;

    // Общая длительность – берём максимум, 
    // чтобы точно успеть и повернуть, и доехать за один tween
    const duration = Math.max(timeForMove, timeForRotate);

    // Теперь ЕДИНЫМ твином меняем и угол, и позицию:
    this.tweens.add({
        targets: this.replayCar,
        x: step.targetX,
        y: step.targetY,
        angle: step.finalAngleDeg,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            // Сразу переходим к следующему ходу, без пауз
            this.replayNextMove();
        }
    });
}



    updateInfoText() {
        if (!this.infoText || !this.car || !this.infoText.active) return;
        const speed = this.car.getData('speed') ?? 0;
        const redCooldown = this.car.getData('redCooldown') ?? 0;
        const accelDisabled = this.car.getData('accelDisabled') ?? false;
        const currentFuel = this.fuel;

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
            `Fuel: ${currentFuel}`,
            statusText
        ];
        try {
            if (this.infoText.active) {
                this.infoText.setText(textLines);
            }
        } catch (e) {
            console.warn("Error updating info text:", e);
        }
    }

    setupDebugControls() {
        if (!this.input?.keyboard) {
            console.warn("Keyboard input not available");
            return;
        }
        this.input.keyboard.off('keydown-W');
        this.input.keyboard.off('keydown-S');
        this.input.keyboard.off('keydown-A');
        this.input.keyboard.off('keydown-D');
        this.input.keyboard.off('keydown-P');
        this.input.keyboard.off('keydown-R');
        this.input.keyboard.off('keydown-F');

        const checkDebugInput = () =>
            this.car?.active && !this.isMoving && !this.levelComplete && !this.gameOver;

        this.input.keyboard.on('keydown-W', () => {
            if (!checkDebugInput()) return;
            let s = Phaser.Math.Clamp(
                (this.car.getData('speed') ?? MIN_SPEED) + 0.5,
                MIN_SPEED, MAX_SPEED
            );
            this.car.setData('speed', s);
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-S', () => {
            if (!checkDebugInput()) return;
            let s = Phaser.Math.Clamp(
                (this.car.getData('speed') ?? MIN_SPEED) - 0.5,
                MIN_SPEED, MAX_SPEED
            );
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
        this.input.keyboard.on('keydown-P', () => {
            if (checkDebugInput() && this.cube?.active) {
                console.log("Debug: Skipping level...");
                this.handleCollectCube(this.car, this.cube);
            }
        });
        this.input.keyboard.on('keydown-R', () => {
            console.log(
                "Debug: Resetting obstacle threshold in registry to initial value for next level restart."
            );
            this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
        });
        // Добавим клавишу F для добавления топлива (отладка)
        this.input.keyboard.on('keydown-F', () => {
            if (checkDebugInput()) {
                this.fuel = Math.min(this.fuel + 5, INITIAL_FUEL);
                console.log(`Debug: Added fuel. Current: ${this.fuel}`);
                this.updateFuelDisplay();
                this.updateInfoText();
            }
        });
    }
}
// ==============================
// --- КОНФИГ ФЕЙЗЕРА И СТАРТ ---
// ==============================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'phaser-game',
    scene: [MainMenuScene, GameScene],
    antialias: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    resolution: window.devicePixelRatio || 1,
    render: {
        pixelArt: false
    }
};

window.onload = () => {
    if (typeof SimplexNoise === 'undefined') {
        console.error("SimplexNoise library is not loaded! Check index.html.");
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="color: red; padding: 20px; border: 1px solid red; font-family: sans-serif;">
                    Error: SimplexNoise library not found. Please check index.html.
                </div>
            `;
        }
    } else {
        const game = new Phaser.Game(config);
        console.log("Phaser Game instance created.");
    }
};
