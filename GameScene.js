class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.ignoreNextPointerUp = false;
        this.isUIInteraction = false;
        this.levelStartBlockTime = 0;
        this.levelStartBlockDuration = 500;
        this.car = null;
        this.carShadow = null;
        this.controlArcGraphics = null;
        this.trajectoryGraphics = null;
        this.ghostCar = null;
        this.snapCursor = null;
        this.arcController = null;
        this.debugMode = false;

        this.infoText = null;
        this.levelText = null;
        this.fuelText = null;
        this.isMoving = false;
        this.obstaclesGroup = null;
        this.obstacleShadowsGroup = null;
        this.collectibleGroup = null;
        this.fuelPickupGroup = null;
        this.cube = null;
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
        this.prevDistanceToTarget = undefined;

        this.currentLevel = 1;
        this.currentObstacleThreshold = INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL;

        this.occupiedCellsForSpawning = null;
        this.gridWidthForSpawning = 0;
        this.gridHeightForSpawning = 0;

        this.movesHistory = [];
        this.replayCar = null;
        this.replayCarShadow = null;
        this.currentReplayIndex = 0;

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

        this.load.image(CAR_PLAYER_KEY, 'assets/car_player.png?v=__GIT_HASH__');
        this.load.image(SAND_TEXTURE_KEY, 'assets/sand_texture.jpg?v=__GIT_HASH__');
        this.load.image(OBSTACLE_IMAGE_KEY, 'assets/block.png?v=__GIT_HASH__');
        this.load.image(RESTART_BUTTON_KEY, 'assets/restart.png?v=__GIT_HASH__');
        this.load.image(START_BUTTON_KEY, 'assets/STARTGAME.png?v=__GIT_HASH__');
        this.load.image(NEXT_LEVEL_BUTTON_KEY, 'assets/NEXTLEVEL.png?v=__GIT_HASH__');
        this.load.image(FUEL_PICKUP_KEY, 'assets/fuel.png?v=__GIT_HASH__');
        this.load.image(PORTAL_KEY, 'assets/portal.png?v=__GIT_HASH__');
        this.load.image('arrow', 'assets/arrow.png?v=__GIT_HASH__');
    }

    create() {
        console.log("Phaser version:", Phaser.VERSION);

        if (this.carShadow) this.carShadow.destroy();
        this.carShadow = null;
        if (this.replayCarShadow) this.replayCarShadow.destroy();
        this.replayCarShadow = null;

        if (!this.registry.get('isRestarting')) {
            this.ignoreNextPointerUp = true;
            this.time.delayedCall(1000, () => {
                this.ignoreNextPointerUp = false;
            }, [], this);
        } else {
            this.registry.set('isRestarting', false);
            this.ignoreNextPointerUp = false;
        }

        this.movesHistory = [];
        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.currentObstacleThreshold = this.registry.get('obstacleThreshold') || INITIAL_OBSTACLE_THRESHOLD;
        this.fuel = INITIAL_FUEL;
        this.levelComplete = false;
        this.gameOver = false;
        this.isMoving = false;
        this.arcController = null;

        this.draggingFromEmptySpace = false;
        this.pointerDownX = 0;
        this.pointerDownY = 0;

        console.log(`Creating scene for Level ${this.currentLevel}... Obstacle Threshold: ${this.currentObstacleThreshold.toFixed(2)}`);

        // --- Инициализация Simplex Noise ---
        if (typeof SimplexNoise === 'undefined') {
            console.error("SimplexNoise library not found!");
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
        this.obstacleShadowsGroup = this.add.group();
        this.collectibleGroup = this.physics.add.group();
        this.fuelPickupGroup = this.physics.add.group();

        // --- Генерация уровня ---
        this.createLevel();

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
        this.car.angle = -90;
        this.car.body.setCircle(carRadius);
        this.car.body.setOffset(70, 20);
        this.car.setCollideWorldBounds(true).setDepth(10);

        // --- Создание тени для машины ---
        this.carShadow = this.add.sprite(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y, CAR_PLAYER_KEY);
        this.carShadow.setScale(this.car.scale);
        this.carShadow.setOrigin(this.car.originX, this.car.originY);
        this.carShadow.setAngle(this.car.angle);
        this.carShadow.setTint(SHADOW_COLOR);
        this.carShadow.setAlpha(SHADOW_ALPHA);
        this.carShadow.setDepth(this.car.depth + SHADOW_DEPTH_OFFSET);

        // --- Спавн топлива ---
        for (let i = 0; i < 10; i++) {
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
        this.snapCursor = this.add.graphics().setDepth(50);

        // --- Создание и инициализация ArcController ---
        this.arcController = new ArcController(
            this,
            this.car,
            this.controlArcGraphics,
            this.trajectoryGraphics,
            this.ghostCar,
            this.snapCursor
        );
        console.log("ArcController initialized.");

        // --- Элементы UI ---
        // Уровень в левом верхнем углу
        this.levelText = this.add.text(10, 5, `Level ${this.currentLevel} / ${TOTAL_LEVELS}`, {
            font: 'bold 20px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'left'
        }).setOrigin(0, 0).setDepth(21);

        // Скорость под уровнем
        this.speedText = this.add.text(10, 35, '', {
            font: 'bold 20px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'left'
        }).setOrigin(0, 0).setDepth(21);

        // Топливо по центру вверху
        this.fuelText = this.add.text(GAME_WIDTH / 2, 5, '', {
            font: 'bold 20px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(21);
        this.updateFuelDisplay();

        this.playAgainButton = this.add.image(0, 0, START_BUTTON_KEY)
            .setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', this.startNewGame, this);

        this.restartButtonObject = this.add.image(GAME_WIDTH - 5, 5, RESTART_BUTTON_KEY)
            .setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true });
        this.restartButtonObject.on('pointerdown', () => {
            console.log("Restart button clicked!");
            if (!this.isMoving && !this.levelComplete && !this.gameOver) {
                this.scene.restart();
            }
        });

        this.winText = this.add.text(0, 0, 'LEVEL COMPLETE!', {
            font: 'bold 36px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        this.nextLevelButton = null;
        if (this.currentLevel < TOTAL_LEVELS) {
            this.nextLevelButton = this.add.image(0, 0, NEXT_LEVEL_BUTTON_KEY)
                .setVisible(false).setInteractive({ useHandCursor: true })
                .on('pointerdown', this.startNextLevel, this);
        }

        this.restartLevelText = this.add.text(0, 0, '', {
            font: 'bold 36px Courier New',
            fill: '#ffff00',
            stroke: '#634125',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(26).setVisible(false);

        // Устанавливаем время начала блокировки
        this.levelStartBlockTime = this.time.now;

        // 1) Pointer Down
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button !== 0) return;
            
            // Проверяем, не нажали ли мы на UI элементы
            const pointerX = pointer.worldX;
            const pointerY = pointer.worldY;
            
            // Проверяем попадание в кнопки UI
            const hitUI = [
                this.nextLevelButton,
                this.restartButtonObject,
                this.playAgainButton
            ].some(button => {
                if (!button || !button.visible) return false;
                const bounds = button.getBounds();
                // Преобразуем мировые координаты в экранные для проверки UI элементов
                const screenPoint = this.cameras.main.getWorldPoint(pointerX, pointerY);
                return bounds.contains(screenPoint.x, screenPoint.y);
            });
            
            if (hitUI) {
                console.log("UI button clicked, ignoring pointerdown");
                this.isUIInteraction = true;
                return;
            }
            
            this.isUIInteraction = false;
            
            // Проверяем, не истекло ли время блокировки после старта уровня
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                console.log("Level start block active, ignoring pointerdown");
                return;
            }
            
            if (this.isMoving || this.levelComplete || this.gameOver || !this.car || !this.arcController || this.ignoreNextPointerUp) {
                return;
            }

            const directArcZone = this.arcController.getArcZoneForPoint(pointerX, pointerY);

            // Затем проверяем, находится ли клик *рядом* с аркой (в пределах VIRTUAL_JOYSTICK_BLOCK_RADIUS)
            // Это нужно, чтобы предотвратить случайный запуск виртуального джойстика при клике у края арки
            const isClickNearArc = this.arcController.isPointNearArc(pointerX, pointerY, VIRTUAL_JOYSTICK_BLOCK_RADIUS);

            // Виртуальный джойстик (метод 2) должен активироваться ТОЛЬКО если
            // клик НЕ был на активной зоне И НЕ был рядом с аркой.
            if (directArcZone === null && !isClickNearArc) {
                // "Второй метод" - клик по пустоте, достаточно далеко от арки
                console.log("PointerDown: Activating virtual joystick (click far from arc).");
                this.draggingFromEmptySpace = true;

                // Запоминаем, где реально нажали
                this.pointerDownX = pointerX;
                this.pointerDownY = pointerY;

                // Ставим snapCursor «виртуально» в центр арки (чисто визуально для начала)
                const ap = this.arcController.arcParams;
                if (ap && ap.neutralRadius >= 0) { // Добавил проверку neutralRadius
                    // Используем нейтральный радиус как базовую точку отсчета
                    const cx = this.car.x + Math.cos(ap.orientationRad) * ap.neutralRadius;
                    const cy = this.car.y + Math.sin(ap.orientationRad) * ap.neutralRadius;

                    // Рисуем точку на этом месте (чисто визуально)
                    if (this.arcController.snapCursor) {
                        this.arcController.snapCursor.clear();
                        this.arcController.snapCursor.fillStyle(0xffffff, 1);
                        this.arcController.snapCursor.fillCircle(cx, cy, 3.5);
                        // Можно сразу обновить и призрак/траекторию для этой виртуальной точки
                        // this.arcController.handlePointerMove({ worldX: cx, worldY: cy, isDown: true });
                    }
                } else {
                    // Если нет параметров арки, не можем нарисовать виртуальный курсор
                    if (this.arcController.snapCursor) {
                        this.arcController.snapCursor.clear();
                    }
                }

            } else {
                // «Первый метод» - клик прямо по арке ИЛИ клик слишком близко к арке.
                // В обоих случаях НЕ активируем виртуальный джойстик.
                // Если клик был близко, но не попал в зону, то pointerup ничего не сделает.
                console.log("PointerDown: Click was on or near the arc. Virtual joystick blocked.");
                this.draggingFromEmptySpace = false;
                // Можно сразу обновить hover state для арки, если попали рядом, но не на зону
                this.arcController.handlePointerMove(pointer);
            }
        });

        // 2) Pointer Move
        this.input.on('pointermove', (pointer) => {
            if (this.levelComplete || this.gameOver || !this.arcController || this.isUIInteraction) return;
            
            // Проверяем блокировку после старта уровня
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                return;
            }

            // Если машина едет - очищаем дугу
            if (this.isMoving) {
                this.arcController.clearVisuals();
                return;
            }

            if (this.draggingFromEmptySpace && pointer.isDown) {
                // === Главное место: считаем виртуальные координаты ===
                const ap = this.arcController.arcParams;
                if (!ap) return;

                // Берём «центр арки»
                const arcCenterX = this.car.x + Math.cos(ap.orientationRad) * ap.neutralRadius;
                const arcCenterY = this.car.y + Math.sin(ap.orientationRad) * ap.neutralRadius;

                // Смещение реального указателя относительно того места, где нажали
                const deltaX = pointer.worldX - this.pointerDownX;
                const deltaY = pointer.worldY - this.pointerDownY;

                // «Виртуальная» позиция курсора = «центр арки» + это смещение
                const virtualX = arcCenterX + deltaX;
                const virtualY = arcCenterY + deltaY;

                // Передаём подделанные координаты в arcController
                this.arcController.handlePointerMove({
                    worldX: virtualX,
                    worldY: virtualY,
                    isDown: pointer.isDown  // На всякий случай
                });

            } else {
                // Старая логика, когда прямой клик по арке
                this.arcController.handlePointerMove(pointer);
            }
        });

        // 3) Pointer Up
        this.input.on('pointerup', (pointer) => {
            if (pointer.button !== 0) return;
            if (this.isMoving || this.levelComplete || this.gameOver || !this.car || !this.arcController || this.isUIInteraction) {
                return;
            }
            
            // Проверяем блокировку после старта уровня
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                return;
            }

            if (this.fuel <= 0) {
                this.handleOutOfFuel();
                return;
            }

            if (this.draggingFromEmptySpace) {
                this.draggingFromEmptySpace = false;

                // Снова вычислим виртуальную позицию
                const ap = this.arcController.arcParams;
                if (!ap) return;

                const arcCenterX = this.car.x + Math.cos(ap.orientationRad) * ap.neutralRadius;
                const arcCenterY = this.car.y + Math.sin(ap.orientationRad) * ap.neutralRadius;

                const deltaX = pointer.worldX - this.pointerDownX;
                const deltaY = pointer.worldY - this.pointerDownY;

                const virtualX = arcCenterX + deltaX;
                const virtualY = arcCenterY + deltaY;

                const result = this.arcController.handleSceneClick({
                    worldX: virtualX,
                    worldY: virtualY
                });

                if (result && result.moveData) {
                    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
                    this.updateFuelDisplay();
                    this.updateInfoText();

                    this.isMoving = true;
                    this.prevDistanceToTarget = undefined;

                    this.movesHistory.push(result.moveData);
                    console.log("GameScene: Move initiated via controller (drag from empty).");
                } else {
                    console.log("GameScene: No move from empty-space drag.");
                }

            } else {
                // Обычный клик по арке
                const result = this.arcController.handleSceneClick(pointer);
                if (result && result.moveData) {
                    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
                    this.updateFuelDisplay();
                    this.updateInfoText();

                    this.isMoving = true;
                    this.prevDistanceToTarget = undefined;

                    this.movesHistory.push(result.moveData);
                    console.log("GameScene: Move initiated via controller.");
                } else {
                    console.log("GameScene: Click did not initiate a move via controller.");
                }
            }
        });

        // --- Настройка физики и столкновений ---
        this.physics.add.overlap(this.car, this.obstaclesGroup, this.handleCollision, null, this);
        this.physics.add.overlap(this.car, this.collectibleGroup, this.handleCollectCube, null, this);
        this.physics.add.overlap(this.car, this.fuelPickupGroup, this.handleCollectFuelPickup, null, this);

        // --- Камеры ---
        this.cameras.main.startFollow(this.car, true, 0.05, 0.05);
        this.cameras.main.setZoom(2);
        this.cameras.main.setDeadzone(50, 50);

        this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.uiCamera.setScroll(0, 0).setZoom(1);
        this.uiCamera.ignore([
            this.backgroundTile,
            this.ghostCar,
            this.car,
            this.carShadow,
            this.obstaclesGroup.getChildren(),
            this.obstacleShadowsGroup.getChildren(),
            ...this.fuelPickupGroup.getChildren().filter(c => c.active),
            this.collectibleGroup.getChildren(),
            this.controlArcGraphics,
            this.trajectoryGraphics,
            this.snapCursor
        ]);

        const mainCameraIgnoreList = [
            this.levelText, this.fuelText,
            this.playAgainButton, this.restartButtonObject, this.winText,
            this.nextLevelButton, this.restartLevelText
        ].filter(item => item);
        if (mainCameraIgnoreList.length > 0) {
            this.cameras.main.ignore(mainCameraIgnoreList);
        }

        // --- Стрелка портала ---
        this.portalArrow = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arrow')
            .setDepth(200)
            .setScrollFactor(0)
            .setVisible(false)
            .setScale(1.2);
        this.cameras.main.ignore(this.portalArrow);

        // --- Отладочные контролы ---
        this.setupDebugControls();
        this.input.keyboard.enabled = true;

        // --- Первая отрисовка состояния контроллера ---
        this.calculateAndDrawState();

        // Добавляем обработчик изменения размера
        this.scale.on('resize', this.handleResize, this);
        this.handleResize();

        console.log("Game Scene create() finished.");
    }

    handleResize() {
        if (!this.cameras || !this.cameras.main) {
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;
        const aspectRatio = width / height;

        // Ограничиваем соотношение сторон
        let newWidth = width;
        let newHeight = height;

        if (aspectRatio > MAX_ASPECT_RATIO) {
            newWidth = height * MAX_ASPECT_RATIO;
        } else if (aspectRatio < MIN_ASPECT_RATIO) {
            newHeight = width / MIN_ASPECT_RATIO;
        }

        // Обновляем размер камеры
        this.cameras.main.setViewport(
            (width - newWidth) / 2,
            (height - newHeight) / 2,
            newWidth,
            newHeight
        );

        // Обновляем размер UI камеры
        if (this.uiCamera) {
            this.uiCamera.setViewport(
                (width - newWidth) / 2,
                (height - newHeight) / 2,
                newWidth,
                newHeight
            );
        }

        // Обновляем позиции UI элементов
        const centerX = newWidth / 2;
        const centerY = newHeight / 2;

        // Обновляем позиции текстовых сообщений
        if (this.winText) {
            this.winText.setPosition(centerX, centerY - 50);
        }

        if (this.restartLevelText) {
            this.restartLevelText.setPosition(centerX, centerY - 50);
        }

        // Обновляем позиции кнопок
        if (this.playAgainButton) {
            this.playAgainButton.setPosition(centerX, centerY + 30);
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.setPosition(centerX, centerY + 30);
        }

        // Обновляем позицию кнопки перезапуска
        if (this.restartButtonObject) {
            this.restartButtonObject.setPosition(newWidth - 5, 5);
        }

        // Обновляем позиции информационных текстов
        if (this.levelText) {
            this.levelText.setPosition(10, 5);
        }

        if (this.speedText) {
            this.speedText.setPosition(10, 35);
        }

        if (this.fuelText) {
            this.fuelText.setPosition(centerX, 5);
        }
    }

    // --- Генерация уровня ---
    createLevel() {
        console.log("Creating level obstacles, border, and cube...");
        if (this.obstaclesGroup) this.obstaclesGroup.clear(true, true);
        if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.clear(true, true);
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

        const startGridX = Math.floor((REAL_GAME_WIDTH / 2) / GRID_CELL_SIZE);
        const startGridY = Math.floor((REAL_GAME_HEIGHT / 2) / GRID_CELL_SIZE);
        const clearRadiusGrid = Math.ceil(startClearRadius / GRID_CELL_SIZE);
        for (let dy = -clearRadiusGrid; dy <= clearRadiusGrid; dy++) {
            for (let dx = -clearRadiusGrid; dx <= clearRadiusGrid; dx++) {
                const checkX = startGridX + dx;
                const checkY = startGridY + dy;
                if (checkX >= 0 && checkX < gridWidth && checkY >= 0 && checkY < gridHeight) {
                    if (Phaser.Math.Distance.Between(startGridX, startGridY, checkX, checkY) <= clearRadiusGrid) {
                        occupiedCells[checkY][checkX] = true;
                    }
                }
            }
        }

        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const cellCenterX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                if (occupiedCells[gy][gx]) continue;
                if (noiseGenerator.noise2D(cellCenterX / scale, cellCenterY / scale) > threshold) {
                    const obstacle = this.obstaclesGroup.create(cellCenterX, cellCenterY, OBSTACLE_IMAGE_KEY);
                    obstacle.setScale(0.5);
                    obstacle.setDepth(-1);

                    const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                    shadow.setScale(obstacle.scale);
                    shadow.setOrigin(obstacle.originX, obstacle.originY);
                    shadow.setTint(SHADOW_COLOR);
                    shadow.setAlpha(SHADOW_ALPHA);
                    shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                    if (this.obstacleShadowsGroup) {
                        this.obstacleShadowsGroup.add(shadow);
                    }

                    const collisionSize = GRID_CELL_SIZE * 0.8;
                    const originalSize = GRID_CELL_SIZE;
                    const offsetX = (originalSize - collisionSize) / 2;
                    const offsetY = (originalSize - collisionSize) / 2;

                    obstacle.body.setSize(collisionSize, collisionSize);
                    obstacle.body.setOffset(offsetX, offsetY);
                    obstacle.refreshBody();

                    occupiedCells[gy][gx] = true;
                }
            }
        }
        console.log(`Generated ${this.obstaclesGroup.getLength()} obstacles from noise.`);

        let borderObstaclesCount = 0;
        for (let gx = 0; gx < gridWidth; gx++) {
            const topX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const topY = GRID_CELL_SIZE / 2;
            const bottomY = (gridHeight - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            if (!occupiedCells[0][gx]) {
                const obstacle = this.obstaclesGroup.create(topX, topY, OBSTACLE_IMAGE_KEY);
                obstacle.setScale(0.5);
                obstacle.setDepth(-1);

                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);

                const collisionSize = GRID_CELL_SIZE * 0.8;
                const originalSize = GRID_CELL_SIZE;
                const offsetX = (originalSize - collisionSize) / 2;
                const offsetY = (originalSize - collisionSize) / 2;

                obstacle.body.setSize(collisionSize, collisionSize);
                obstacle.body.setOffset(offsetX, offsetY);
                obstacle.refreshBody();

                occupiedCells[0][gx] = true;
                borderObstaclesCount++;
            }
            if (gridHeight > 1 && !occupiedCells[gridHeight - 1][gx]) {
                const obstacle = this.obstaclesGroup.create(topX, bottomY, OBSTACLE_IMAGE_KEY);
                obstacle.setScale(0.5);
                obstacle.setDepth(-1);

                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);

                const collisionSize = GRID_CELL_SIZE * 0.8;
                const originalSize = GRID_CELL_SIZE;
                const offsetX = (originalSize - collisionSize) / 2;
                const offsetY = (originalSize - collisionSize) / 2;

                obstacle.body.setSize(collisionSize, collisionSize);
                obstacle.body.setOffset(offsetX, offsetY);
                obstacle.refreshBody();

                occupiedCells[gridHeight - 1][gx] = true;
                borderObstaclesCount++;
            }
        }
        for (let gy = 1; gy < gridHeight - 1; gy++) {
            const leftX = GRID_CELL_SIZE / 2;
            const leftY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const rightX = (gridWidth - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            if (!occupiedCells[gy][0]) {
                const obstacle = this.obstaclesGroup.create(leftX, leftY, OBSTACLE_IMAGE_KEY);
                obstacle.setScale(0.5);
                obstacle.setDepth(-1);

                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);

                const collisionSize = GRID_CELL_SIZE * 0.8;
                const originalSize = GRID_CELL_SIZE;
                const offsetX = (originalSize - collisionSize) / 2;
                const offsetY = (originalSize - collisionSize) / 2;

                obstacle.body.setSize(collisionSize, collisionSize);
                obstacle.body.setOffset(offsetX, offsetY);
                obstacle.refreshBody();

                occupiedCells[gy][0] = true;
                borderObstaclesCount++;
            }
            if (gridWidth > 1 && !occupiedCells[gy][gridWidth - 1]) {
                const obstacle = this.obstaclesGroup.create(rightX, leftY, OBSTACLE_IMAGE_KEY);
                obstacle.setScale(0.5);
                obstacle.setDepth(-1);

                const shadow = this.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                shadow.setScale(obstacle.scale);
                shadow.setOrigin(obstacle.originX, obstacle.originY);
                shadow.setTint(SHADOW_COLOR);
                shadow.setAlpha(SHADOW_ALPHA);
                shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                if (this.obstacleShadowsGroup) this.obstacleShadowsGroup.add(shadow);

                const collisionSize = GRID_CELL_SIZE * 0.8;
                const originalSize = GRID_CELL_SIZE;
                const offsetX = (originalSize - collisionSize) / 2;
                const offsetY = (originalSize - collisionSize) / 2;

                obstacle.body.setSize(collisionSize, collisionSize);
                obstacle.body.setOffset(offsetX, offsetY);
                obstacle.refreshBody();

                occupiedCells[gy][gridWidth - 1] = true;
                borderObstaclesCount++;
            }
        }
        console.log(`Added ${borderObstaclesCount} border obstacles.`);
        console.log(`Total obstacles on level: ${this.obstaclesGroup.getLength()}. Total shadows: ${this.obstacleShadowsGroup?.getLength() ?? 0}.`);

        this.spawnCube(occupiedCells, gridWidth, gridHeight);

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
        const minSpawnDistCells = 8;

        while (!cubeSpawned && attempts < maxAttempts) {
            const randomGridX = Phaser.Math.Between(0, gridWidth - 1);
            const randomGridY = Phaser.Math.Between(0, gridHeight - 1);

            if (
                randomGridY >= 0 && randomGridY < occupiedCells.length &&
                randomGridX >= 0 && randomGridX < occupiedCells[randomGridY].length &&
                !occupiedCells[randomGridY][randomGridX]
            ) {
                const distanceInCells = Phaser.Math.Distance.Between(randomGridX, randomGridY, startGridX, startGridY);
                if (distanceInCells >= minSpawnDistCells) {
                    const cubeX = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const cubeY = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                    const portalSprite = this.collectibleGroup.create(cubeX, cubeY, PORTAL_KEY);
                    if (portalSprite) {
                        portalSprite.setOrigin(0.5).setDepth(0);
                        portalSprite.setScale(1.5);
                        this.tweens.add({
                            targets: portalSprite,
                            scaleY: portalSprite.scaleY * 1.1,
                            scaleX: portalSprite.scaleX * 0.9,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut',
                            duration: 800
                        });
                        this.cube = portalSprite;
                        occupiedCells[randomGridY][randomGridX] = true;
                        cubeSpawned = true;
                        console.log(`Portal spawned at grid (${randomGridX}, ${randomGridY})`);
                    } else {
                        console.error("Failed to create portal sprite.");
                        break;
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
        const maxAttempts = gridWidth * gridHeight / 2;

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
                    pickup.setDisplaySize(GRID_CELL_SIZE * 0.8, GRID_CELL_SIZE * 0.8);
                    this.tweens.add({
                        targets: pickup,
                        scale: pickup.scale * 1.1,
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
        if (!pickupSpawned) {
            console.warn(`Could not find a free cell to spawn fuel pickup after ${attempts} attempts.`);
        }
    }

    // --- Обновление UI ---
    updateFuelDisplay() {
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
        if (!this.speedText || !this.car || !this.speedText.active) return;
        const speed = this.car.getData('speed') ?? 0;
        this.speedText.setText(`Speed: ${speed.toFixed(1)}`);
    }

    // --- Обработка событий игры ---
    handleCollectCube(car, cube) {
        if (!cube || !cube.active || this.levelComplete || this.gameOver) return;
        console.log(`Cube collected! Level ${this.currentLevel} Complete!`);
        this.levelComplete = true;

        this.tweens.killTweensOf(cube);
        cube.destroy();
        this.cube = null;
        if (this.isMoving && this.car?.body) {
            this.tweens.killTweensOf(this.car);
            this.car.body.stop();
            if (this.physics.world) this.physics.world.destination = null;
            this.isMoving = false;
        }
        if (this.car?.body) this.car.body.enable = false;

        if (this.arcController) this.arcController.clearVisuals();

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;

        if (this.winText) this.winText.setVisible(true);
        if (this.currentLevel >= TOTAL_LEVELS) {
            if (this.winText) this.winText.setText('YOU WIN!').setVisible(true);
            if (this.playAgainButton) this.playAgainButton.setVisible(true);
            if (this.nextLevelButton) this.nextLevelButton.setVisible(false);
        } else {
            if (this.winText) this.winText.setText('LEVEL COMPLETE!').setVisible(true);
            if (this.nextLevelButton) this.nextLevelButton.setVisible(true);
            if (this.playAgainButton) this.playAgainButton.setVisible(false);
        }

        this.startReplay();
        if (this.cameras.main) this.cameras.main.flash(400, WIN_FLASH_COLOR);
        this.updateInfoText();
    }

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
    }

    triggerGameOver(message) {
        if (this.gameOver || this.levelComplete) return;
        this.gameOver = true;
        this.isMoving = false;

        console.log("GAME OVER:", message);
        if (this.car) {
            this.tweens.killTweensOf(this.car);
            if (this.car.body) {
                this.car.body.stop();
                this.car.body.enable = false;
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

    handleOutOfFuel() {
        if (this.gameOver || this.levelComplete) return;
        console.log("Fuel depleted!");
        this.triggerGameOver(`OUT OF FUEL! LEVEL ${this.currentLevel}`);
    }

    startNextLevel() {
        if (!this.levelComplete || this.currentLevel >= TOTAL_LEVELS) return;
        if (this.nextLevelButton) this.nextLevelButton.disableInteractive();

        console.log("Starting next level...");
        const nextLevel = this.currentLevel + 1;
        const nextObstacleThreshold = Math.max(MIN_OBSTACLE_THRESHOLD, this.currentObstacleThreshold - OBSTACLE_THRESHOLD_DECREMENT);

        // Очищаем обработчики событий перед перезапуском
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
        this.input.keyboard.enabled = false;
        
        // Дополнительная очистка
        if (this.arcController) {
            this.arcController.clearVisuals();
            this.arcController = null;
        }
        
        // Отключаем все интерактивные элементы
        if (this.nextLevelButton) this.nextLevelButton.removeInteractive();
        if (this.restartButtonObject) this.restartButtonObject.removeInteractive();
        if (this.playAgainButton) this.playAgainButton.removeInteractive();

        this.registry.set('currentLevel', nextLevel);
        this.registry.set('obstacleThreshold', nextObstacleThreshold);
        this.registry.set('isRestarting', true);

        // Сбрасываем флаг UI взаимодействия
        this.isUIInteraction = false;
        // Устанавливаем время начала блокировки
        this.levelStartBlockTime = this.time.now;

        if (this.scene.isActive(this.scene.key)) {
            this.scene.restart();
        }
    }

    // --- Метод Update ---
    update(time, delta) {
        if (this.gameOver || this.levelComplete) {
            if (this.carShadow?.visible) this.carShadow.setVisible(false);
            if (this.arcController) this.arcController.clearVisuals();
            return;
        }

        if (!this.car || !this.car.body || !this.car.active) {
            if (this.carShadow?.visible) this.carShadow.setVisible(false);
            return;
        }

        if (this.carShadow && this.carShadow.active) {
            this.carShadow.x = this.car.x + 2;
            this.carShadow.y = this.car.y + SHADOW_OFFSET_Y;
            this.carShadow.setAngle(this.car.angle);

            if (this.car.visible !== this.carShadow.visible) {
                this.carShadow.setVisible(this.car.visible);
            }
        } else if (this.carShadow && this.car.visible) {
            this.carShadow.setActive(true).setVisible(true);
            this.carShadow.x = this.car.x + 2;
            this.carShadow.y = this.car.y + SHADOW_OFFSET_Y;
            this.carShadow.setAngle(this.car.angle);
        }

        if (this.isMoving && this.physics.world?.destination) {
            const destination = this.physics.world.destination;
            const distanceToTarget = Phaser.Math.Distance.Between(this.car.x, this.car.y, destination.x, destination.y);
            const speed = this.car.body.velocity.length();

            if (this.prevDistanceToTarget !== undefined) {
                if (distanceToTarget > this.prevDistanceToTarget + 1 && speed > 1) {
                    console.warn("Overshoot detected? Snapping to destination.");
                    this.car.body.reset(destination.x, destination.y);
                    this.finishMove();
                    return;
                }
            }

            if (distanceToTarget < STOP_DISTANCE_THRESHOLD || (speed < 5 && speed > 0)) {
                this.car.body.reset(destination.x, destination.y);
                this.finishMove();
                return;
            }

            this.prevDistanceToTarget = distanceToTarget;

        } else if (!this.isMoving) {
            this.updateInfoText();
            this.prevDistanceToTarget = undefined;
        }

        // --- Логика стрелки портала ---
        if (!this.cube || !this.cube.active) {
            if (this.portalArrow?.visible) this.portalArrow.setVisible(false);
        } else {
            const camera = this.cameras.main;
            const inCameraView = camera.worldView.contains(this.cube.x, this.cube.y);

            if (inCameraView) {
                if (this.portalArrow?.visible) this.portalArrow.setVisible(false);
            } else {
                if (this.portalArrow && !this.portalArrow.visible) this.portalArrow.setVisible(true);

                const screenCenterX = this.cameras.main.width / 2;
                const screenCenterY = this.cameras.main.height / 2;

                const portalWorldPos = new Phaser.Math.Vector2(this.cube.x, this.cube.y);
                const carWorldPos = new Phaser.Math.Vector2(this.car.x, this.car.y);
                const angleRad = Phaser.Math.Angle.Between(carWorldPos.x, carWorldPos.y, portalWorldPos.x, portalWorldPos.y);

                const margin = 50;
                const radius = Math.min(this.cameras.main.width, this.cameras.main.height) / 2 - margin;

                const arrowScreenX = screenCenterX + Math.cos(angleRad) * radius;
                const arrowScreenY = screenCenterY + Math.sin(angleRad) * radius;

                if (this.portalArrow) {
                    this.portalArrow.setPosition(arrowScreenX, arrowScreenY);
                    const angleDeg = Phaser.Math.RadToDeg(angleRad) - 90;
                    this.portalArrow.setAngle(angleDeg);
                }
            }
        }

        if (this.car && this.cameras.main.deadzone) {
            const offsetDistance = -30;
            const angleRad = Phaser.Math.DegToRad(this.car.angle);
            const offsetX = Math.cos(angleRad) * offsetDistance;
            const offsetY = Math.sin(angleRad) * offsetDistance;
            this.cameras.main.setFollowOffset(offsetX, offsetY);
        }

        if (!this.isMoving && this.car?.visible && this.carShadow && !this.carShadow.visible) {
            this.carShadow.setVisible(true);
        }
    }

    // --- Завершение хода ---
    finishMove() {
        if (!this.isMoving) return;

        const nextSpeed = this.car.getData('nextSpeed');
        const nextRedCooldown = this.car.getData('nextRedCooldown');
        const nextAccelDisabled = this.car.getData('nextAccelDisabled');

        if (nextSpeed !== undefined) {
            this.car.setData('speed', nextSpeed);
            // Обновляем зум камеры при изменении скорости
            const currentSpeed = nextSpeed;
            if (currentSpeed >= CAMERA_ZOOM_SPEED_THRESHOLD) {
                const speedFactor = (currentSpeed - CAMERA_ZOOM_SPEED_THRESHOLD) / (CAMERA_ZOOM_SPEED_MAX - CAMERA_ZOOM_SPEED_THRESHOLD);
                const targetZoom = Phaser.Math.Linear(CAMERA_BASE_ZOOM, CAMERA_MAX_ZOOM, speedFactor);
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: targetZoom,
                    duration: TURN_DURATION,
                    ease: 'Linear'
                });
            } else {
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: CAMERA_BASE_ZOOM,
                    duration: TURN_DURATION,
                    ease: 'Linear'
                });
            }
        }

        let currentRedCooldown = this.car.getData('redCooldown') ?? 0;
        if (nextRedCooldown !== undefined) {
            currentRedCooldown = nextRedCooldown;
        } else if (currentRedCooldown > 0) {
            currentRedCooldown--;
        }
        this.car.setData('redCooldown', currentRedCooldown);

        const accelDisabledForThisTurn = (nextAccelDisabled === true);
        this.car.setData('accelDisabled', accelDisabledForThisTurn);

        this.car.setData('nextSpeed', undefined);
        this.car.setData('nextRedCooldown', undefined);
        this.car.setData('nextAccelDisabled', undefined);

        this.isMoving = false;
        if (this.physics.world) this.physics.world.destination = null;
        this.prevDistanceToTarget = undefined;

        console.log("GameScene: Turn finished. Current State - Speed:", this.car.getData('speed').toFixed(2), "RedCD:", this.car.getData('redCooldown'), "AccelDisabled:", this.car.getData('accelDisabled'));

        if (this.fuel <= 0 && !this.gameOver && !this.levelComplete) {
            this.handleOutOfFuel();
            return;
        }

        if (this.scene.isActive(this.scene.key) && !this.levelComplete && !this.gameOver && this.arcController) {
            const pointer = this.input.activePointer;
            this.arcController.resetForNextTurn(pointer);
            this.updateInfoText();
        } else if (this.arcController) {
            this.arcController.clearVisuals();
            this.updateInfoText();
        }
    }

    // --- Логика реплея ---
    startReplay() {
        if (!this.movesHistory || this.movesHistory.length === 0) {
            console.log("No moves to replay.");
            return;
        }
        if (this.car) this.car.setVisible(false);
        if (this.carShadow) this.carShadow.setVisible(false);

        if (this.arcController) this.arcController.clearVisuals();

        this.replayCar = this.add.sprite(0, 0, CAR_PLAYER_KEY)
            .setDepth(this.car ? this.car.depth + 1 : 11)
            .setScale(this.car ? this.car.scale : 0.3);

        this.replayCarShadow = this.add.sprite(0, 0, CAR_PLAYER_KEY);
        this.replayCarShadow.setScale(this.replayCar.scale);
        this.replayCarShadow.setOrigin(this.replayCar.originX, this.replayCar.originY);
        this.replayCarShadow.setTint(SHADOW_COLOR);
        this.replayCarShadow.setAlpha(SHADOW_ALPHA);
        this.replayCarShadow.setDepth(this.replayCar.depth + SHADOW_DEPTH_OFFSET);

        if (this.uiCamera) {
            this.uiCamera.ignore(this.replayCar);
            if (this.replayCarShadow) this.uiCamera.ignore(this.replayCarShadow);
        }

        this.cameras.main.startFollow(this.replayCar, true, 0.05, 0.05);
        this.cameras.main.setFollowOffset(0, 0);

        const firstMove = this.movesHistory[0];
        this.replayCar.setPosition(firstMove.startX, firstMove.startY);
        this.replayCar.setAngle(firstMove.fromAngleDeg);

        if (this.replayCarShadow) {
            this.replayCarShadow.setPosition(this.replayCar.x, this.replayCar.y + SHADOW_OFFSET_Y);
            this.replayCarShadow.setAngle(this.replayCar.angle);
            this.replayCarShadow.setVisible(true);
        }

        this.currentReplayIndex = 0;
        console.log("Replay started...");
        this.replayNextMove();
    }

    replayNextMove() {
        if (!this.replayCar || !this.replayCar.active) {
            console.log("Replay stopped: replay car removed.");
            if (this.replayCarShadow) this.replayCarShadow.destroy();
            this.replayCarShadow = null;
            this.cameras.main.stopFollow();
            return;
        }
        if (this.currentReplayIndex >= this.movesHistory.length) {
            console.log("Replay finished.");
            this.replayCar.setVisible(false);
            if (this.replayCarShadow) this.replayCarShadow.setVisible(false);
            this.cameras.main.stopFollow();
            return;
        }

        const step = this.movesHistory[this.currentReplayIndex];
        this.currentReplayIndex++;

        this.replayCar.setPosition(step.startX, step.startY);
        this.replayCar.setAngle(step.fromAngleDeg);
        if (this.replayCarShadow) {
            this.replayCarShadow.setPosition(this.replayCar.x, this.replayCar.y + SHADOW_OFFSET_Y);
            this.replayCarShadow.setAngle(this.replayCar.angle);
            if (!this.replayCarShadow.visible) this.replayCarShadow.setVisible(true);
        }

        const duration = Math.max(step.turnDuration, step.moveTime);

        console.log(`Replaying move ${this.currentReplayIndex}: duration ${duration.toFixed(0)}ms`);

        let primaryTweenCompleted = false;
        let shadowTweenCompleted = !this.replayCarShadow;

        const checkCompletion = () => {
            if (primaryTweenCompleted && shadowTweenCompleted) {
                this.replayNextMove();
            }
        }

        this.tweens.add({
            targets: this.replayCar,
            x: step.targetX,
            y: step.targetY,
            angle: step.finalAngleDeg,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                primaryTweenCompleted = true;
                checkCompletion();
            }
        });

        if (this.replayCarShadow) {
            this.tweens.add({
                targets: this.replayCarShadow,
                x: step.targetX,
                y: step.targetY + SHADOW_OFFSET_Y,
                angle: step.finalAngleDeg,
                duration: duration,
                ease: 'Linear',
                onComplete: () => {
                    shadowTweenCompleted = true;
                    checkCompletion();
                }
            });
        }
    }

    // --- Отладка ---
    setupDebugControls() {
        if (!this.input?.keyboard) {
            console.warn("Keyboard input not available");
            return;
        }

        // Отключаем все отладочные клавиши по умолчанию
        this.input.keyboard.off('keydown-W');
        this.input.keyboard.off('keydown-S');
        this.input.keyboard.off('keydown-A');
        this.input.keyboard.off('keydown-D');
        this.input.keyboard.off('keydown-P');
        this.input.keyboard.off('keydown-R');
        this.input.keyboard.off('keydown-F');

        const checkDebugInput = () => this.car?.active && !this.isMoving && !this.levelComplete && !this.gameOver && this.debugMode;

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
            if (this.carShadow) this.carShadow.angle = this.car.angle;
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-D', () => {
            if (!checkDebugInput()) return;
            this.car.angle += 15;
            if (this.carShadow) this.carShadow.angle = this.car.angle;
            this.calculateAndDrawState();
        });
        this.input.keyboard.on('keydown-P', () => {
            if (checkDebugInput() && this.cube?.active) {
                console.log("Debug: Skipping level...");
                this.handleCollectCube(this.car, this.cube);
            }
        });
        this.input.keyboard.on('keydown-R', () => {
            if (!checkDebugInput()) return;
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

    // Добавляем метод для активации отладочного режима
    activateDebugMode() {
        this.debugMode = true;
        // Включаем отображение физических тел безопасным способом
        if (this.physics && this.physics.world) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        }
        this.setupDebugControls();
        console.log("Debug mode activated! Available commands:");
        console.log("W - Increase speed");
        console.log("S - Decrease speed");
        console.log("A - Rotate left");
        console.log("D - Rotate right");
        console.log("P - Skip level");
        console.log("R - Reset obstacle threshold");
        console.log("F - Add fuel");
    }

    handleCollision(car, obstacle) {
        if (!car || !obstacle || this.levelComplete || this.gameOver) return;
        console.log("Collision with obstacle!");
        
        // Очищаем обработчики событий
        if (this.arcController) this.arcController.clearVisuals();
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;
        
        this.triggerGameOver(`CRASHED! LEVEL ${this.currentLevel}`);
    }
} 