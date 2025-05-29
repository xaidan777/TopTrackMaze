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
        this.soundManager = null;

        this.tiresTrackRT = null;
        this.tireTrackGraphics = null;
        this.wheelPositions = [
            {offsetX: -20, offsetY: -11}, 
            {offsetX: 20, offsetY: -11},  
            {offsetX: -20, offsetY: 11},  
            {offsetX: 20, offsetY: 11}    
        ];
        this.tireTrackRadius = TIRE_TRACK_RADIUS;
        
        this.isMoving = false;
        this.obstaclesGroup = null;
        this.obstacleShadowsGroup = null;
        this.collectibleGroup = null;
        this.fuelPickupGroup = null;
        this.nitroPickupGroup = null;
        this.swampGroup = null;
        this.cube = null;
        this.noise = null;
        this.levelComplete = false;
        this.gameOver = false;
        this.backgroundTile = null;
        this.dronesGroup = null; 
        this.droneShadowsGroup = null; 

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
        this.ui = null;
        
        this.dustParticlesGroup = null; // Группа для активных частиц пыли
        this.replayDustParticlesGroup = null; // Группа для частиц пыли в реплее
        this.dustSpawnCounter = 0; // Счетчик для интервального спавна пыли
        
        // Флаги для контроля коллизий с болотом
        this.isInSwamp = false;
        this.swampEffectAppliedThisTurn = false; // Был ли уже применен эффект болота в текущем ходу
        this.swampTrackAlpha = TIRE_TRACK_ALPHA; // Устанавливаем начальное значение на стандартную прозрачность
        this.isAccelerationBlockedBySwamp = false; // Новый флаг: блокировка ускорения и нитро
        this.isNitroBlockedBySwamp = false; // Для логики движения

        this.draggingFromEmptySpace = false;
        this.pointerDownX = 0;
        this.pointerDownY = 0;

        // Защита от случайного клика виртуального джойстика
        this.pendingJoystickActivation = false;
        this.joystickActivationTimer = null;
        this.pointerDownTime = 0;
    }

    startNewGame() {
        console.log("Starting New Game from Win screen...");
        this.registry.set('currentLevel', 1);
        this.registry.set('obstacleThreshold', INITIAL_OBSTACLE_THRESHOLD);
        this.saveGameProgress(); // Сохраняем прогресс при выходе

        if (this.scene.isActive(this.scene.key)) {
            this.scene.start('MainMenuScene');
        }
    }

    saveGameProgress() {
        const gameProgress = {
            currentLevel: this.currentLevel,
            // Не сохраняем obstacleThreshold, так как он всегда берется из LEVEL_SETTINGS
            fuel: this.fuel,
            nitroAvailable: this.car ? this.car.getData('nitroAvailable') : NITRO_AVAILABLE_BY_DEFAULT
        };
        localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
        console.log('Game progress saved:', gameProgress);
    }

    preload() {
        console.log("Preloading GameScene assets...");
        
        // Инициализация менеджера звуков
        this.soundManager = new SoundManager(this);
        this.soundManager.preload();

        this.load.image(CAR_PLAYER_KEY, 'assets/car_player.png?v=' + GAME_VERSION);
        
        this.load.image(GROUND_TEXTURE_D_KEY, 'assets/ground_texture_d.jpg?v=' + GAME_VERSION);
        this.load.image(GROUND_TEXTURE_G_KEY, 'assets/ground_texture_g.jpg?v=' + GAME_VERSION);
        this.load.image(GROUND_TEXTURE_S_KEY, 'assets/ground_texture_s.jpg?v=' + GAME_VERSION);

        // Загружаем изображения для окна с советами
        this.load.image('button', 'assets/button.png?v=' + GAME_VERSION);
        this.load.image('tip_1', 'assets/tip_1.jpg?v=' + GAME_VERSION);
        this.load.image('fuel_tank', 'assets/fuel_tank.png?v=' + GAME_VERSION);

        this.load.image(BLOCK_D_KEY, 'assets/block_d.png?v=' + GAME_VERSION);
        this.load.image(BLOCK_G_KEY, 'assets/block_g.png?v=' + GAME_VERSION);
        this.load.image(BLOCK_S_KEY, 'assets/block_s.png?v=' + GAME_VERSION);

        // Загрузка текстур для арок управления
        this.load.image(ARC_SLOW_KEY, 'assets/arс_slow.png?v=' + GAME_VERSION);
        this.load.image(ARC_GO_KEY, 'assets/arс_go.png?v=' + GAME_VERSION);

        this.load.image(RESTART_BUTTON_KEY, 'assets/restart.png?v=' + GAME_VERSION);
        this.load.image('menu_b', 'assets/menu_b.png?v=' + GAME_VERSION);
        
        this.load.image(FUEL_PICKUP_KEY, 'assets/fuel.png?v=' + GAME_VERSION);
        this.load.image(NITRO_PICKUP_KEY, 'assets/nitro.png?v=' + GAME_VERSION);
        this.load.image(PORTAL_KEY, 'assets/portal.png?v=' + GAME_VERSION);
        this.load.image('arrow', 'assets/arrow.png?v=' + GAME_VERSION);
        this.load.image(DRONE_KEY, 'assets/drone.png?v=' + GAME_VERSION); 

        // Загрузка изображения болота и клея
        this.load.image(SWAMP_KEY, 'assets/swamp.png');
        this.load.image('glue', 'assets/glue.png?v=' + GAME_VERSION);
        this.load.image('strike', 'assets/strike.png?v=' + GAME_VERSION);
        
        // Программно создаем текстуру для частицы пыли (белый круг)
        // Это позволит нам легко менять ее цвет через tint
        let dustParticleGraphics = this.make.graphics({x: 0, y: 0, add: false});
        dustParticleGraphics.fillStyle(0xffffff, 1);
        // Рисуем круг с диаметром 10px. Его радиус будет 5px.
        // Мы будем масштабировать его от DUST_PARTICLE_START_RADIUS до DUST_PARTICLE_END_RADIUS.
        dustParticleGraphics.fillCircle(5, 5, 5);
        dustParticleGraphics.generateTexture(DUST_PARTICLE_TEXTURE_KEY, 10, 10);
        dustParticleGraphics.destroy();
        
        
        if (this.registry.get('isRestarting')) {
            console.log("GameScene restarting...");
            this.registry.set('isRestarting', false);
            
            const savedLevel = this.registry.get('currentLevel');
            if (savedLevel !== undefined) {
                this.currentLevel = savedLevel;
            } else {
                console.warn('No saved level found, defaulting to 1');
                this.currentLevel = 1;
            }
            
            const savedThreshold = this.registry.get('obstacleThreshold');
            if (savedThreshold !== undefined) {
                this.currentObstacleThreshold = savedThreshold;
            } else {
                console.warn('No saved obstacle threshold found, using default');
                this.currentObstacleThreshold = INITIAL_OBSTACLE_THRESHOLD;
            }
            
            const savedFuel = this.registry.get('fuelForNextLevel');
            if (savedFuel !== undefined) {
                this.fuel = savedFuel;
            } else {
                console.warn('No saved fuel found, using default');
                this.fuel = INITIAL_FUEL;
            }
        }
    }

    create() {
        console.log("Phaser version:", Phaser.VERSION);

        let shouldShowTipsOnNewLevel = true; // Flag to control tips window display

        // Инициализация звуков
        this.soundManager.create();

        // Отладочный вывод для проверки значений констант цвета вспышек
        console.log("Debug - Flash colors (hex):", {
            FLASH_COLOR: '0x' + FLASH_COLOR.toString(16), 
            WIN_FLASH_COLOR: '0x' + WIN_FLASH_COLOR.toString(16),
            FUEL_FLASH_COLOR: '0x' + FUEL_FLASH_COLOR.toString(16)
        });

        // Загружаем сохраненный прогресс
        this.loadGameProgress();



        if (this.dronesGroup) {
            this.dronesGroup.destroy(true); 
            this.dronesGroup = null;
        }
        if (this.droneShadowsGroup) { 
            this.droneShadowsGroup.destroy(true);
            this.droneShadowsGroup = null;
        }
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
        
        // Всегда используем значение из LEVEL_SETTINGS
        const levelSettings = getLevelSettings(this.currentLevel);
        this.currentObstacleThreshold = levelSettings.threshold;
        
        if (this.registry.get('isLevelRestart')) {
            this.registry.remove('isLevelRestart');
            shouldShowTipsOnNewLevel = false; // Don't show tips if restarting the level
            const initialLevelFuel = this.registry.get('initialLevelFuel');
            if (initialLevelFuel !== undefined) {
                this.fuel = Math.max(initialLevelFuel, INITIAL_FUEL);
                console.log(`Restarting level with initial fuel: ${this.fuel}`);
            } else {
                this.fuel = INITIAL_FUEL;
                console.log(`Restarting level with default fuel: ${this.fuel}`);
            }
        }
        else if (this.registry.get('fuelForNextLevel') !== undefined) {
            this.fuel = Math.max(this.registry.get('fuelForNextLevel'), INITIAL_FUEL);
            this.registry.remove('fuelForNextLevel'); 
            
            this.registry.set('initialLevelFuel', this.fuel);
            console.log(`Using saved fuel from previous level: ${this.fuel}`);
        } else {
            this.fuel = INITIAL_FUEL;
            this.registry.set('initialLevelFuel', this.fuel);
            console.log(`Using initial fuel: ${this.fuel}`);
        }
        
        this.levelComplete = false;
        this.gameOver = false;
        this.isMoving = false;
        this.arcController = null;

        this.draggingFromEmptySpace = false;
        this.pointerDownX = 0;
        this.pointerDownY = 0;

        // Защита от случайного клика виртуального джойстика
        this.pendingJoystickActivation = false;
        this.joystickActivationTimer = null;
        this.pointerDownTime = 0;

        console.log(`Creating scene for Level ${this.currentLevel}... Obstacle Threshold: ${this.currentObstacleThreshold.toFixed(2)}`);

        // --- Определяем биом для текущего уровня ---
        this.currentBiome = getBiomeForLevel(this.currentLevel);
        console.log("Current Biome:", this.currentBiome);

        // --- Инициализация Simplex Noise ---
        if (typeof SimplexNoise === 'undefined') {
            console.error("SimplexNoise library not found!");
            return;
        }
        this.noise = new SimplexNoise();

        // --- Настройка мира и камеры ---
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // --- Определяем цвет тени для текущего биома ---
        let shadowColor;
        if (this.currentBiome === BIOME_DESERT) {
            shadowColor = BIOME_DESERT_COLOR;
        } else if (this.currentBiome === BIOME_SNOW) {
            shadowColor = BIOME_SNOW_COLOR;
        } else if (this.currentBiome === BIOME_GRASS) {
            shadowColor = BIOME_GRASS_COLOR;
        } else {
            shadowColor = SHADOW_COLOR;
        }
        console.log(`Using shadow color for biome: 0x${shadowColor.toString(16)}`);

        // --- Фон ---
        this.backgroundTile = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, this.currentBiome.ground)
            .setOrigin(0, 0)
            .setDepth(-20);
            
        // --- Создаем RenderTexture для следов колес ---
        this.tiresTrackRT = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT)
            .setOrigin(0, 0)
            .setDepth(-15)
            .setBlendMode(Phaser.BlendModes.NORMAL); 
            
        this.tireTrackGraphics = this.add.graphics()
            .setBlendMode(Phaser.BlendModes.NORMAL);

        // --- Группы объектов ---
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.obstacleShadowsGroup = this.add.group();
        this.collectibleGroup = this.physics.add.group();
        this.fuelPickupGroup = this.physics.add.group();
        this.nitroPickupGroup = this.physics.add.group();
        this.swampGroup = this.physics.add.staticGroup();

        // --- Группа для частиц пыли ---
        this.dustParticlesGroup = this.add.group();
        this.replayDustParticlesGroup = this.add.group();

        // --- Генерация уровня ---
        this.createLevel(shadowColor);

        // --- Создание машины ---
        this.car = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, CAR_PLAYER_KEY);
        this.car.setScale(1).setOrigin(0.5, 0.5).setDataEnabled();
        
        const savedNitroStatus = this.registry.get('nitroForNextLevel');
        if (this.registry.get('isLevelRestart')) {
            const initialNitroStatus = this.registry.get('initialLevelNitroStatus');
            this.car.setData({
                speed: MIN_SPEED,
                nextSpeed: undefined,
                redCooldown: 0,
                nextRedCooldown: undefined,
                accelDisabled: false,
                nextAccelDisabled: undefined,
                nitroAvailable: initialNitroStatus !== undefined ? initialNitroStatus : NITRO_AVAILABLE_BY_DEFAULT,
                isNitroActiveThisTurn: false // ADDED: Initialize nitro state flag
            });
            console.log(`Restarting level with initial nitro status: ${this.car.getData('nitroAvailable')}`);
        } else if (savedNitroStatus !== undefined) {
            this.car.setData({
                speed: MIN_SPEED,
                nextSpeed: undefined,
                redCooldown: 0,
                nextRedCooldown: undefined,
                accelDisabled: false,
                nextAccelDisabled: undefined,
                nitroAvailable: savedNitroStatus
            });
            
            this.registry.set('initialLevelNitroStatus', savedNitroStatus);
            this.registry.remove('nitroForNextLevel'); 
            console.log(`Using saved nitro status from previous level: ${savedNitroStatus}`);
        } else {
            this.car.setData({
                speed: MIN_SPEED,
                nextSpeed: undefined,
                redCooldown: 0,
                nextRedCooldown: undefined,
                accelDisabled: false,
                nextAccelDisabled: undefined,
                nitroAvailable: NITRO_AVAILABLE_BY_DEFAULT,
                isNitroActiveThisTurn: false // ADDED: Initialize nitro state flag
            });
            
            this.registry.set('initialLevelNitroStatus', NITRO_AVAILABLE_BY_DEFAULT);
            console.log(`Using default nitro status: ${NITRO_AVAILABLE_BY_DEFAULT}`);
        }
        
        this.car.angle = -90;
        this.car.body.setCircle(carRadius);
        this.car.body.setOffset(21, 6);
        this.car.setCollideWorldBounds(true).setDepth(10);

        // --- Создание тени для машины ---
        this.carShadow = this.add.sprite(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y, CAR_PLAYER_KEY);
        this.carShadow.setScale(this.car.scale);
        this.carShadow.setOrigin(this.car.originX, this.car.originY);
        this.carShadow.setAngle(this.car.angle);
        this.carShadow.setTint(shadowColor); 
        this.carShadow.setAlpha(SHADOW_ALPHA);
        this.carShadow.setDepth(this.car.depth + SHADOW_DEPTH_OFFSET);

        // --- Спавн топлива ---
        const allPickups = []; // Массив для хранения всех заспавненных пикапов
        for (let i = 0; i < FUEL_COUNT_PER_LEVEL; i++) {
            if (this.levelGenerator) {
                const fuelPickup = this.levelGenerator.spawnFuelPickup(
                    this.occupiedCellsForSpawning, 
                    this.gridWidthForSpawning, 
                    this.gridHeightForSpawning,
                    this.fuelPickupGroup,
                    allPickups // Передаем уже созданные пикапы
                );
                if (fuelPickup) {
                    allPickups.push(fuelPickup);
                }
            }
        }

        // --- Спавн нитро ---
        for (let i = 0; i < NITRO_COUNT_PER_LEVEL; i++) {
            if (this.levelGenerator) {
                const nitroPickup = this.levelGenerator.spawnNitroPickup(
                    this.occupiedCellsForSpawning, 
                    this.gridWidthForSpawning, 
                    this.gridHeightForSpawning,
                    this.nitroPickupGroup,
                    allPickups // Передаем все уже созданные пикапы (включая топливо)
                );
                if (nitroPickup) {
                    allPickups.push(nitroPickup);
                }
            }
        }

        // --- Спавн Дронов ---
        this.dronesGroup = this.add.group();
        this.droneShadowsGroup = this.add.group(); 
        let dronesSpawned = 0;
        let droneSpawnAttempts = 0;
        
        const droneSettings = getLevelSettings(this.currentLevel);
        const maxDronesForLevel = droneSettings.drones || 0;
        const maxDroneSpawnAttempts = maxDronesForLevel * 20;
        const attemptPerDrone = 20; // Попыток для одного дрона

        while (dronesSpawned < maxDronesForLevel && droneSpawnAttempts < maxDroneSpawnAttempts) {
            droneSpawnAttempts++;
            
            // Проверяем, много ли попыток на один дрон уже сделано
            const isEmergencySpawn = (droneSpawnAttempts % attemptPerDrone === 0);
            
            let randomGridX, randomGridY;
            
            if (isEmergencySpawn && this.cube && this.cube.active) {
                // Принудительный спавн в зеркальных координатах от портала
                const portalGridX = Math.floor(this.cube.x / GRID_CELL_SIZE);
                const portalGridY = Math.floor(this.cube.y / GRID_CELL_SIZE);
                
                const centerGridX = Math.floor(this.gridWidthForSpawning / 2);
                const centerGridY = Math.floor(this.gridHeightForSpawning / 2);
                
                // Зеркальные координаты (противоположная сторона от центра)
                randomGridX = Math.min(Math.max(1, 2 * centerGridX - portalGridX), this.gridWidthForSpawning - 2);
                randomGridY = Math.min(Math.max(1, 2 * centerGridY - portalGridY), this.gridHeightForSpawning - 2);
                
                console.log(`Emergency drone spawn - portal at (${portalGridX}, ${portalGridY}), mirror at (${randomGridX}, ${randomGridY})`);
            } else {
                // Обычный случайный спавн
                randomGridX = Phaser.Math.Between(1, this.gridWidthForSpawning - 2); 
                randomGridY = Phaser.Math.Between(1, this.gridHeightForSpawning - 2);
            }

            if (
                randomGridY >= 0 && randomGridY < this.gridHeightForSpawning &&
                randomGridX >= 0 && randomGridX < this.gridWidthForSpawning
            ) {
                const startGridX = Math.floor((GAME_WIDTH / 2) / GRID_CELL_SIZE);
                const startGridY = Math.floor((GAME_HEIGHT / 2) / GRID_CELL_SIZE);
                const distFromStart = Phaser.Math.Distance.Between(randomGridX, randomGridY, startGridX, startGridY);
                
                const spawnAttemptsRatio = droneSpawnAttempts / maxDroneSpawnAttempts;
                const minSpawnDistFromStart = Math.max(3, 5 - Math.floor(spawnAttemptsRatio * 2));
                const maxSpawnDistFromStart = 10 + Math.floor(spawnAttemptsRatio * 5);
                const minSpawnDistFromPortal = Math.max(5, 10 - Math.floor(spawnAttemptsRatio * 5));

                let portalCheckPassed = true;
                if (this.cube && this.cube.active) {
                    const portalGridX = Math.floor(this.cube.x / GRID_CELL_SIZE);
                    const portalGridY = Math.floor(this.cube.y / GRID_CELL_SIZE);
                    const distFromPortal = Phaser.Math.Distance.Between(randomGridX, randomGridY, portalGridX, portalGridY);
                    portalCheckPassed = distFromPortal > minSpawnDistFromPortal;
                }

                // При принудительном спавне игнорируем проверки расстояния
                if (isEmergencySpawn || (distFromStart > minSpawnDistFromStart && distFromStart <= maxSpawnDistFromStart && portalCheckPassed)) {
                    const dx = randomGridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const dy = randomGridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const newDrone = new Drone(this, dx, dy); 
                    this.dronesGroup.add(newDrone);

                    const droneShadow = this.add.sprite(dx + 2, dy + 6 + SHADOW_OFFSET_Y, DRONE_KEY);
                    droneShadow.setScale(newDrone.scale);
                    droneShadow.setOrigin(newDrone.originX, newDrone.originY);
                    droneShadow.setTint(shadowColor);
                    droneShadow.setAlpha(SHADOW_ALPHA);
                    droneShadow.setDepth(newDrone.depth + SHADOW_DEPTH_OFFSET);
                    this.droneShadowsGroup.add(droneShadow);
                    newDrone.shadow = droneShadow; 

                    dronesSpawned++;
                    if (isEmergencySpawn) {
                        console.log(`Emergency drone spawned at grid (${randomGridX}, ${randomGridY})`);
                    } else {
                        console.log(`Drone spawned at grid (${randomGridX}, ${randomGridY}), DistStart: ${distFromStart.toFixed(1)}, PortalCheck: ${portalCheckPassed}`);
                    }
                }
            }
        }
        if (dronesSpawned < maxDronesForLevel && maxDronesForLevel > 0) {
            console.warn(`Could only spawn ${dronesSpawned}/${maxDronesForLevel} drones after ${droneSpawnAttempts} attempts.`);
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

        // --- Создание UI ---
        this.ui = new UI(this);
        this.ui.create();

        // Показываем окно с советами после инициализации UI
        if (this.ui && shouldShowTipsOnNewLevel && this.ui.showTipsWindow) { // Show tips only on new level load, not on restart
            this.ui.showTipsWindow();
        }

        // --- Настройка физики и столкновений ---
        this.physics.add.overlap(this.car, this.obstaclesGroup, this.handleCollision, null, this);
        this.physics.add.overlap(this.car, this.collectibleGroup, this.handleCollectCube, null, this);
        this.physics.add.overlap(this.car, this.fuelPickupGroup, this.handleCollectFuelPickup, null, this);
        this.physics.add.overlap(this.car, this.nitroPickupGroup, this.handleCollectNitroPickup, null, this);
        this.physics.add.overlap(this.car, this.swampGroup, this.handleSwamp, null, this);

        // --- Настройка обработчиков событий мыши ---
        // 1) Pointer Down
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button !== 0) return;

            if (this.ui && this.ui.isTipsWindowVisible && this.ui.isTipsWindowVisible()) {
                console.log("Tips window is visible, ignoring game click.");
                return;
            }
            
            const hitUI = [
                this.ui.nextLevelButton,
                this.ui.restartButtonObject,
                this.ui.playAgainButton
            ].some(button => {
                if (!button || !button.visible) return false;
                const bounds = button.getBounds();
                return bounds.contains(pointer.x, pointer.y);
            });
            
            if (hitUI) {
                console.log("UI button clicked, ignoring pointerdown");
                this.isUIInteraction = true;
                return;
            }
            
            this.isUIInteraction = false;
            
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                console.log("Level start block active, ignoring pointerdown");
                return;
            }
            
            if (this.isMoving || this.levelComplete || this.gameOver || !this.car || !this.arcController || this.ignoreNextPointerUp) {
                return;
            }

            const pointerX = pointer.worldX;
            const pointerY = pointer.worldY;

            const directArcZone = this.arcController.getArcZoneForPoint(pointerX, pointerY);
            const isClickNearArc = this.arcController.isPointNearArc(pointerX, pointerY, VIRTUAL_JOYSTICK_BLOCK_RADIUS);
            // ADDED: Check distance from car
            let isClickNearCar = false;
            if (this.car && typeof this.car.x === 'number' && typeof this.car.y === 'number') { // Ensure car exists and has coords
                 const distanceToCar = Phaser.Math.Distance.Between(pointerX, pointerY, this.car.x, this.car.y);
                 isClickNearCar = distanceToCar < VIRTUAL_JOYSTICK_BLOCK_RADIUS;
            }

            if (directArcZone === null && !isClickNearArc && !isClickNearCar) { // MODIFIED condition
                console.log("PointerDown: Потенциальная активация виртуального джойстика (клик далеко от арки и машины).");
                
                // Сохраняем данные для потенциальной активации
                this.pendingJoystickActivation = true;
                this.pointerDownTime = this.time.now;
                this.pointerDownX = pointerX;
                this.pointerDownY = pointerY;
                
                // Очищаем предыдущий таймер, если он был
                if (this.joystickActivationTimer) {
                    this.joystickActivationTimer.destroy();
                    this.joystickActivationTimer = null;
                }
                
                // Запускаем таймер активации
                this.joystickActivationTimer = this.time.delayedCall(VIRTUAL_JOYSTICK_ACTIVATION_DELAY, () => {
                    // Проверяем, что палец все еще нажат и мы находимся в режиме ожидания активации
                    if (this.pendingJoystickActivation && pointer.isDown) {
                        console.log("PointerDown: Активация виртуального джойстика после задержки.");
                        this.draggingFromEmptySpace = true;
                        this.pendingJoystickActivation = false;
                        
                        const ap = this.arcController?.arcParams;
                        if (ap) {
                            const neutralX = this.car.x + Math.cos(ap.orientationRad) * ap.neutralRadius;
                            const neutralY = this.car.y + Math.sin(ap.orientationRad) * ap.neutralRadius;

                            this.arcController.handlePointerMove({
                                worldX: neutralX, 
                                worldY: neutralY, 
                                isDown: true      
                            });
                        } else {
                            this.arcController.handlePointerMove({ worldX: pointerX, worldY: pointerY, isDown: true });
                        }
                    }
                }, [], this);

            } else {
                // UPDATED: Console log message for clarity
                let reason = "on or near the arc/car"; // Default or fallback reason
                if (directArcZone !== null) {
                    reason = "on a direct arc zone";
                } else if (isClickNearArc) { // Implies directArcZone is null
                    reason = "near the control arc";
                } else if (isClickNearCar) { // Implies directArcZone is null and isClickNearArc is false
                    reason = "near the car";
                }
                console.log(`PointerDown: Click was ${reason}. Virtual joystick blocked.`); // MODIFIED log
                
                // Очищаем любые ожидающие активации джойстика
                this.pendingJoystickActivation = false;
                if (this.joystickActivationTimer) {
                    this.joystickActivationTimer.destroy();
                    this.joystickActivationTimer = null;
                }
                
                this.draggingFromEmptySpace = false;
                this.arcController.handlePointerMove(pointer);
            }
        });

        // 2) Pointer Move
        this.input.on('pointermove', (pointer) => {
            if (this.levelComplete || this.gameOver || !this.arcController || this.isUIInteraction) return;
            
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                return;
            }

            if (this.isMoving) {
                this.arcController.clearVisuals();
                this.updateArcBorders(false);
                return;
            }

            if (this.draggingFromEmptySpace && pointer.isDown) {
                const ap = this.arcController.arcParams;
                if (!ap) return;

                const arcCenterX = this.car.x + Math.cos(ap.orientationRad) * ap.neutralRadius;
                const arcCenterY = this.car.y + Math.sin(ap.orientationRad) * ap.neutralRadius;

                // Рассчитываем текущее смещение
                const deltaX = pointer.worldX - this.pointerDownX;
                const deltaY = pointer.worldY - this.pointerDownY;
                
                // Рассчитываем длину смещения
                const currentOffset = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Определяем максимально допустимое смещение
                const maxOffset = Math.max(ap.outerRadius, GRID_CELL_SIZE * 3);
                
                // Если вышли за пределы
                if (currentOffset > maxOffset) {
                    // Нормализуем вектор смещения
                    const normalizedDeltaX = deltaX / currentOffset;
                    const normalizedDeltaY = deltaY / currentOffset;
                    
                    // Обновляем точку отсчета, сохраняя направление, но ограничивая длину
                    this.pointerDownX = pointer.worldX - normalizedDeltaX * maxOffset;
                    this.pointerDownY = pointer.worldY - normalizedDeltaY * maxOffset;
                }

                // Пересчитываем финальное смещение с учетом обновленной точки отсчета
                const finalDeltaX = pointer.worldX - this.pointerDownX;
                const finalDeltaY = pointer.worldY - this.pointerDownY;

                const virtualX = arcCenterX + finalDeltaX;
                const virtualY = arcCenterY + finalDeltaY;

                this.arcController.handlePointerMove({
                    worldX: virtualX,
                    worldY: virtualY,
                    isDown: pointer.isDown
                });

            } else if (this.pendingJoystickActivation && pointer.isDown) {
                // Джойстик еще не активирован, но палец нажат - не делаем ничего
                // Ждем завершения задержки активации
                return;
            } else {
                this.arcController.handlePointerMove(pointer);
            }
            
            this.updateArcBorders(true);
        });

        // 3) Pointer Up
        this.input.on('pointerup', (pointer) => {
            if (pointer.button !== 0) return;

            if (this.ui && this.ui.isTipsWindowVisible && this.ui.isTipsWindowVisible()) {
                console.log("Tips window is visible, ignoring game click.");
                return;
            }

            if (this.isMoving || this.levelComplete || this.gameOver || !this.car || !this.arcController || this.isUIInteraction) {
                return;
            }
            
            if (this.time.now - this.levelStartBlockTime < this.levelStartBlockDuration) {
                return;
            }

            if (this.fuel <= 0) {
                this.handleOutOfFuel();
                return;
            }

            // Проверяем, был ли джойстик в режиме ожидания активации
            if (this.pendingJoystickActivation) {
                console.log("PointerUp: Отмена активации виртуального джойстика (палец отпущен до истечения задержки).");
                this.pendingJoystickActivation = false;
                
                // Очищаем таймер активации
                if (this.joystickActivationTimer) {
                    this.joystickActivationTimer.destroy();
                    this.joystickActivationTimer = null;
                }
                
                // Обрабатываем как обычный клик в пустом пространстве
                return;
            }

            if (this.draggingFromEmptySpace) {
                this.draggingFromEmptySpace = false;

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
                // console.log("[PointerUp-Drag] ArcController result.moveData:", result ? result.moveData : 'No result'); // DEBUG LOG REMOVED

                if (result && result.moveData) {
                    const moveDuration = result.moveData.moveTime || TURN_DURATION;
                    console.log(`[PointerUp-Drag] Calling startEnemyTurn with duration: ${moveDuration}`);
                    this.startEnemyTurn(moveDuration);

                    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
                    this.updateFuelDisplay();
                    this.updateInfoText();

                    this.isMoving = true;
                    this.updateArcBorders(false);

                    this.movesHistory.push(result.moveData);
                    if (result.moveData.isNitroUsed) {
                        this.car.setData('isNitroActiveThisTurn', true);
                    } else {
                        this.car.setData('isNitroActiveThisTurn', false);
                    }
                    console.log("GameScene: Move initiated via controller (drag from empty).");
                } else {
                    console.log("GameScene: No move from empty-space drag.");
                }

            } else {
                const result = this.arcController.handleSceneClick(pointer);
                // console.log("[PointerUp] ArcController result.moveData:", result ? result.moveData : 'No result'); // DEBUG LOG REMOVED
                
                if (result && result.moveData) {
                    const moveDuration = result.moveData.moveTime || TURN_DURATION;
                    console.log(`[PointerUp] Calling startEnemyTurn with duration: ${moveDuration}`);
                    this.startEnemyTurn(moveDuration);

                    this.fuel -= FUEL_CONSUMPTION_PER_MOVE;
                    this.updateFuelDisplay();
                    this.updateInfoText();

                    this.isMoving = true;
                    this.updateArcBorders(false);

                    this.movesHistory.push(result.moveData);
                    if (result.moveData.isNitroUsed) {
                        this.car.setData('isNitroActiveThisTurn', true);
                    } else {
                        this.car.setData('isNitroActiveThisTurn', false);
                    }
                    console.log("GameScene: Move initiated via controller.");
                } else {
                    console.log("GameScene: Click did not initiate a move via controller.");
                }
            }
        });

        // --- Камеры ---
        this.cameras.main.startFollow(this.car, true, 0.05, 0.05);
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const initialZoom = isMobile ? CAMERA_BASE_ZOOM_MOBILE : CAMERA_BASE_ZOOM;
        this.cameras.main.setZoom(initialZoom);
        
        this.cameras.main.setDeadzone(50, 50);

        // --- Отладочные контролы ---
        this.setupDebugControls();
        this.input.keyboard.enabled = true;

        // --- Первая отрисовка состояния контроллера ---
        this.calculateAndDrawState();

        // Добавляем обработчик изменения размера
        this.scale.on('resize', this.handleResize, this);
        this.handleResize();
        // Дополнительный вызов handleResize с задержкой в 1 кадр для надежности
        this.time.delayedCall(1, this.handleResize, [], this);

        console.log("Game Scene create() finished.");
    }

    handleResize() {
        if (this.ui) {
            this.ui.handleResize();
        }
    }

    updateFuelDisplay() {
        if (this.ui) {
            this.ui.updateFuelDisplay();
        }
    }

    updateInfoText() {
        if (this.ui) {
            this.ui.updateInfoText();
        }
    }

    updateArcBorders(visible) {
        if (this.ui) {
            this.ui.updateArcBorders(visible);
        }
    }

    // --- Генерация уровня ---
    createLevel(shadowColor) { // Принимаем цвет тени
        this.levelGenerator = new LevelGenerator(this);

        
        const obstacleKey = this.currentBiome.obstacle;

        const result = this.levelGenerator.createLevel({
            obstaclesGroup: this.obstaclesGroup,
            obstacleShadowsGroup: this.obstacleShadowsGroup,
            collectibleGroup: this.collectibleGroup,
            swampGroup: this.swampGroup,
            currentObstacleThreshold: this.currentObstacleThreshold,
            obstacleAssetKey: obstacleKey, 
            shadowColor: shadowColor,
            isBiomeGrass: this.currentBiome === BIOME_GRASS,
            currentLevel: this.currentLevel // Передаем текущий уровень
        });

        if (this.swampGroup && this.swampGroup.getChildren().length > 0) {
            this.swampGroup.getChildren().forEach(swamp => {
                swamp.setDepth(-18); // Между фоном (-20) и текстурой следов (-15)
            });
        }

        if (result) {
            this.occupiedCellsForSpawning = result.occupiedCells;
            this.gridWidthForSpawning = result.gridWidth;
            this.gridHeightForSpawning = result.gridHeight;
            this.cube = result.portal; 
        }
    }

    // --- Обработка событий игры ---
    handleCollectCube(car, cube) {
        if (!cube || !cube.active || this.levelComplete || this.gameOver) return;
        console.log(`Cube collected! Level ${this.currentLevel} Complete!`);
        this.levelComplete = true;
        
        // Воспроизведение звука победы
        this.soundManager.playWin();
        
        // Останавливаем анимацию куба, но НЕ уничтожаем его
        this.tweens.killTweensOf(cube);
        
        // Сохраняем ссылку на куб для реплея
        this.portalForReplay = cube;
        
        // Делаем куб невидимым, но не уничтожаем
        cube.setVisible(false);
        
        // Обнуляем ссылку на куб для логики игры
        this.cube = null;
        
        if (this.isMoving && this.car?.body) {
            this.tweens.killTweensOf(this.car);
            this.car.body.stop();
            if (this.physics.world) this.physics.world.destination = null;
            this.isMoving = false;
        }
        if (this.car?.body) this.car.body.enable = false;

        if (this.arcController) this.arcController.clearVisuals();
        this.updateArcBorders(false);

        // Очищаем состояние виртуального джойстика
        this.pendingJoystickActivation = false;
        this.draggingFromEmptySpace = false;
        if (this.joystickActivationTimer) {
            this.joystickActivationTimer.destroy();
            this.joystickActivationTimer = null;
        }

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;

        // Показываем экран завершения уровня через UI
        if (this.ui) {
            this.ui.showLevelComplete();
        }

        this.startReplay();
        if (this.cameras.main) this.cameras.main.flash(400, WIN_FLASH_COLOR);
        this.updateInfoText();
    }

    handleCollectFuelPickup(car, pickup) {
        if (!pickup || !pickup.active || this.levelComplete || this.gameOver) return;
        console.log("Collected fuel pickup!");
        
        // Воспроизведение звука подбора топлива
        this.soundManager.playFuel();

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
        this.fuel = Math.min(this.fuel + FUEL_GAIN_ON_PICKUP, MAX_FUEL);
        console.log(`Fuel increased to: ${this.fuel}`);
        this.updateFuelDisplay();
        this.updateInfoText();

        // Показываем эффект через UI
        if (this.ui) {
            this.ui.showFuelPickupEffect(FUEL_GAIN_ON_PICKUP, { x: this.car.x, y: this.car.y });
        }
    }

    handleCollectNitroPickup(car, pickup) {
        if (!pickup || !pickup.active || this.levelComplete || this.gameOver) return;
        console.log("Collected nitro pickup!");
        
        // Воспроизведение звука подбора нитро
        this.soundManager.playNitro();

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
        
        this.car.setData('nitroAvailable', true);
        this.car.setData('nextNitroAvailable', true);
        
        if (this.registry.get('initialLevelNitroStatus') === false) {
            this.registry.set('initialLevelNitroStatus', true);
            console.log("Updated initial level nitro status to true after pickup");
        }
        
        this.fuel = Math.min(this.fuel + 2, MAX_FUEL);
        console.log(`Nitro pickup gave +2 fuel. Current fuel: ${this.fuel}`);
        this.updateFuelDisplay();
        
        console.log("Nitro is now available! Status:", 
                    this.car.getData('nitroAvailable'),
                    "Next status:", this.car.getData('nextNitroAvailable'));
        
        // Показываем эффект через UI
        if (this.ui) {
            this.ui.showNitroPickupEffect({ x: this.car.x, y: this.car.y });
        }
        
        this.updateInfoText();
        
        if (this.arcController) {
            this.arcController.drawState();
        }
    }

    triggerGameOver(message) {
        if (this.gameOver || this.levelComplete) return;
        this.gameOver = true;
        this.isMoving = false;

        console.log("GAME OVER:", message);
        
        // Останавливаем звук двигателя при проигрыше
        this.soundManager.stopEngine();
        
        if (this.car) {
            this.tweens.killAll();
            if (this.car.body) {
                this.car.body.stop();
                this.car.body.enable = false;
            }
        }
        if (this.physics.world) this.physics.world.destination = null;

        if (this.arcController) this.arcController.clearVisuals();

        // Очищаем состояние виртуального джойстика
        this.pendingJoystickActivation = false;
        this.draggingFromEmptySpace = false;
        if (this.joystickActivationTimer) {
            this.joystickActivationTimer.destroy();
            this.joystickActivationTimer = null;
        }

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.keyboard.enabled = false;

        // Показываем экран проигрыша через UI
        if (this.ui) {
            this.ui.showGameOver(message);
        }

        this.registry.set('isLevelRestart', true);

        this.time.delayedCall(RESTART_DELAY, () => {
            if (this.scene.isActive(this.scene.key)) this.scene.restart();
        });
    }

    handleOutOfFuel() {
        if (this.gameOver || this.levelComplete) return;
        console.log("Fuel depleted!");
        // Останавливаем звук двигателя немедленно
        this.soundManager.stopEngine(true);
        this.soundManager.stopReplayEngine(true);
        // Воспроизводим звук окончания топлива
        this.soundManager.playOut();
        this.triggerGameOver(`OUT OF FUEL!`);
    }

    startNextLevel() {
        if (!this.levelComplete || this.currentLevel >= TOTAL_LEVELS) return;
        if (this.ui) this.ui.nextLevelButton.disableInteractive();

        console.log("Starting next level...");
        
        // Останавливаем все звуки
        this.soundManager.stopEngine(true);
        this.soundManager.stopReplayEngine(true);
        this.soundManager.sounds.crash.stop();
        this.soundManager.sounds.fuel.stop();
        this.soundManager.sounds.nitro.stop();
        this.soundManager.sounds.win.stop();
        
        const nextLevel = this.currentLevel + 1;
        
        const nextLevelSettings = getLevelSettings(nextLevel);
        // Не сохраняем obstacleThreshold в реестре, так как он всегда берется из LEVEL_SETTINGS

        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
        this.input.keyboard.enabled = false;
        
        // Очищаем состояние виртуального джойстика
        this.pendingJoystickActivation = false;
        this.draggingFromEmptySpace = false;
        if (this.joystickActivationTimer) {
            this.joystickActivationTimer.destroy();
            this.joystickActivationTimer = null;
        }
        
        if (this.arcController) {
            this.arcController.clearVisuals();
            this.arcController = null;
        }
        
        if (this.tiresTrackRT) {
            this.tiresTrackRT.clear();
        }
        
        if (this.car) {
            const nitroStatus = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
            this.registry.set('nitroForNextLevel', nitroStatus);
            console.log(`Saving nitro status for next level: ${nitroStatus}`);
        }
        
        if (this.ui) this.ui.nextLevelButton.removeInteractive();
        if (this.ui) this.ui.restartButtonObject.removeInteractive();
        if (this.ui) this.ui.playAgainButton.removeInteractive();

        const currentFuel = this.fuel;
        console.log(`Current fuel: ${currentFuel}, INITIAL_FUEL: ${INITIAL_FUEL}`);
        const fuelToKeep = currentFuel > INITIAL_FUEL ? currentFuel : INITIAL_FUEL;
        this.registry.set('fuelForNextLevel', fuelToKeep);

        // Обновляем текущий уровень и сохраняем прогресс
        this.currentLevel = nextLevel;
        this.registry.set('currentLevel', nextLevel);
        // Не сохраняем obstacleThreshold в реестре
        this.registry.set('isRestarting', true);
        
        // Сохраняем прогресс перед переходом на следующий уровень
        this.saveGameProgress();

        this.isUIInteraction = false;
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
            
            // Скрываем дронов только при levelComplete, но не при gameOver
            if (this.levelComplete) {
                if (this.dronesGroup) this.dronesGroup.setVisible(false);
                if (this.droneShadowsGroup) this.droneShadowsGroup.setVisible(false);
            }
            
            // Добавляем скрытие границ арки
            if (this.ui) this.ui.leftBorderSprite.setVisible(false);
            if (this.ui) this.ui.rightBorderSprite.setVisible(false);
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

        // --- ОБНОВЛЕНИЕ ТЕНЕЙ ДРОНОВ ---
        if (this.dronesGroup && this.droneShadowsGroup) {
            this.dronesGroup.getChildren().forEach(drone => {
                if (drone.active && drone.shadow && drone.shadow.active) {
                    drone.shadow.x = drone.x + 5;
                    drone.shadow.y = drone.y + SHADOW_OFFSET_Y + 15;
                    drone.shadow.setAngle(drone.angle); 
                    if (drone.visible !== drone.shadow.visible) {
                        drone.shadow.setVisible(drone.visible);
                    }
                } else if (drone.shadow && drone.visible) {
                    drone.shadow.setActive(true).setVisible(true);
                    drone.shadow.x = drone.x + 2;
                    drone.shadow.y = drone.y + SHADOW_OFFSET_Y;
                    drone.shadow.setAngle(drone.angle);
                }
            });
        }
        // --- КОНЕЦ ОБНОВЛЕНИЯ ТЕНЕЙ ДРОНОВ ---

        if (this.isMoving && this.car?.active && this.tiresTrackRT) {
            this.drawTireTracks();
            
            // Логика интервального спавна пыли
            this.dustSpawnCounter++;
            if (this.dustSpawnCounter >= DUST_SPAWN_INTERVAL_FRAMES) {
                // Проверяем, активно ли нитро в текущем ходу
                const isNitroActiveThisTurn = this.car.getData('isNitroActiveThisTurn') || false;
                DustParticle.spawnDustParticles(this, this.car, this.dustParticlesGroup, this.wheelPositions, this.currentBiome, isNitroActiveThisTurn); 
                this.dustSpawnCounter = 0; // Сброс счетчика
            }
        }

        if (this.isMoving && this.physics.world?.destination) {
            const destination = this.physics.world.destination;
            const distanceToTarget = Phaser.Math.Distance.Between(this.car.x, this.car.y, destination.x, destination.y);
            const speed = this.car.body.velocity.length();

            if (distanceToTarget < STOP_DISTANCE_THRESHOLD || (speed < 5 && speed > 0)) {
                this.car.body.reset(destination.x, destination.y);
                this.finishMove();
                return;
            }
        } else if (!this.isMoving) {
            this.updateInfoText();
        }

        // Обновляем стрелку портала через UI
        if (this.ui) {
            this.ui.updatePortalArrow();
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

        // Обновление активных частиц пыли, если машина движется
        if (this.isMoving && this.dustParticlesGroup) {
            this.dustParticlesGroup.getChildren().forEach(particle => {
                if (particle.active) {
                    particle.update(); // ИСПРАВЛЕНО ранее (если не применилось)
                }
            });
        }
         // Удаляем неактивные частицы из группы, чтобы не накапливались
        if (this.dustParticlesGroup) {
            this.dustParticlesGroup.getChildren().forEach(particle => {
                if (!particle.active) {
                    this.dustParticlesGroup.remove(particle, true, true);
                }
            });
        }
    }

    // --- Завершение хода --- 
    finishMove() {
        if (this.checkDroneInterception()) {
            return; 
        }
        
        // Остановка звука двигателя при завершении движения
        this.soundManager.stopEngine();
        
        if (this.car?.active) {
            const nextSpeed = this.car.getData('nextSpeed');
            const nextNitroAvailable = this.car.getData('nextNitroAvailable');

            const speedForThisTurn = (nextSpeed !== undefined) ? nextSpeed : this.car.getData('speed') ?? MIN_SPEED;
            this.car.setData('speed', speedForThisTurn);
            
            // Обновляем скорость воспроизведения звука двигателя
            this.soundManager.updateEngineSoundRate(speedForThisTurn);
            
            this.car.setData('onSwamp', false);
            this.car.setData('swampPenaltyActive', false);
            
            // Сбрасываем флаги болота при завершении хода
            this.isInSwamp = false;
            this.swampEffectAppliedThisTurn = false; // Сбрасываем флаг применения эффекта для следующего хода
            // Сбрасываем прозрачность следов колес к стандартному значению
            this.swampTrackAlpha = TIRE_TRACK_ALPHA;
            // --- Снимаем блокировку ускорения и нитро после завершения хода ---
            this.isAccelerationBlockedBySwamp = false;
            this.isNitroBlockedBySwamp = false;
            if (this.arcController) this.arcController.setAccelerationBlockedBySwamp(false);
            // ---
            
            if (nextSpeed !== undefined) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (!isMobile) {
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
            }
            
            if (nextNitroAvailable !== undefined) {
                this.car.setData('nitroAvailable', nextNitroAvailable);
            }

            this.car.setData('nextSpeed', undefined);
            this.car.setData('nextNitroAvailable', undefined);
            this.car.setData('isNitroActiveThisTurn', false); // ADDED: Reset nitro flag after move
        }

        if (this.tireTrackGraphics) {
            this.tireTrackGraphics.clear();
        }

        this.isMoving = false;
        if (this.physics.world) this.physics.world.destination = null;

        console.log("GameScene: Turn finished. Current State - Speed:", this.car.getData('speed').toFixed(2), 
                   "NitroAvailable:", this.car.getData('nitroAvailable'));

        if (this.fuel <= 0 && !this.gameOver && !this.levelComplete) {
            this.handleOutOfFuel();
            return;
        }

        // Удаляем проверку и применение штрафа болота после хода

        if (this.scene.isActive(this.scene.key) && !this.levelComplete && !this.gameOver && this.arcController) {
            const pointer = this.input.activePointer;
            this.arcController.resetForNextTurn(pointer);
            this.updateInfoText();
        } else if (this.arcController) {
            this.arcController.clearVisuals();
            this.updateInfoText();
        }

        this.updateArcBorders(true);  // Показываем рамки после завершения движения
    }

    // --- Логика хода дронов ---
    startEnemyTurn(moveDuration) {
        console.log(`[startEnemyTurn] Entered. Duration: ${moveDuration}`);
        
        // Начало нового хода - сбрасываем флаг эффекта болота
        this.swampEffectAppliedThisTurn = false;
        
        // Воспроизведение звука двигателя при начале движения с начальной скоростью
        const initialSpeed = this.car?.getData('speed') ?? MIN_SPEED;
        this.soundManager.playEngine(initialSpeed);

        if (!this.dronesGroup || this.dronesGroup.getLength() === 0 || !this.car || this.levelComplete || this.gameOver) {
            console.log(`[startEnemyTurn] Aborted: dronesGroup=${!!this.dronesGroup}, dronesCount=${this.dronesGroup?.getLength() || 0}, car=${!!this.car}, levelComplete=${this.levelComplete}, gameOver=${this.gameOver}`);
            return; 
        }

        // Проверяем столкновения дронов перед планированием движения
        this.checkDroneCollisions();

        let targetPos;
        if (this.cube && this.cube.active) {
            targetPos = {
                x: (this.car.x + this.cube.x) / 2,
                y: (this.car.y + this.cube.y) / 2
            };
        } else {
            targetPos = { x: this.car.x, y: this.car.y };
        }

        const maxStep = DRONE_RANGE_CELLS * GRID_CELL_SIZE;
        
        const dronesMoveData = [];
        
        this.dronesGroup.getChildren().forEach((drone, index) => {
            if (drone.active && drone instanceof Drone) { 
                 drone.planMove(targetPos, maxStep);
                 console.log(`[startEnemyTurn] Executing move for drone ${index}`);
                 drone.executeMove(moveDuration);
                 
                 dronesMoveData.push({
                     index: index,
                     startX: drone.x,
                     startY: drone.y,
                     targetX: drone.nextX,
                     targetY: drone.nextY,
                     duration: moveDuration
                 });
            }
        });
        
        if (this.movesHistory.length > 0 && dronesMoveData.length > 0) {
            const lastMove = this.movesHistory[this.movesHistory.length - 1];
            lastMove.dronesMoves = dronesMoveData;
        }
    }

    checkDroneCollisions() {
        if (!this.dronesGroup || this.dronesGroup.getLength() < 2) return;

        const drones = this.dronesGroup.getChildren();
        const collisionRadius = DRONE_KILL_RADIUS_CELLS * GRID_CELL_SIZE;

        // Проверяем все пары дронов на столкновение
        for (let i = 0; i < drones.length; i++) {
            for (let j = i + 1; j < drones.length; j++) {
                const drone1 = drones[i];
                const drone2 = drones[j];

                if (drone1.active && drone2.active && 
                    Phaser.Math.Distance.Between(drone1.x, drone1.y, drone2.x, drone2.y) < collisionRadius) {
                    
                    console.log(`Drone collision detected between ${i} and ${j}`);
                    drone1.handleDroneCollision(drone2);
                }
            }
        }
    }

    checkDroneInterception() {
        if (!this.dronesGroup || this.dronesGroup.getLength() === 0 || !this.car || this.levelComplete || this.gameOver) return false;
        
        let intercepted = false;
        this.dronesGroup.getChildren().forEach(drone => {
            if (drone.active && drone instanceof Drone && drone.checkKill(this.car)) {
                console.log("Drone interception!");
                // Останавливаем звук двигателя немедленно
                this.soundManager.stopEngine(true);
                this.soundManager.stopReplayEngine(true);
                // Воспроизводим звук перехвата дроном
                this.soundManager.playDrone();
                this.triggerGameOver('INTERCEPTED!');
                intercepted = true;
                return; 
            }
        });
        return intercepted;
    }

    // --- Логика реплея ---
    startReplay() {
        if (!this.movesHistory || this.movesHistory.length === 0) {
            console.log("No moves to replay.");
            this.cameras.main.stopFollow();
            if (this.portalForReplay && this.portalForReplay.active) {
                this.portalForReplay.destroy();
                this.portalForReplay = null;
            }
            // Очистка частиц пыли реплея
            if (this.replayDustParticlesGroup) {
                this.replayDustParticlesGroup.clear(true, true);
            }
            return;
        }

        // Останавливаем обычный звук двигателя и запускаем звук для реплея
        this.soundManager.stopEngine(true);
        this.soundManager.playReplayEngine(MIN_SPEED);

        // Очищаем частицы пыли от основной игры
        if (this.dustParticlesGroup) {
            this.dustParticlesGroup.clear(true, true);
        }

        if (this.tiresTrackRT) {
            this.tiresTrackRT.clear();
        }

        if (this.car) this.car.setVisible(false).setActive(false);
        if (this.carShadow) this.carShadow.setVisible(false);

        this.replayBiome = getBiomeForLevel(this.currentLevel);
        console.log("Starting smooth replay for level", this.currentLevel, "Biome:", this.replayBiome === BIOME_SNOW ? "Snow" : "Other");

        // --- Определяем цвет тени для реплея ---
        let replayShadowColor;
        if (this.replayBiome === BIOME_DESERT) {
            replayShadowColor = BIOME_DESERT_COLOR;
        } else if (this.replayBiome === BIOME_SNOW) {
            replayShadowColor = BIOME_SNOW_COLOR;
        } else if (this.replayBiome === BIOME_GRASS) {
            replayShadowColor = BIOME_GRASS_COLOR;
        } else {
            replayShadowColor = SHADOW_COLOR; // Запасной вариант
        }

        // Очищаем контроллер
        if (this.arcController) this.arcController.clearVisuals();
        this.updateArcBorders(false); // Скрываем рамки арки при начале реплея
        
        // Убедимся, что портал видимый перед началом реплея
        if (this.portalForReplay && this.portalForReplay.active) {
            this.portalForReplay.setVisible(true);
            
            // Убираем портал из UI камеры, чтобы он не дублировался
            if (this.uiCamera) {
                this.uiCamera.ignore(this.portalForReplay);
            }
        }

        // Создаем машину для реплея и ее тень
        const firstMove = this.movesHistory[0];
        this.replayCar = this.add.sprite(firstMove.startX, firstMove.startY, CAR_PLAYER_KEY)
            .setDepth(this.car ? this.car.depth + 1 : 11)
            .setScale(this.car ? this.car.scale : 0.3)
            .setAngle(firstMove.fromAngleDeg)
            .setDataEnabled();
            
        // Сохраняем состояние нитро основной машины для реплея
        if (this.car) {
            this.replayCar.setData('nitroAvailable', this.car.getData('nitroAvailable'));
        }

        this.replayCarShadow = this.add.sprite(0, 0, CAR_PLAYER_KEY)
            .setScale(this.replayCar.scale)
            .setOrigin(this.replayCar.originX, this.replayCar.originY)
            .setTint(replayShadowColor) // Используем цвет тени биома для реплея
            .setAlpha(SHADOW_ALPHA)
            .setDepth(this.replayCar.depth + SHADOW_DEPTH_OFFSET)
            .setVisible(true);
        this.replayCarShadow.setPosition(this.replayCar.x + 2, this.replayCar.y + SHADOW_OFFSET_Y);
        this.replayCarShadow.setAngle(this.replayCar.angle);

        // Создаем дронов для реплея и их тени
        this.replayDrones = [];
        this.replayDroneShadows = [];
        
        // Находим данные о дронах в первом ходе (если есть)
        if (firstMove.dronesMoves && firstMove.dronesMoves.length > 0) {
            firstMove.dronesMoves.forEach((droneData, index) => {
                // Создаем реплей-дрон
                const replayDrone = this.add.sprite(droneData.startX, droneData.startY, DRONE_KEY)
                    .setDepth(15) // Чуть выше основных объектов
                    .setOrigin(0.5)
                    .setScale(0.6);
                    
                // Создаем тень реплей-дрона
                const replayDroneShadow = this.add.sprite(droneData.startX + 2, droneData.startY + SHADOW_OFFSET_Y + 15, DRONE_KEY)
                    .setScale(replayDrone.scale)
                    .setOrigin(replayDrone.originX, replayDrone.originY)
                    .setTint(replayShadowColor)
                    .setAlpha(SHADOW_ALPHA)
                    .setDepth(replayDrone.depth + SHADOW_DEPTH_OFFSET)
                    .setVisible(true);
                    
                // Добавляем их в массивы
                this.replayDrones.push(replayDrone);
                this.replayDroneShadows.push(replayDroneShadow);
                
                // Убираем реплей-дроны из UI камеры
                if (this.uiCamera) {
                    this.uiCamera.ignore(replayDrone);
                    this.uiCamera.ignore(replayDroneShadow);
                }
            });
        }

        // Убираем реплей-объекты из UI камеры
        if (this.uiCamera) {
            this.uiCamera.ignore(this.replayCar);
            this.uiCamera.ignore(this.replayCarShadow);
        }

        // Камера следует за реплей-машиной
        this.cameras.main.startFollow(this.replayCar, true, 0.05, 0.05);
        this.cameras.main.setFollowOffset(0, 0);

        // --- Smooth Replay Logic ---
        let totalDuration = 0;
        const pathSegments = [];

        for (let i = 0; i < this.movesHistory.length; i++) {
            const step = this.movesHistory[i];
            const duration = step.moveTime || 100; 
            totalDuration += duration;

            // --- Расчет скольжения для сегмента ---
            const isSnowReplay = this.replayBiome === BIOME_SNOW;
            let finalTargetX = step.targetX;
            let finalTargetY = step.targetY;
            let totalSkidVectorX = 0;
            let totalSkidVectorY = 0;
            let finalAngleForTween = step.finalAngleDeg;
            let shortestAngleDiffForTween = Phaser.Math.Angle.ShortestBetween(step.fromAngleDeg, step.finalAngleDeg);

            if (isSnowReplay && step.arcData && step.arcData.zone !== 'reverse') {
                const originalMoveDistance = Phaser.Math.Distance.Between(step.startX, step.startY, step.targetX, step.targetY);
                if (originalMoveDistance > 0) {
                    const skidDistance = originalMoveDistance * SNOW_SKID_FACTOR;
                    const dirX = (step.targetX - step.startX) / originalMoveDistance;
                    const dirY = (step.targetY - step.startY) / originalMoveDistance;
                    finalTargetX = step.targetX + dirX * skidDistance;
                    finalTargetY = step.targetY + dirY * skidDistance;

                    totalSkidVectorX = finalTargetX - step.targetX;
                    totalSkidVectorY = finalTargetY - step.targetY;

                    if (shortestAngleDiffForTween !== 0) {
                        const extraRotationFactor = SNOW_SKID_FACTOR * SNOW_SKID_EXTRA_ROTATION_MULTIPLIER;
                        const extraRotation = shortestAngleDiffForTween * extraRotationFactor;
                        finalAngleForTween = step.finalAngleDeg + extraRotation;
                        shortestAngleDiffForTween = shortestAngleDiffForTween * (1 + extraRotationFactor); 
                    }
                }
            }

            pathSegments.push({
                startX: step.startX,
                startY: step.startY,
                targetX: step.targetX, // Оригинальная цель
                targetY: step.targetY, // Оригинальная цель
                finalTargetX: finalTargetX, // Цель с учетом скольжения
                finalTargetY: finalTargetY, // Цель с учетом скольжения
                startAngleDeg: step.fromAngleDeg,
                targetAngleDeg: step.finalAngleDeg, // Оригинальный конечный угол
                finalAngleForTween: finalAngleForTween, // Конечный угол с учетом скольжения
                shortestAngleDiffForTween: shortestAngleDiffForTween, // Угол поворота для интерполяции
                arcData: step.arcData,
                duration: duration,
                startTime: totalDuration - duration, // Время начала этого сегмента
                isSnowReplay: isSnowReplay,
                totalSkidVectorX: totalSkidVectorX,
                totalSkidVectorY: totalSkidVectorY,
                dronesMoves: step.dronesMoves || [], // Добавляем данные о движении дронов
                isNitroUsed: step.isNitroUsed || false // ADDED: Carry over nitro usage flag
            });
        }

        console.log(`Smooth Replay Started: ${pathSegments.length} segments, Total Duration: ${totalDuration.toFixed(0)}ms`);

        this.tweens.add({
            targets: { progress: 0 },
            progress: 1,
            duration: totalDuration,
            ease: 'Linear',
            onUpdate: (tween, target) => {
                if (!this.replayCar || !this.replayCar.active || !this.replayCarShadow || !this.replayCarShadow.active) return;

                const overallProgress = target.progress;
                const currentTime = overallProgress * totalDuration;

                let currentSegment = null;
                let segmentStartTime = 0;
                for (let i = 0; i < pathSegments.length; i++) {
                    if (currentTime >= pathSegments[i].startTime && currentTime <= pathSegments[i].startTime + pathSegments[i].duration) {
                        currentSegment = pathSegments[i];
                        segmentStartTime = pathSegments[i].startTime;
                        break;
                    }
                    if (i === pathSegments.length - 1 && currentTime > pathSegments[i].startTime + pathSegments[i].duration) {
                        currentSegment = pathSegments[i];
                        segmentStartTime = pathSegments[i].startTime;
                    }
                }

                if (!currentSegment) {
                    if (pathSegments.length > 0) {
                        currentSegment = pathSegments[0];
                        segmentStartTime = 0;
                    } else {
                        return;
                    }
                }

                const segmentProgress = currentSegment.duration > 0
                    ? Phaser.Math.Clamp((currentTime - segmentStartTime) / currentSegment.duration, 0, 1)
                    : 1;

                // Рассчитываем текущую скорость на основе пройденного расстояния
                let currentSpeed = MIN_SPEED;
                if (currentSegment) {
                    const startX = currentSegment.startX;
                    const startY = currentSegment.startY;
                    const endX = currentSegment.isSnowReplay ? currentSegment.finalTargetX : currentSegment.targetX;
                    const endY = currentSegment.isSnowReplay ? currentSegment.finalTargetY : currentSegment.targetY;
                    
                    const totalDistance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
                    const timePerSegment = currentSegment.duration / 1000; // в секундах
                    
                    if (timePerSegment > 0) {
                        // Рассчитываем скорость в единицах в секунду
                        const speedInUnits = totalDistance / timePerSegment;
                        // Нормализуем скорость к диапазону MIN_SPEED - MAX_SPEED
                        currentSpeed = Phaser.Math.Clamp(
                            speedInUnits / (GRID_CELL_SIZE * 2), // Эмпирический коэффициент для нормализации
                            MIN_SPEED,
                            MAX_SPEED
                        );
                    }
                }

                // Обновляем скорость звука двигателя в реплее
                this.soundManager.updateReplayEngineSoundRate(currentSpeed);

                const arcData = currentSegment.arcData;
                const useArcMovement = arcData &&
                                      arcData.isArc === true &&
                                      arcData.arcCenterX !== undefined &&
                                      arcData.arcCenterY !== undefined &&
                                      arcData.turnRadius !== undefined &&
                                      arcData.startAngleInArc !== undefined &&
                                      arcData.endAngleInArc !== undefined;

                let interpolatedX, interpolatedY, interpolatedAngleDeg;

                if (!useArcMovement) {
                    // --- Линейная интерполяция ---
                    const startX = currentSegment.startX;
                    const startY = currentSegment.startY;
                    const endX = currentSegment.isSnowReplay ? currentSegment.finalTargetX : currentSegment.targetX;
                    const endY = currentSegment.isSnowReplay ? currentSegment.finalTargetY : currentSegment.targetY;

                    interpolatedX = Phaser.Math.Interpolation.Linear([startX, endX], segmentProgress);
                    interpolatedY = Phaser.Math.Interpolation.Linear([startY, endY], segmentProgress);
                    interpolatedAngleDeg = currentSegment.startAngleDeg + currentSegment.shortestAngleDiffForTween * segmentProgress;

                } else {
                    // --- Интерполяция по дуге ---
                    const arcCenterX = arcData.arcCenterX;
                    const arcCenterY = arcData.arcCenterY;
                    const turnRadius = arcData.turnRadius;
                    const startAngleInArc = arcData.startAngleInArc;
                    const endAngleInArc = arcData.endAngleInArc;

                    const currentAngleInArc = Phaser.Math.Interpolation.Linear([startAngleInArc, endAngleInArc], segmentProgress);
                    if (!isFinite(currentAngleInArc) || !isFinite(arcCenterX) || !isFinite(arcCenterY) || !isFinite(turnRadius)) {
                         console.warn("Invalid arc data during smooth replay update (base calc)");
                         interpolatedX = Phaser.Math.Interpolation.Linear([currentSegment.startX, currentSegment.finalTargetX], segmentProgress);
                         interpolatedY = Phaser.Math.Interpolation.Linear([currentSegment.startY, currentSegment.finalTargetY], segmentProgress);
                    } else {
                        const originalArcX = arcCenterX + Math.cos(currentAngleInArc) * turnRadius;
                        const originalArcY = arcCenterY + Math.sin(currentAngleInArc) * turnRadius;

                        if (currentSegment.isSnowReplay) {
                            const currentSkidOffsetX = currentSegment.totalSkidVectorX * segmentProgress;
                            const currentSkidOffsetY = currentSegment.totalSkidVectorY * segmentProgress;
                            interpolatedX = originalArcX + currentSkidOffsetX;
                            interpolatedY = originalArcY + currentSkidOffsetY;
                        } else {
                            interpolatedX = originalArcX;
                            interpolatedY = originalArcY;
                        }
                    }

                    // Интерполяция угла
                    interpolatedAngleDeg = currentSegment.startAngleDeg + currentSegment.shortestAngleDiffForTween * segmentProgress;
                }

                // Установка финальной позиции и угла
                const wrappedAngleDeg = Phaser.Math.Angle.WrapDegrees(interpolatedAngleDeg);
                if (!isFinite(interpolatedX) || !isFinite(interpolatedY) || !isFinite(wrappedAngleDeg)) {
                    console.warn("Smooth Replay: Invalid interpolated values", {x: interpolatedX, y: interpolatedY, angle: wrappedAngleDeg});
                    return;
                }

                this.replayCar.setPosition(interpolatedX, interpolatedY);
                this.replayCar.setAngle(wrappedAngleDeg);

                // Обновление тени
                this.replayCarShadow.setPosition(this.replayCar.x + 2, this.replayCar.y + SHADOW_OFFSET_Y);
                this.replayCarShadow.setAngle(this.replayCar.angle);

                // Обновление позиций дронов в реплее
                if (currentSegment.dronesMoves && currentSegment.dronesMoves.length > 0) {
                    currentSegment.dronesMoves.forEach((droneData, index) => {
                        if (index < this.replayDrones.length) {
                            const droneX = Phaser.Math.Interpolation.Linear([droneData.startX, droneData.targetX], segmentProgress);
                            const droneY = Phaser.Math.Interpolation.Linear([droneData.startY, droneData.targetY], segmentProgress);
                            
                            // Обновляем позицию дрона
                            this.replayDrones[index].setPosition(droneX, droneY);
                            
                            // Обновляем позицию тени дрона
                            this.replayDroneShadows[index].setPosition(droneX + 2, droneY + SHADOW_OFFSET_Y);
                        }
                    });
                }

                this.drawReplayTireTracks(currentSegment); // MODIFIED: Pass currentSegment

                if (this.portalForReplay && !this.portalForReplay.visible) {
                     this.portalForReplay.setVisible(true);
                }
            },
            onComplete: () => {
                console.log("Smooth Replay Finished.");
                // Останавливаем звук двигателя реплея
                this.soundManager.stopReplayEngine();

                if (this.replayCar && this.replayCar.active) {
                    const lastSegment = pathSegments[pathSegments.length - 1];
                    if (lastSegment) {
                        this.replayCar.setPosition(lastSegment.finalTargetX, lastSegment.finalTargetY);
                        this.replayCar.setAngle(Phaser.Math.Angle.WrapDegrees(lastSegment.finalAngleForTween));
                    }
                    this.replayCar.setVisible(false); // Скрываем в конце
                }
                if (this.replayCarShadow) {
                    this.replayCarShadow.destroy();
                    this.replayCarShadow = null;
                }
                
                if (this.replayDrones && this.replayDrones.length > 0) {
                    this.replayDrones.forEach(drone => {
                        if (drone) drone.destroy();
                    });
                    this.replayDrones = [];
                }
                if (this.replayDroneShadows && this.replayDroneShadows.length > 0) {
                    this.replayDroneShadows.forEach(shadow => {
                        if (shadow) shadow.destroy();
                    });
                    this.replayDroneShadows = [];
                }
                
                if (this.portalForReplay && this.portalForReplay.active) {
                    this.portalForReplay.destroy();
                    this.portalForReplay = null;
                }

                this.cameras.main.stopFollow();

                if (this.levelComplete) {
                    if (this.currentLevel >= TOTAL_LEVELS) {
                        if (this.ui && !this.ui.playAgainButton.visible) this.ui.playAgainButton.setVisible(true);
                    } else {
                        if (this.ui && !this.ui.nextLevelButton.visible) this.ui.nextLevelButton.setVisible(true);
                    }
                }
            },
            onCompleteScope: this
        });
    }

    drawReplayTireTracks(currentSegment) { // MODIFIED: Accept currentSegment
        if (!this.replayCar || !this.tiresTrackRT || !this.tireTrackGraphics) return;
        
        // console.log("[ReplayTireTracks] currentSegment.isNitroUsed:", currentSegment ? currentSegment.isNitroUsed : "No segment"); // DEBUG LOG REMOVED

        const carAngle = Phaser.Math.DegToRad(this.replayCar.angle);
        
        this.tireTrackGraphics.clear();
        
        let trackColor;
        if (currentSegment && currentSegment.isNitroUsed) { // ADDED: Check nitro usage for replay
            trackColor = TIRE_COLOR_NITRO; // CHANGED to new constant
        } else {
            if (this.replayBiome === BIOME_DESERT) {
                trackColor = BIOME_DESERT_COLOR;
            } else if (this.replayBiome === BIOME_SNOW) {
                trackColor = BIOME_SNOW_COLOR;
            } else if (this.replayBiome === BIOME_GRASS) {
                trackColor = BIOME_GRASS_COLOR;
            } else {
                trackColor = TIRE_TRACK_COLOR; // Стандартный цвет как запасной вариант
            }
        }
        
        this.tireTrackGraphics.fillStyle(trackColor, TIRE_TRACK_ALPHA);
        
        for (const wheel of this.wheelPositions) {
            const rotatedX = wheel.offsetX * Math.cos(carAngle) - wheel.offsetY * Math.sin(carAngle);
            const rotatedY = wheel.offsetX * Math.sin(carAngle) + wheel.offsetY * Math.cos(carAngle);
            
            const wheelX = this.replayCar.x + rotatedX;
            const wheelY = this.replayCar.y + rotatedY;
            
            this.tireTrackGraphics.fillCircle(wheelX, wheelY, this.tireTrackRadius);
        }
        
        this.tiresTrackRT.draw(this.tireTrackGraphics);
    }

    // --- Отладка ---
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
            this.updateArcBorders(false);
        } else {
            this.arcController.drawState();
            this.updateArcBorders(true);
        }
        
        this.updateInfoText();
    }
    
    // Обновляет положение и видимость спрайтов рамок арки
    updateArcBorders(visible) {
        if (!this.ui) return;
        this.ui.updateArcBorders(visible);
    }

    activateDebugMode() {
        this.debugMode = true;
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
        if (car !== this.car || !car || !obstacle || this.levelComplete || this.gameOver || !car.active) return;

        console.log("Collision with obstacle!");
        
        // Немедленная остановка звука двигателя при столкновении
        this.soundManager.stopEngine(true);
        
        // Воспроизведение звука столкновения
        this.soundManager.playCrash();

        this.tweens.killAll(); 
        if (this.carShadow) this.tweens.killTweensOf(this.carShadow);

        if (this.arcController) this.arcController.clearVisuals();
        this.input.off('pointerdown');
        this.input.off('pointermove');
        this.input.off('pointerup');
        this.input.keyboard.enabled = false;

        this.triggerGameOver(`CRASHED!`);
    }

    handleSwamp(car, swamp) {
        // Проверка на активность машины и болота
        if (car !== this.car || !car || !swamp || this.levelComplete || this.gameOver || !car.active) return;
        // Если эффект болота уже был применен в этом ходу, игнорируем повторные коллизии
        if (this.swampEffectAppliedThisTurn) return;
        console.log("Collision with swamp!");
        this.swampEffectAppliedThisTurn = true;
        // Если машина уже в болоте, не показываем эффект снова
        if (this.isInSwamp) return;
        this.isInSwamp = true;
        // Устанавливаем минимальную скорость на следующий ход
        this.car.setData('nextSpeed', MIN_SPEED);
        // Устанавливаем увеличенную прозрачность следов колес для болота
        this.swampTrackAlpha = 0.2;
        // --- Блокируем только ускорение и нитро ---
        this.isAccelerationBlockedBySwamp = true;
        this.isNitroBlockedBySwamp = true;
        if (this.arcController) this.arcController.setAccelerationBlockedBySwamp(true);
        
        // Показываем эффект через UI
        if (this.ui) {
            this.ui.showSwampEffect({ x: this.car.x, y: this.car.y });
        }
    }

    drawTireTracks() {
        if (!this.car || !this.tiresTrackRT || !this.tireTrackGraphics) return;
        
        const isNitroActiveThisTurn = this.car.getData('isNitroActiveThisTurn');
        // console.log("[DrawTireTracks] isNitroActiveThisTurn:", isNitroActiveThisTurn); // DEBUG LOG REMOVED

        const carAngle = Phaser.Math.DegToRad(this.car.angle);
        
        this.tireTrackGraphics.clear();
        
        let trackColor;
        if (isNitroActiveThisTurn) { // ADDED: Check for active nitro
            trackColor = TIRE_COLOR_NITRO; // CHANGED to new constant
        } else {
            if (this.currentBiome === BIOME_DESERT) {
                trackColor = BIOME_DESERT_COLOR;
            } else if (this.currentBiome === BIOME_SNOW) {
                trackColor = BIOME_SNOW_COLOR;
            } else if (this.currentBiome === BIOME_GRASS) {
                trackColor = BIOME_GRASS_COLOR;
            } else {
                trackColor = TIRE_TRACK_COLOR; 
            }
        }
        
        // Используем переменную swampTrackAlpha, если машина в болоте, иначе используем константу
        const trackAlpha = this.isInSwamp ? this.swampTrackAlpha : TIRE_TRACK_ALPHA;
        this.tireTrackGraphics.fillStyle(trackColor, trackAlpha);
        
        for (const wheel of this.wheelPositions) {
            const rotatedX = wheel.offsetX * Math.cos(carAngle) - wheel.offsetY * Math.sin(carAngle);
            const rotatedY = wheel.offsetX * Math.sin(carAngle) + wheel.offsetY * Math.cos(carAngle);
            
            const wheelX = this.car.x + rotatedX;
            const wheelY = this.car.y + rotatedY;
            
            this.tireTrackGraphics.fillCircle(wheelX, wheelY, this.tireTrackRadius);
        }
        
        this.tiresTrackRT.draw(this.tireTrackGraphics);
    }

    loadGameProgress() {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.currentLevel = progress.currentLevel;
            // Не загружаем obstacleThreshold из сохранения
            this.fuel = progress.fuel;
            
            // Сохраняем данные для следующего уровня
            this.registry.set('currentLevel', this.currentLevel);
            // Не сохраняем obstacleThreshold в реестре
            this.registry.set('fuelForNextLevel', this.fuel);
            this.registry.set('nitroForNextLevel', progress.nitroAvailable);
            
            console.log('Game progress loaded:', progress);
        } else {
            // Если нет сохраненного прогресса, устанавливаем значения по умолчанию
            this.currentLevel = 1;
            // Используем значение из LEVEL_SETTINGS
            const levelSettings = getLevelSettings(1);
            this.currentObstacleThreshold = levelSettings.threshold;
            this.fuel = INITIAL_FUEL;
            
            this.registry.set('currentLevel', this.currentLevel);
            // Не сохраняем obstacleThreshold в реестре
            this.registry.set('fuelForNextLevel', this.fuel);
            this.registry.set('nitroForNextLevel', NITRO_AVAILABLE_BY_DEFAULT);
            
            console.log('No saved progress found, using default values');
        }
    }
} 