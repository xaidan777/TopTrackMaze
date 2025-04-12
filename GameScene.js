// GameScene.js (После вынесения логики в ArcController.js)

// --- НОВЫЕ КОНСТАНТЫ ---
const SHADOW_COLOR = 0x000000; // Цвет тени (белый) - используем числовой формат для tint
const SHADOW_ALPHA = 0.1;      // Прозрачность тени (50%)
const SHADOW_OFFSET_Y = 5;     // Вертикальное смещение тени (в пикселях)
const SHADOW_DEPTH_OFFSET = -1; // Насколько "ниже" основного спрайта рисовать тень
// --- КОНЕЦ НОВЫХ КОНСТАНТ ---


class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.car = null;
        this.carShadow = null; // <-- ДОБАВЛЕНО
        // Графика и объекты, управляемые ArcController
        this.controlArcGraphics = null;
        this.trajectoryGraphics = null;
        this.ghostCar = null;
        this.snapCursor = null;
        // Контроллер
        this.arcController = null; // Ссылка на экземпляр ArcController

        // Остальные свойства сцены
        this.infoText = null;
        this.levelText = null;
        this.fuelText = null;
        this.isMoving = false;
        this.obstaclesGroup = null;
        this.obstacleShadowsGroup = null; // <-- ДОБАВЛЕНО
        this.collectibleGroup = null;
        this.fuelPickupGroup = null;
        this.cube = null; // Портал
        this.portalArrow = null;
        this.noise = null;
        this.winText = null;
        this.nextLevelButton = null;
        this.restartLevelText = null;
        this.levelComplete = false;
        this.playAgainButton = null;
        this.gameOver = false;
        this.backgroundTile = null;
        this.restartButtonObject = null;
        this.prevDistanceToTarget = undefined; // Для детекции промаха moveTo

        // Параметры уровня и прогрессии
        this.currentLevel = 1;
        this.currentObstacleThreshold = INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL;

        // Для генерации
        this.occupiedCellsForSpawning = null;
        this.gridWidthForSpawning = 0;
        this.gridHeightForSpawning = 0;

        // Для реплея
        this.movesHistory = [];
        this.replayCar = null;
        this.replayCarShadow = null; // <-- ДОБАВЛЕНО
        this.currentReplayIndex = 0;

        // Камеры
        this.uiCamera = null;
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
        // Ассеты, не связанные напрямую с ArcController
        this.load.image(CAR_PLAYER_KEY, 'assets/car_player.png');
        this.load.image(SAND_TEXTURE_KEY, 'assets/sand_texture.jpg');
        this.load.image(OBSTACLE_IMAGE_KEY, 'assets/block.png');
        this.load.image(RESTART_BUTTON_KEY, 'assets/restart.png');
        this.load.image(NEXT_LEVEL_BUTTON_KEY, 'assets/NEXTLEVEL.png');
        this.load.image(FUEL_PICKUP_KEY, 'assets/fuel.png');
        this.load.image(PORTAL_KEY, 'assets/portal.png');
        this.load.image('arrow', 'assets/arrow.png');
    }

    create() {
        console.log("Phaser version:", Phaser.VERSION);

        // Сброс состояния перед стартом/рестартом
        if (this.carShadow) this.carShadow.destroy(); // <-- ДОБАВЛЕНО
        this.carShadow = null;                       // <-- ДОБАВЛЕНО
        if (this.replayCarShadow) this.replayCarShadow.destroy(); // <-- ДОБАВЛЕНО
        this.replayCarShadow = null;                  // <-- ДОБАВЛЕНО

        this.movesHistory = [];
        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.currentObstacleThreshold = this.registry.get('obstacleThreshold') || INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL;
        this.levelComplete = false;
        this.gameOver = false;
        this.isMoving = false;
        this.arcController = null; // Сбрасываем контроллер

        console.log(`Creating scene for Level ${this.currentLevel}... Obstacle Threshold: ${this.currentObstacleThreshold.toFixed(2)}`);

        // --- Инициализация Simplex Noise ---
        if (typeof SimplexNoise === 'undefined') {
            console.error("SimplexNoise library not found!");
            // Отображение ошибки, если нужно
            return;
        }
        this.noise = new SimplexNoise();

        // --- Настройка мира и камеры ---
        this.physics.world.setBounds(0, 0, REAL_GAME_WIDTH, REAL_GAME_HEIGHT);
        this.cameras.main.setBounds(0, 0, REAL_GAME_WIDTH, REAL_GAME_HEIGHT);

        // --- Фон ---
        this.backgroundTile = this.add.tileSprite(0, 0, REAL_GAME_WIDTH, REAL_GAME_HEIGHT, SAND_TEXTURE_KEY)
            .setOrigin(0, 0)
            .setDepth(-20);

        // --- Группы объектов ---
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.obstacleShadowsGroup = this.add.group(); // <-- ДОБАВЛЕНО
        this.collectibleGroup = this.physics.add.group(); // Для портала
        this.fuelPickupGroup = this.physics.add.group(); // Для топлива

        // --- Генерация уровня ---
        this.createLevel(); // Использует this.noise, this.obstaclesGroup, this.collectibleGroup, this.obstacleShadowsGroup

        // --- Создание машины ---
        this.car = this.physics.add.sprite(REAL_GAME_WIDTH / 2, REAL_GAME_HEIGHT / 2, CAR_PLAYER_KEY);
        this.car.setScale(0.3).setOrigin(0.5, 0.5).setDataEnabled();
        this.car.setData({
            speed: MIN_SPEED,
            nextSpeed: undefined,
            redCooldown: 0,
            nextRedCooldown: undefined,
            accelDisabled: false,
            nextAccelDisabled: undefined
        });
        this.car.angle = -90; // Начальный угол
        this.car.body.setCircle(carRadius); // Настройка коллайдера
        this.car.body.setOffset(70, 20);
        this.car.setCollideWorldBounds(true).setDepth(10);

        // --- Создание тени для машины --- // <-- ДОБАВЛЕНО
        this.carShadow = this.add.sprite(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y, CAR_PLAYER_KEY);
        this.carShadow.setScale(this.car.scale);
        this.carShadow.setOrigin(this.car.originX, this.car.originY);
        this.carShadow.setAngle(this.car.angle);
        this.carShadow.setTint(SHADOW_COLOR);
        this.carShadow.setAlpha(SHADOW_ALPHA);
        this.carShadow.setDepth(this.car.depth + SHADOW_DEPTH_OFFSET); // Глубина тени чуть ниже машины
        // --- КОНЕЦ ДОБАВЛЕНИЯ ТЕНИ МАШИНЫ ---

        // --- Спавн топлива ---
        for (let i = 0; i < 10; i++) { // Спавним N канистр
             this.spawnFuelPickup(this.occupiedCellsForSpawning, this.gridWidthForSpawning, this.gridHeightForSpawning);
        }

        // --- Создание графики и объектов для ArcController ---
        this.controlArcGraphics = this.add.graphics().setDepth(5);
        this.trajectoryGraphics = this.add.graphics().setDepth(6);
        this.ghostCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
             .setOrigin(0.5, 0.5)
             .setScale(this.car.scale)
             .setAlpha(GHOST_ALPHA)
             .setVisible(false)
             .setDepth(7);
        this.snapCursor = this.add.graphics().setDepth(50); // Графика для точки примагничивания

        // --- Создание и инициализация ArcController ---
        this.arcController = new ArcController(
            this,                    // Ссылка на сцену
            this.car,                // Ссылка на машину
            this.controlArcGraphics, // Графика дуги
            this.trajectoryGraphics, // Графика траектории
            this.ghostCar,           // Призрак машины
            this.snapCursor          // Точка примагничивания
        );
        console.log("ArcController initialized.");

        // --- Элементы UI (создаются здесь, управляются из сцены) ---
        this.infoText = this.add.text(10, 10, '', {
            font: 'bold 12px Courier New',
            fill: '#ffff00',
            align: 'center'
        }).setDepth(20);
        this.levelText = this.add.text(200, 5, `Level ${this.currentLevel} / ${TOTAL_LEVELS}`, {
            font: 'bold 20px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0, 0).setDepth(21);
        this.fuelText = this.add.text(GAME_WIDTH / 2, 5, '', {
            font: 'bold 20px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(21);
        this.updateFuelDisplay(); // Первоначальное отображение топлива

        // Кнопки победы/поражения и рестарта
        this.playAgainButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, START_BUTTON_KEY)
             /* ... настройки ... */ .setVisible(false).setInteractive({ useHandCursor: true })
             .on('pointerdown', this.startNewGame, this);

        const restartButtonX = GAME_WIDTH - 5;
        const restartButtonY = 5;
        this.restartButtonObject = this.add.image(restartButtonX, restartButtonY, RESTART_BUTTON_KEY)
            .setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true });
        this.restartButtonObject.on('pointerdown', () => {
            console.log("Restart button clicked!");
            if (!this.isMoving && !this.levelComplete && !this.gameOver) {
                this.scene.restart();
            }
        });

        this.winText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'LEVEL COMPLETE!', {
            font: 'bold 48px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        })
             .setOrigin(0.5).setDepth(25).setVisible(false);

        this.nextLevelButton = null; // Создаем, только если не последний уровень
        if (this.currentLevel < TOTAL_LEVELS) {
             this.nextLevelButton = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, NEXT_LEVEL_BUTTON_KEY)
                /* ... настройки ... */.setVisible(false).setInteractive({ useHandCursor: true })
                .on('pointerdown', this.startNextLevel, this);
        }

        this.restartLevelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
            font: 'bold 48px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        })
            .setOrigin(0.5).setDepth(26).setVisible(false);

        // --- Обработчики ввода (Делегирование ArcController) ---
        this.input.off('pointerdown'); // Очищаем старые обработчики на всякий случай
        this.input.off('pointermove');

        this.input.on('pointermove', (pointer) => {
            // Если игра активна и контроллер есть, передаем ему событие
            if (!this.isMoving && !this.levelComplete && !this.gameOver && this.arcController) {
                this.arcController.handlePointerMove(pointer);
            } else if (this.arcController) {
                 // Если игра неактивна, но контроллер есть, убедимся, что его визуалы скрыты
                 this.arcController.clearVisuals();
            }
        }, this);

        this.input.on('pointerdown', (pointer) => {
            // 1. Проверяем состояние игры (включая топливо)
            if (this.isMoving || this.levelComplete || this.gameOver || !this.car || !this.arcController) {
                return; // Игнорируем клик, если игра не готова
            }
            if (this.fuel <= 0) {
                this.handleOutOfFuel(); // Проверяем топливо ПЕРЕД вызовом контроллера
                return;
            }

            // 2. Просим контроллер обработать клик
            const result = this.arcController.handleSceneClick(pointer);

            // 3. Если контроллер инициировал ход (вернул данные)
            if (result && result.moveData) {
                // Расходуем топливо (логика сцены)
                this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
                console.log(`GameScene: Fuel consumed. Remaining: ${this.fuel}`);
                this.updateFuelDisplay(); // Обновляем UI
                this.updateInfoText();

                // Устанавливаем состояние сцены (логика сцены)
                this.isMoving = true;
                this.prevDistanceToTarget = undefined; // Сброс детектора промаха

                 // Добавляем ход в историю (данные получены от контроллера)
                this.movesHistory.push(result.moveData);
                console.log("GameScene: Move initiated via controller.");
            } else {
                 console.log("GameScene: Click did not initiate a move via controller.");
            }
        }, this);


        // --- Настройка физики и столкновений ---
        this.physics.add.overlap(this.car, this.obstaclesGroup, this.handleCollision, null, this);
        this.physics.add.overlap(this.car, this.collectibleGroup, this.handleCollectCube, null, this);
        this.physics.add.overlap(this.car, this.fuelPickupGroup, this.handleCollectFuelPickup, null, this);

        // --- Камеры ---
        this.cameras.main.startFollow(this.car, true, 0.05, 0.05);
        this.cameras.main.setZoom(2);
        this.cameras.main.setDeadzone(50, 50); // Мертвая зона для камеры

        // UI Камера
        this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.uiCamera.setScroll(0, 0).setZoom(1);
        // Игнорирование игровых объектов UI камерой
        this.uiCamera.ignore([
            this.backgroundTile,
            this.ghostCar, // Управляется контроллером, но создается здесь
            this.car,
            this.carShadow, // <-- ДОБАВЛЕНО
            this.obstaclesGroup.getChildren(),
            this.obstacleShadowsGroup.getChildren(), // <-- ДОБАВЛЕНО
             // Фильтруем активные пикапы перед игнорированием
             ...this.fuelPickupGroup.getChildren().filter(c => c.active),
            this.collectibleGroup.getChildren(),
            this.controlArcGraphics, // Управляется контроллером
            this.trajectoryGraphics, // Управляется контроллером
            this.snapCursor          // Управляется контроллером
        ]);

        // Игнорирование UI объектов основной камерой
        const mainCameraIgnoreList = [
            this.infoText, this.levelText, this.fuelText,
            this.playAgainButton, this.restartButtonObject, this.winText,
            this.nextLevelButton, this.restartLevelText // nextLevelButton может быть null
        ].filter(item => item); // Убираем null/undefined из списка
        if (mainCameraIgnoreList.length > 0) {
             this.cameras.main.ignore(mainCameraIgnoreList);
        }

        // --- Стрелка портала (UI элемент) ---
         this.portalArrow = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arrow')
             .setDepth(200)
             .setScrollFactor(0) // Остается на месте в UI
             .setVisible(false)
             .setScale(1.2);
         //this.uiCamera.ignore(this.portalArrow); // Игнорируется основной камерой
         this.cameras.main.ignore(this.portalArrow); // Убедимся что игнорируется

        // --- Отладочные контролы ---
        this.setupDebugControls();
        this.input.keyboard.enabled = true;

        // --- Первая отрисовка состояния контроллера ---
        this.calculateAndDrawState(); // Вызовет arcController.drawState()

        console.log("Game Scene create() finished.");
    }

    // --- Генерация уровня (Остается в сцене) ---

    createLevel() {
        console.log("Creating level obstacles, border, and cube...");
        // Очистка старых групп
        if (this.obstaclesGroup) this.obstaclesGroup.clear(true, true);
        if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.clear(true, true); // <-- ДОБАВЛЕНО
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

        const gridWidth = Math.floor(REAL_GAME_WIDTH / GRID_CELL_SIZE);
        const gridHeight = Math.floor(REAL_GAME_HEIGHT / GRID_CELL_SIZE);
        if (gridHeight <= 0 || gridWidth <= 0) {
            console.error("Invalid grid dimensions:", gridWidth, gridHeight); return;
        }
        const occupiedCells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

        // Очистка стартовой зоны
        const startGridX = Math.floor((REAL_GAME_WIDTH / 2) / GRID_CELL_SIZE);
        const startGridY = Math.floor((REAL_GAME_HEIGHT / 2) / GRID_CELL_SIZE);
        const clearRadiusGrid = Math.ceil(startClearRadius / GRID_CELL_SIZE);
        for (let dy = -clearRadiusGrid; dy <= clearRadiusGrid; dy++) {
            for (let dx = -clearRadiusGrid; dx <= clearRadiusGrid; dx++) {
                const checkX = startGridX + dx;
                const checkY = startGridY + dy;
                if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
                    if (Phaser.Math.Distance.Between(startGridX, startGridY, checkX, checkY) <= clearRadiusGrid) {
                        occupiedCells[checkY][checkX] = true; // Помечаем как занятую для генерации
                    }
                }
            }
        }

        // Генерация препятствий по шуму
        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const cellCenterX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                if (occupiedCells[gy][gx]) continue; // Пропускаем стартовую зону
                if (noiseGenerator.noise2D(cellCenterX / scale, cellCenterY / scale) > threshold) {
                const obstacle = this.obstaclesGroup.create(cellCenterX, cellCenterY, OBSTACLE_IMAGE_KEY);
                obstacle.setScale(0.5); // Убедитесь, что масштаб учтен, если он не 1
                    obstacle.setDepth(-1); // <-- ДОБАВЛЕНО (установка глубины до создания тени)

                // --- Создание тени для препятствия --- // <-- ДОБАВЛЕНО
                    const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                    shadow.setScale(obstacle.scale);
                    shadow.setOrigin(obstacle.originX, obstacle.originY);
                    shadow.setTint(SHADOW_COLOR);
                    shadow.setAlpha(SHADOW_ALPHA);
                    shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET); // Тень ниже препятствия
                    if (this.obstacleShadowsGroup) { // Доп. проверка на существование группы
                        this.obstacleShadowsGroup.add(shadow); // Добавляем тень в группу
                    }
                    // --- КОНЕЦ СОЗДАНИЯ ТЕНИ ПРЕПЯТСТВИЯ ---

                // --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
                const collisionSize = GRID_CELL_SIZE * 0.8; // Ваше значение уменьшенного размера
                const originalSize = GRID_CELL_SIZE; // Предполагаемый исходный размер спрайта (или texture.width * scale)

                // Рассчитываем смещение для центрирования
                const offsetX = (originalSize - collisionSize) / 2;
                const offsetY = (originalSize - collisionSize) / 2;

                // Устанавливаем размер И смещение
                obstacle.body.setSize(collisionSize, collisionSize);
                obstacle.body.setOffset(offsetX, offsetY); // <-- Устанавливаем смещение

                // Обновляем тело
                obstacle.refreshBody();
                // --- КОНЕЦ ИЗМЕНЕНИЙ ---

                occupiedCells[gy][gx] = true;
            }
            }
        }
        console.log(`Generated ${this.obstaclesGroup.getLength()} obstacles from noise.`);

        // Генерация границ
        let borderObstaclesCount = 0;
         for (let gx = 0; gx < gridWidth; gx++) {
            const topX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const topY = GRID_CELL_SIZE / 2;
            const bottomY = (gridHeight - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            // Верхняя граница
            if (!occupiedCells[0][gx]) {
                const obstacle = this.obstaclesGroup.create(topX, topY, OBSTACLE_IMAGE_KEY); // <-- Сохраняем ссылку
                obstacle.setScale(0.5);
                obstacle.setDepth(-1); // Глубина препятствия

                 // --- Тень для препятствия --- // <-- ДОБАВЛЕНО
                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                 if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);
                 // --- КОНЕЦ ТЕНИ ---

                occupiedCells[0][gx] = true;
                borderObstaclesCount++;
            }
            // Нижняя граница
            if (gridHeight > 1 && !occupiedCells[gridHeight - 1][gx]) {
                const obstacle = this.obstaclesGroup.create(topX, bottomY, OBSTACLE_IMAGE_KEY); // <-- Сохраняем ссылку
                obstacle.setScale(0.5);
                obstacle.setDepth(-1); // Глубина препятствия

                // --- Тень для препятствия --- // <-- ДОБАВЛЕНО
                const shadow = this.add.sprite(obstacle.x +2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);
                // --- КОНЕЦ ТЕНИ ---

                occupiedCells[gridHeight - 1][gx] = true;
                borderObstaclesCount++;
            }
        }
        // Боковые границы
        for (let gy = 1; gy < gridHeight - 1; gy++) {
            const leftX = GRID_CELL_SIZE / 2;
            const leftY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const rightX = (gridWidth - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            // Левая граница
            if (!occupiedCells[gy][0]) {
                const obstacle = this.obstaclesGroup.create(leftX, leftY, OBSTACLE_IMAGE_KEY); // <-- Сохраняем ссылку
                obstacle.setScale(0.5);
                obstacle.setDepth(-1); // Глубина препятствия

                // --- Тень для препятствия --- // <-- ДОБАВЛЕНО
                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);
                // --- КОНЕЦ ТЕНИ ---

                occupiedCells[gy][0] = true;
                borderObstaclesCount++;
            }
            // Правая граница
            if (gridWidth > 1 && !occupiedCells[gy][gridWidth - 1]) {
                const obstacle = this.obstaclesGroup.create(rightX, leftY, OBSTACLE_IMAGE_KEY); // <-- Сохраняем ссылку
                obstacle.setScale(0.5);
                obstacle.setDepth(-1); // Глубина препятствия

                // --- Тень для препятствия --- // <-- ДОБАВЛЕНО
                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);
                // --- КОНЕЦ ТЕНИ ---

                occupiedCells[gy][gridWidth - 1] = true;
                borderObstaclesCount++;
            }
        }
        console.log(`Added ${borderObstaclesCount} border obstacles.`);
        // this.obstaclesGroup.setDepth(-1); // Убрано, так как устанавливается индивидуально
        console.log(`Total obstacles on level: ${this.obstaclesGroup.getLength()}. Total shadows: ${this.obstacleShadowsGroup?.getLength() ?? 0}.`); // Добавлена проверка на null

        // Спавн портала (куба)
        this.spawnCube(occupiedCells, gridWidth, gridHeight);

        // Сохраняем для спавна топлива
        this.occupiedCellsForSpawning = occupiedCells;
        this.gridWidthForSpawning = gridWidth;
        this.gridHeightForSpawning = gridHeight;
    }

    spawnCube(occupiedCells, gridWidth, gridHeight) {
         if (!this.collectibleGroup) {
            console.error("Collectible group not initialized!");
            return;
        }
        let cubeSpawned = false;
        let attempts = 0;
        const maxAttempts = gridWidth * gridHeight;

        const startGridX = Math.floor((REAL_GAME_WIDTH / 2) / GRID_CELL_SIZE);
        const startGridY = Math.floor((REAL_GAME_HEIGHT / 2) / GRID_CELL_SIZE);
        const minSpawnDistCells = 8; // Минимальное расстояние в клетках от старта

        while (!cubeSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
            const randomGridY = Phaser.Math.Between(0, gridHeight - 1);

            // Проверяем, что ячейка свободна
            if (
                randomGridY >= 0 && randomGridY < occupiedCells.length &&
                randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length &&
                !occupiedCells[randomGridY][randomGridX]
            ) {
                 // Проверяем расстояние от стартовой точки
                const distanceInCells = Phaser.Math.Distance.Between(randomGridX, randomGridY, startGridX, startGridY);
                if (distanceInCells >= minSpawnDistCells) {
                    const cubeX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const cubeY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                    const portalSprite = this.collectibleGroup.create(cubeX, cubeY, PORTAL_KEY);
                    if(portalSprite) {
                         portalSprite.setOrigin(0.5).setDepth(0);
                         portalSprite.setScale(1.5); // Или другой масштаб
                         // Анимация пульсации
                         this.tweens.add({
                             targets: portalSprite,
                             scaleY: portalSprite.scaleY * 1.1,
                             scaleX: portalSprite.scaleX * 0.9,
                             yoyo: true,
                             repeat: -1,
                             ease: 'Sine.easeInOut',
                             duration: 800
                         });
                         this.cube = portalSprite; // Сохраняем ссылку
                         occupiedCells[randomGridY][randomGridX] = true; // Помечаем ячейку как занятую
                         cubeSpawned = true;
                         console.log(`Portal spawned at grid (${randomGridX}, ${randomGridY})`);
                    } else {
                        console.error("Failed to create portal sprite.");
                        break; // Прерываем цикл, если спрайт не создался
                    }
                }
            }
            attempts++;
        }
        if (!cubeSpawned) {
            console.warn(`Could not find a suitable free cell for the portal after ${maxAttempts} attempts!`);
        }
    }

    spawnFuelPickup(occupiedCells, gridWidth, gridHeight) {
        if (!this.fuelPickupGroup || !occupiedCells) {
            console.error("Fuel pickup group or occupiedCells not initialized!");
            return;
        }
        let pickupSpawned = false;
        let attempts = 0;
        const maxAttempts = gridWidth * gridHeight / 2; // Меньше попыток, чем для портала

        console.log("Attempting to spawn fuel pickup...");
        while (!pickupSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
            const randomGridY = Phaser.Math.Between(0, gridHeight - 1);
            // Проверяем, что ячейка существует и свободна
            if (
                randomGridY >= 0 && randomGridY < occupiedCells.length &&
                randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length &&
                !occupiedCells[randomGridY][randomGridX]
            ) {
                const pickupX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2; // Центр ячейки
                const pickupY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const pickup = this.fuelPickupGroup.create(pickupX, pickupY, FUEL_PICKUP_KEY);
                if (pickup) {
                    pickup.setOrigin(0.5).setDepth(0);
                    pickup.setDisplaySize(GRID_CELL_SIZE * 0.8, GRID_CELL_SIZE * 0.8); // Чуть меньше ячейки
                    // Анимация
                    this.tweens.add({
                        targets: pickup,
                        scale: pickup.scale * 1.1, // Используем текущий scale
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        duration: 700
                    });
                    occupiedCells[randomGridY][randomGridX] = true; // Помечаем ячейку как занятую
                    pickupSpawned = true;
                    console.log(`Fuel pickup spawned at grid (${randomGridX}, ${randomGridY})`);
                } else {
                    console.error("Failed to create fuel pickup sprite.");
                    break; // Прерываем, если спрайт не создался
                }
            }
            attempts++;
        }
        if (!pickupSpawned) {
            console.warn(`Could not find a free cell to spawn fuel pickup after ${attempts} attempts.`);
        }
    }

    // --- Обновление UI (Остается в сцене) ---

    updateFuelDisplay() {
        // ... (код остался без изменений) ...
        if (!this.fuelText || !this.fuelText.active) return;
        let fuelString = `FUEL: ${this.fuel}`;
        this.fuelText.setFill(this.fuel <= FUEL_LOW_THRESHOLD ? FUEL_COLOR_LOW : FUEL_COLOR_NORMAL);
        try {
            this.fuelText.setText(fuelString);
        } catch (e) {
            console.warn("Error updating fuel text:", e);
        }
    }

    updateInfoText() {
       // ... (код остался без изменений, т.к. берет данные из this.car и this.fuel) ...
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
        const cooldownText = redCooldown > 0 ? ` | Red CD: ${redCooldown}` : '';
        const accelText = accelDisabled ? ' | ACCEL OFF' : '';
        const textLines = [
            `Speed: ${speed.toFixed(1)}${cooldownText}${accelText}`,
            `Fuel: ${currentFuel}`,
            statusText
        ];
        try {
            if (this.infoText.active) { // Дополнительная проверка активности
                this.infoText.setText(textLines);
            }
        } catch (e) {
            console.warn("Error updating info text:", e);
        }
    }

    // --- Обработка событий игры (Остается в сцене) ---

    handleCollectCube(car, cube) {
        if (!cube || !cube.active || this.levelComplete || this.gameOver) return;
        console.log(`Cube collected! Level ${this.currentLevel} Complete!`);
        this.levelComplete = true;

        // Останавливаем машину и анимации
        this.tweens.killTweensOf(cube);
        cube.destroy();
        this.cube = null; // Убираем ссылку
        if (this.isMoving && this.car?.body) {
            this.tweens.killTweensOf(this.car);
            this.car.body.stop();
            if (this.physics.world) this.physics.world.destination = null;
            this.isMoving = false; // Устанавливаем флаг
        }
        if (this.car?.body) this.car.body.enable = false; // Отключаем физику машины

        // Очищаем визуальные элементы контроллера
        if (this.arcController) this.arcController.clearVisuals();

        // Отключаем ввод
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;

        // Отображаем UI победы
        if (this.winText) this.winText.setVisible(true);
        // Показываем нужную кнопку (Next или Play Again)
        if (this.currentLevel >= TOTAL_LEVELS) {
            if (this.winText) this.winText.setText('YOU WIN!').setVisible(true);
            if (this.playAgainButton) this.playAgainButton.setVisible(true);
            if (this.nextLevelButton) this.nextLevelButton.setVisible(false);
        } else {
             if (this.winText) this.winText.setText('LEVEL COMPLETE!').setVisible(true);
             if (this.nextLevelButton) this.nextLevelButton.setVisible(true);
             if (this.playAgainButton) this.playAgainButton.setVisible(false);
        }

        // Запускаем реплей
        this.startReplay();
        if (this.cameras.main) this.cameras.main.flash(400, WIN_FLASH_COLOR);
        this.updateInfoText(); // Обновляем статус в инфо
    }

    handleCollectFuelPickup(car, pickup) {
        if (!pickup || !pickup.active || this.levelComplete || this.gameOver) return;
        console.log("Collected fuel pickup!");

        // Освобождаем ячейку (если нужно для регенерации или др. логики)
        const gridX = Math.floor(pickup.x / GRID_CELL_SIZE);
        const gridY = Math.floor(pickup.y / GRID_CELL_SIZE);
        if (
            this.occupiedCellsForSpawning &&
            gridY >= 0 && gridY < this.gridHeightForSpawning &&
            gridX >= 0 && gridX < this.gridWidthForSpawning
        ) {
            this.occupiedCellsForSpawning[gridY][gridX] = false;
        }

        this.tweens.killTweensOf(pickup); // Убиваем анимацию
        pickup.destroy(); // Уничтожаем объект
        this.fuel = Math.min(this.fuel + FUEL_GAIN_ON_PICKUP, INITIAL_FUEL); // Добавляем топливо, не превышая максимум
        console.log(`Fuel increased to: ${this.fuel}`);
        this.updateFuelDisplay(); // Обновляем UI
        this.updateInfoText();
    }

    triggerGameOver(message) {
        if (this.gameOver || this.levelComplete) return; // Предотвращаем повторный вызов
        this.gameOver = true;
        this.isMoving = false; // Останавливаем движение

        console.log("GAME OVER:", message);
        if (this.car) {
            this.tweens.killTweensOf(this.car);
            if (this.car.body) {
                this.car.body.stop();
                this.car.body.enable = false; // Отключаем физику
            }
        }
        if (this.physics.world) this.physics.world.destination = null;

         if (this.arcController) this.arcController.clearVisuals();

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;

        if (this.restartLevelText) this.restartLevelText.setText(message).setVisible(true);

        if (this.cameras.main) {
            this.cameras.main.flash(FLASH_DURATION, FLASH_COLOR);
            this.cameras.main.shake(SHAKE_DURATION, SHAKE_INTENSITY);
        }

        this.time.delayedCall(RESTART_DELAY, () => {
             if (this.scene.isActive(this.scene.key)) this.scene.restart();
        });
    }

    handleCollision(car, obstacle) {
        // Вызываем triggerGameOver только если машина двигалась и столкнулась с препятствием из группы
        if (this.isMoving && !this.levelComplete && !this.gameOver && this.car?.body && this.obstaclesGroup && this.obstaclesGroup.contains(obstacle)) {
            console.log("Collision detected!");
            this.triggerGameOver(`CRASH! LEVEL ${this.currentLevel}`);
        }
    }

    handleOutOfFuel() {
        if (this.gameOver || this.levelComplete) return;
        console.log("Fuel depleted!");
        this.triggerGameOver(`OUT OF FUEL! LEVEL ${this.currentLevel}`);
    }

    startNextLevel() {
        if (!this.levelComplete || this.currentLevel >= TOTAL_LEVELS) return;
        if (this.nextLevelButton) this.nextLevelButton.disableInteractive(); // Блокируем повторное нажатие

        console.log("Starting next level...");
        const nextLevel = this.currentLevel + 1;
        // Уменьшаем порог для усложнения (но не ниже минимума)
        const nextObstacleThreshold = Math.max(MIN_OBSTACLE_THRESHOLD, this.currentObstacleThreshold - OBSTACLE_THRESHOLD_DECREMENT);

        this.registry.set('currentLevel', nextLevel);
        this.registry.set('obstacleThreshold', nextObstacleThreshold);

        if (this.scene.isActive(this.scene.key)) this.scene.restart();
    }

    // --- Метод Update (Цикл игры) ---

    update(time, delta) {
        // --- НАЧАЛО ДОБАВЛЕНИЙ В UPDATE ---
        if (this.gameOver || this.levelComplete) { // Проверяем сначала общие состояния
            if (this.carShadow?.visible) this.carShadow.setVisible(false); // Скрываем тень, если игра окончена
            if (this.arcController) this.arcController.clearVisuals(); // Добавлено из вашего кода ниже
            return; // Выход, если игра окончена
        }

        // Проверка на случай, если машина удалена, но игра еще не закончена
        if (!this.car || !this.car.body || !this.car.active) {
             if (this.carShadow?.visible) this.carShadow.setVisible(false); // Скрываем тень
             return;
        }

        // Обновляем позицию и угол тени машины, если она существует и активна
        if (this.carShadow && this.carShadow.active) {
             this.carShadow.x = this.car.x+ 2;
             this.carShadow.y = this.car.y + SHADOW_OFFSET_Y; // Позиция + смещение
             this.carShadow.setAngle(this.car.angle); // Угол как у машины

             // Скрываем/показываем тень вместе с машиной
             if (this.car.visible !== this.carShadow.visible) {
                 this.carShadow.setVisible(this.car.visible);
             }
        } else if (this.carShadow && this.car.visible) {
             // Если тень была неактивна/невидима, но машина видима, пытаемся показать
              this.carShadow.setActive(true).setVisible(true);
              this.carShadow.x = this.car.x+ 2;
              this.carShadow.y = this.car.y + SHADOW_OFFSET_Y;
              this.carShadow.setAngle(this.car.angle);
        }
       // --- КОНЕЦ ДОБАВЛЕНИЙ В UPDATE (начало) ---


       // Старый код проверки выхода из update (оставлен без изменений)
      /* if (this.gameOver || this.levelComplete || !this.car || !this.car.body || !this.car.active) {
             if (this.gameOver || this.levelComplete) {
                  if(this.arcController) this.arcController.clearVisuals();
             }
             return;
        }*/

        // Проверка завершения движения moveTo (оставлено без изменений)
        if (this.isMoving && this.physics.world?.destination) {
            const destination = this.physics.world.destination;
            const distanceToTarget = Phaser.Math.Distance.Between(this.car.x, this.car.y, destination.x, destination.y);
            const speed = this.car.body.velocity.length(); // Текущая скорость физического тела

             // Проверка на промах (overshoot)
             if (this.prevDistanceToTarget !== undefined) {
                 if (distanceToTarget > this.prevDistanceToTarget + 1 && speed > 1) { // Добавил +1 и speed>1 для стабильности
                     console.warn("Overshoot detected? Snapping to destination.");
                     this.car.body.reset(destination.x, destination.y); // Ставим точно в цель
                     this.finishMove(); // Завершаем ход
                     return; // Выходим из update
                 }
             }

            if (distanceToTarget < STOP_DISTANCE_THRESHOLD || (speed < 5 && speed > 0) ) {
                 this.car.body.reset(destination.x, destination.y); // Ставим точно в цель
                 this.finishMove(); // Завершаем ход
                 return; // Выходим из update
            }

            this.prevDistanceToTarget = distanceToTarget;

        } else if (!this.isMoving) {
             // Если не двигаемся, обновляем инфо и сбрасываем детектор промаха
             this.updateInfoText(); // Обновляем инфо-текст, пока стоим
             this.prevDistanceToTarget = undefined;
        }

        // --- Логика стрелки портала (остается в сцене) --- (оставлено без изменений)
        if (!this.cube || !this.cube.active) { 
             if (this.portalArrow?.visible) this.portalArrow.setVisible(false);
        } else { 
             const camera = this.cameras.main;
             const inCameraView = camera.worldView.contains(this.cube.x, this.cube.y);

             if (inCameraView) { 
                 if (this.portalArrow?.visible) this.portalArrow.setVisible(false);
             } else { // Если портал за экраном
                 if (this.portalArrow && !this.portalArrow.visible) this.portalArrow.setVisible(true);

                 const screenCenterX = this.cameras.main.width / 2; // Центр UI камеры
                 const screenCenterY = this.cameras.main.height / 2;

                 const portalWorldPos = new Phaser.Math.Vector2(this.cube.x, this.cube.y);
                 const carWorldPos = new Phaser.Math.Vector2(this.car.x, this.car.y); // Используем позицию машины как центр "мира" для угла
                 const angleRad = Phaser.Math.Angle.Between(carWorldPos.x, carWorldPos.y, portalWorldPos.x, portalWorldPos.y); // Угол от машины к порталу

                 // Расчет позиции стрелки на краю экрана (окружность)
                 const margin = 50; // Отступ от края
                 const radius = Math.min(this.cameras.main.width, this.cameras.main.height) / 2 - margin;

                 const arrowScreenX = screenCenterX + Math.cos(angleRad) * radius;
                 const arrowScreenY = screenCenterY + Math.sin(angleRad) * radius;

                 if(this.portalArrow) {
                      this.portalArrow.setPosition(arrowScreenX, arrowScreenY);
                      const angleDeg = Phaser.Math.RadToDeg(angleRad)- 90; 
                      this.portalArrow.setAngle(angleDeg);
                 }
             }
        }

        // Логика смещения камеры (оставлено без изменений)
         if (this.car && this.cameras.main.deadzone) { 
             const offsetDistance = -30; 
             const angleRad = Phaser.Math.DegToRad(this.car.angle);
             const offsetX = Math.cos(angleRad) * offsetDistance;
             const offsetY = Math.sin(angleRad) * offsetDistance;
             this.cameras.main.setFollowOffset(offsetX, offsetY);
         }

        // --- ДОБАВЛЕНО В UPDATE (конец) ---
         // Убедимся, что тень видима, когда машина не движется и игра идет
        if (!this.isMoving && this.car?.visible && this.carShadow && !this.carShadow.visible) {
             this.carShadow.setVisible(true);
        }
        // --- КОНЕЦ ДОБАВЛЕНИЙ В UPDATE ---
    }

    // --- Завершение хода (Обновлено) ---
    finishMove() {
        if(!this.isMoving) return; // На всякий случай, если вызвали повторно

        const nextSpeed = this.car.getData('nextSpeed');
        const nextRedCooldown = this.car.getData('nextRedCooldown');
        const nextAccelDisabled = this.car.getData('nextAccelDisabled');

        if (nextSpeed !== undefined) this.car.setData('speed', nextSpeed);

        let currentRedCooldown = this.car.getData('redCooldown') ?? 0;
        if (nextRedCooldown !== undefined) { // Если контроллер задал новое значение
            currentRedCooldown = nextRedCooldown;
        } else if (currentRedCooldown > 0) { // Иначе, если был кулдаун, уменьшаем
             currentRedCooldown--;
        }
        this.car.setData('redCooldown', currentRedCooldown);

        const accelDisabledForThisTurn = (nextAccelDisabled === true);
        this.car.setData('accelDisabled', accelDisabledForThisTurn);

        this.car.setData('nextSpeed', undefined);
        this.car.setData('nextRedCooldown', undefined);
        this.car.setData('nextAccelDisabled', undefined);

        this.isMoving = false; // Движение завершено
        if (this.physics.world) this.physics.world.destination = null; // Сбрасываем цель физики
        this.prevDistanceToTarget = undefined; // Сброс детектора промаха

        console.log("GameScene: Turn finished. Current State - Speed:", this.car.getData('speed').toFixed(2), "RedCD:", this.car.getData('redCooldown'), "AccelDisabled:", this.car.getData('accelDisabled'));

        if (this.fuel <= 0 && !this.gameOver && !this.levelComplete) {
            this.handleOutOfFuel();
            return; // Выходим, т.к. игра закончилась
        }

        if (this.scene.isActive(this.scene.key) && !this.levelComplete && !this.gameOver && this.arcController) {
             const pointer = this.input.activePointer; 
             this.arcController.resetForNextTurn(pointer); 
             this.updateInfoText(); 
        } else if(this.arcController) {
             this.arcController.clearVisuals();
             this.updateInfoText();
        }
    }


    // --- Логика реплея (Остается в сцене) ---

    startReplay() {
        if (!this.movesHistory || this.movesHistory.length === 0) {
            console.log("No moves to replay.");
            return;
        }
        if (this.car) this.car.setVisible(false); // Скрываем основную машину
        if (this.carShadow) this.carShadow.setVisible(false); // <-- ДОБАВЛЕНО: Скрываем тень основной машины

        if (this.arcController) this.arcController.clearVisuals();

        this.replayCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
             .setDepth(this.car ? this.car.depth + 1 : 11) // Чуть выше основной
             .setScale(this.car ? this.car.scale : 0.3);

         // --- Создание тени для машины реплея --- // <-- ДОБАВЛЕНО
         this.replayCarShadow = this.add.sprite(0, 0, CAR_PLAYER_KEY);
         this.replayCarShadow.setScale(this.replayCar.scale);
         this.replayCarShadow.setOrigin(this.replayCar.originX, this.replayCar.originY);
         this.replayCarShadow.setTint(SHADOW_COLOR);
         this.replayCarShadow.setAlpha(SHADOW_ALPHA);
         this.replayCarShadow.setDepth(this.replayCar.depth + SHADOW_DEPTH_OFFSET);
         // --- КОНЕЦ СОЗДАНИЯ ТЕНИ РЕПЛЕЯ ---

        if (this.uiCamera) {
             this.uiCamera.ignore(this.replayCar);
             if (this.replayCarShadow) this.uiCamera.ignore(this.replayCarShadow); // <-- ДОБАВЛЕНО: Игнорируем тень реплея
        }

        this.cameras.main.startFollow(this.replayCar, true, 0.05, 0.05); // Плавнее?
        this.cameras.main.setFollowOffset(0,0); // Сбрасываем смещение для реплея

        const firstMove = this.movesHistory[0];
        this.replayCar.setPosition(firstMove.startX, firstMove.startY);
        this.replayCar.setAngle(firstMove.fromAngleDeg);

         // --- Установка начальной позиции/угла тени реплея --- // <-- ДОБАВЛЕНО
         if(this.replayCarShadow) {
             this.replayCarShadow.setPosition(this.replayCar.x, this.replayCar.y + SHADOW_OFFSET_Y);
             this.replayCarShadow.setAngle(this.replayCar.angle);
             this.replayCarShadow.setVisible(true); // Убедимся что видима
         }
         // --- КОНЕЦ УСТАНОВКИ НАЧАЛЬНОЙ ПОЗИЦИИ ТЕНИ РЕПЛЕЯ ---

        this.currentReplayIndex = 0;
        console.log("Replay started...");
        this.replayNextMove(); // Запускаем первый ход реплея
    }

    replayNextMove() {
        if (!this.replayCar || !this.replayCar.active) {
             console.log("Replay stopped: replay car removed.");
             if (this.replayCarShadow) this.replayCarShadow.destroy(); // <-- ДОБАВЛЕНО: Уничтожаем тень
             this.replayCarShadow = null;                            // <-- ДОБАВЛЕНО
             this.cameras.main.stopFollow(); // Прекращаем слежение
             return;
        }
        if (this.currentReplayIndex >= this.movesHistory.length) {
            console.log("Replay finished.");
             this.replayCar.setVisible(false);
             if (this.replayCarShadow) this.replayCarShadow.setVisible(false); // <-- ДОБАВЛЕНО: Скрываем тень
             this.cameras.main.stopFollow();
            return;
        }

        const step = this.movesHistory[this.currentReplayIndex];
        this.currentReplayIndex++;

        // --- Установка начальной позиции/угла перед твином --- // <-- ДОБАВЛЕНО
        this.replayCar.setPosition(step.startX, step.startY);
        this.replayCar.setAngle(step.fromAngleDeg);
        if (this.replayCarShadow) {
            this.replayCarShadow.setPosition(this.replayCar.x, this.replayCar.y + SHADOW_OFFSET_Y);
            this.replayCarShadow.setAngle(this.replayCar.angle);
            if (!this.replayCarShadow.visible) this.replayCarShadow.setVisible(true);
        }
        // --- КОНЕЦ УСТАНОВКИ НАЧАЛЬНОЙ ПОЗИЦИИ/УГЛА ---

        const duration = Math.max(step.turnDuration, step.moveTime); // Берем максимальное время поворота/движения

        console.log(`Replaying move ${this.currentReplayIndex}: duration ${duration.toFixed(0)}ms`);

        let primaryTweenCompleted = false;
        let shadowTweenCompleted = !this.replayCarShadow; // Если тени нет, считаем ее твин завершенным

        const checkCompletion = () => {
             if(primaryTweenCompleted && shadowTweenCompleted) {
                  this.replayNextMove(); // Сразу следующий ход
             }
        }

        // Твин основной машины реплея
        this.tweens.add({
            targets: this.replayCar,
            x: step.targetX,
            y: step.targetY,
            angle: step.finalAngleDeg, // Используем конечный угол из истории
            duration: duration,
            ease: 'Linear', // Или другая интерполяция
            onComplete: () => {
             primaryTweenCompleted = true;
             checkCompletion();
            //     // Небольшая пауза между ходами?
            //     // this.time.delayedCall(100, this.replayNextMove, [], this);
            // //     this.replayNextMove(); // Перенесено в checkCompletion
            }
        });

       // --- Твин тени машины реплея (параллельно) --- // <-- ДОБАВЛЕНО
       if (this.replayCarShadow) {
           this.tweens.add({
               targets: this.replayCarShadow,
               x: step.targetX,                             // К той же X координате
               y: step.targetY + SHADOW_OFFSET_Y,           // К той же Y координате + смещение
               angle: step.finalAngleDeg,                   // Тот же угол
               duration: duration,
               ease: 'Linear',
               onComplete: () => {
                   shadowTweenCompleted = true;
                   checkCompletion();
               }
           });
       }
       // --- КОНЕЦ ТВИНА ТЕНИ ---
    }

    // --- Отладка (Остается в сцене) ---

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

        const checkDebugInput = () => this.car?.active && !this.isMoving && !this.levelComplete && !this.gameOver;

        this.input.keyboard.on('keydown-W', () => {
            if (!checkDebugInput()) return;
            let s = Phaser.Math.Clamp((this.car.getData('speed') ?? MIN_SPEED) + 0.5, MIN_SPEED, MAX_SPEED);
            this.car.setData('speed', s);
            this.calculateAndDrawState(); // Перерисовываем контроллер
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
             if (this.carShadow) this.carShadow.angle = this.car.angle; // <-- ДОБАВЛЕНО: Обновление тени
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-D', () => {
             if (!checkDebugInput()) return;
             this.car.angle += 15;
              if (this.carShadow) this.carShadow.angle = this.car.angle; // <-- ДОБАВЛЕНО: Обновление тени
             this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-P', () => {
            if (checkDebugInput() && this.cube?.active) {
                 console.log("Debug: Skipping level...");
                 this.handleCollectCube(this.car, this.cube); // Вызываем сбор куба
            }
        });
        this.input.keyboard.on('keydown-R', () => {
            console.log("Debug: Resetting obstacle threshold in registry to initial value for next level restart.");
            this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
        });
        this.input.keyboard.on('keydown-F', () => {
            if (checkDebugInput()) {
                this.fuel = Math.min(this.fuel + 5, INITIAL_FUEL);
                console.log(`Debug: Added fuel. Current: ${this.fuel}`);
                this.updateFuelDisplay();
                this.updateInfoText();
            }
        });
    }

     // --- Новый метод для делегирования ---
     calculateAndDrawState() {
         if (!this.car || !this.car.body || !this.arcController) {
              console.warn("Cannot draw state - car or controller missing");
              return;
         }

         if (this.isMoving || this.levelComplete || this.gameOver) {
              this.arcController.clearVisuals();
         } else {
              this.arcController.drawState();
         }
         this.updateInfoText();
     }


} // Конец класса GameScene