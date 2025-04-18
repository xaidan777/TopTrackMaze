class LevelGenerator {
    constructor(scene) {
        this.scene = scene;
        this.noise = new SimplexNoise();
    }

    createLevel(params) {
        const {
            obstaclesGroup,
            obstacleShadowsGroup,
            collectibleGroup,
            currentObstacleThreshold
        } = params;

        console.log("Creating level obstacles, border, and cube...");
        
        if (obstaclesGroup) obstaclesGroup.clear(true, true);
        if (obstacleShadowsGroup) obstacleShadowsGroup.clear(true, true);
        if (collectibleGroup) collectibleGroup.clear(true, true);

        const gridWidth = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);
        const gridHeight = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);
        
        if (gridHeight <= 0 || gridWidth <= 0) {
            console.error("Invalid grid dimensions:", gridWidth, gridHeight);
            return null;
        }

        const occupiedCells = this._generateObstacles({
            gridWidth,
            gridHeight,
            currentObstacleThreshold,
            obstaclesGroup,
            obstacleShadowsGroup
        });

        this._generateBorderObstacles({
            gridWidth,
            gridHeight,
            occupiedCells,
            obstaclesGroup,
            obstacleShadowsGroup
        });

        const portalSprite = this._spawnCube(occupiedCells, gridWidth, gridHeight, collectibleGroup);

        return {
            occupiedCells,
            gridWidth,
            gridHeight,
            portal: portalSprite
        };
    }

    _generateObstacles({ gridWidth, gridHeight, currentObstacleThreshold, obstaclesGroup, obstacleShadowsGroup }) {
        const occupiedCells = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
        const startGridX = Math.floor((GAME_WIDTH / 2) / GRID_CELL_SIZE);
        const startGridY = Math.floor((GAME_HEIGHT / 2) / GRID_CELL_SIZE);
        const clearRadiusGrid = Math.ceil((GRID_CELL_SIZE * START_AREA_CLEAR_RADIUS_FACTOR) / GRID_CELL_SIZE);

        // Очищаем стартовую область
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

        // Генерируем препятствия
        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const cellCenterX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                if (occupiedCells[gy][gx]) continue;
                if (this.noise.noise2D(cellCenterX / NOISE_SCALE, cellCenterY / NOISE_SCALE) > currentObstacleThreshold) {
                    const obstacle = obstaclesGroup.create(cellCenterX, cellCenterY, OBSTACLE_IMAGE_KEY);
                    obstacle.setScale(0.5);
                    obstacle.setDepth(-1);

                    const shadow = this.scene.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
                    shadow.setScale(obstacle.scale);
                    shadow.setOrigin(obstacle.originX, obstacle.originY);
                    shadow.setTint(SHADOW_COLOR);
                    shadow.setAlpha(SHADOW_ALPHA);
                    shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
                    obstacleShadowsGroup.add(shadow);

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

        return occupiedCells;
    }

    _generateBorderObstacles({ gridWidth, gridHeight, occupiedCells, obstaclesGroup, obstacleShadowsGroup }) {
        let borderObstaclesCount = 0;

        // Верхняя и нижняя границы
        for (let gx = 0; gx < gridWidth; gx++) {
            const topX = gx * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const topY = GRID_CELL_SIZE / 2;
            const bottomY = (gridHeight - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            if (!occupiedCells[0][gx]) {
                this._createBorderObstacle(topX, topY, obstaclesGroup, obstacleShadowsGroup);
                occupiedCells[0][gx] = true;
                borderObstaclesCount++;
            }
            if (gridHeight > 1 && !occupiedCells[gridHeight - 1][gx]) {
                this._createBorderObstacle(topX, bottomY, obstaclesGroup, obstacleShadowsGroup);
                occupiedCells[gridHeight - 1][gx] = true;
                borderObstaclesCount++;
            }
        }

        // Левая и правая границы
        for (let gy = 1; gy < gridHeight - 1; gy++) {
            const leftX = GRID_CELL_SIZE / 2;
            const leftY = gy * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
            const rightX = (gridWidth - 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

            if (!occupiedCells[gy][0]) {
                this._createBorderObstacle(leftX, leftY, obstaclesGroup, obstacleShadowsGroup);
                occupiedCells[gy][0] = true;
                borderObstaclesCount++;
            }
            if (gridWidth > 1 && !occupiedCells[gy][gridWidth - 1]) {
                this._createBorderObstacle(rightX, leftY, obstaclesGroup, obstacleShadowsGroup);
                occupiedCells[gy][gridWidth - 1] = true;
                borderObstaclesCount++;
            }
        }

        console.log(`Added ${borderObstaclesCount} border obstacles.`);
    }

    _createBorderObstacle(x, y, obstaclesGroup, obstacleShadowsGroup) {
        const obstacle = obstaclesGroup.create(x, y, OBSTACLE_IMAGE_KEY);
        obstacle.setScale(0.5);
        obstacle.setDepth(-1);

        const shadow = this.scene.add.sprite(obstacle.x + 2, obstacle.y + SHADOW_OFFSET_Y, OBSTACLE_IMAGE_KEY);
        shadow.setScale(obstacle.scale);
        shadow.setOrigin(obstacle.originX, obstacle.originY);
        shadow.setTint(SHADOW_COLOR);
        shadow.setAlpha(SHADOW_ALPHA);
        shadow.setDepth(obstacle.depth + SHADOW_DEPTH_OFFSET);
        obstacleShadowsGroup.add(shadow);

        const collisionSize = GRID_CELL_SIZE * 0.8;
        const originalSize = GRID_CELL_SIZE;
        const offsetX = (originalSize - collisionSize) / 2;
        const offsetY = (originalSize - collisionSize) / 2;

        obstacle.body.setSize(collisionSize, collisionSize);
        obstacle.body.setOffset(offsetX, offsetY);
        obstacle.refreshBody();
    }

    _spawnCube(occupiedCells, gridWidth, gridHeight, collectibleGroup) {
        if (!collectibleGroup) {
            console.error("Collectible group not initialized!");
            return null;
        }

        let cubeSpawned = false;
        let attempts = 0;
        const maxAttempts = gridWidth * gridHeight;
        let portalSprite = null;

        const startGridX = Math.floor((GAME_WIDTH / 2) / GRID_CELL_SIZE);
        const startGridY = Math.floor((GAME_HEIGHT / 2) / GRID_CELL_SIZE);
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

                    portalSprite = collectibleGroup.create(cubeX, cubeY, PORTAL_KEY);
                    if (portalSprite) {
                        portalSprite.setOrigin(0.5).setDepth(0);
                        portalSprite.setScale(0.75);
                        this.scene.tweens.add({
                            targets: portalSprite,
                            scaleY: portalSprite.scaleY * 1.1,
                            scaleX: portalSprite.scaleX * 0.9,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut',
                            duration: 800
                        });
                        occupiedCells[randomGridY][randomGridX] = true;
                        cubeSpawned = true;
                        console.log(`Portal spawned at grid (${randomGridX}, ${randomGridY})`);
                    }
                }
            }
            attempts++;
        }

        if (!cubeSpawned) {
            console.warn(`Could not find a suitable free cell for the portal after ${maxAttempts} attempts!`);
        }

        return portalSprite;
    }

    spawnFuelPickup(occupiedCells, gridWidth, gridHeight, fuelPickupGroup) {
        if (!fuelPickupGroup || !occupiedCells) {
            console.error("Fuel pickup group or occupiedCells not initialized!");
            return null;
        }
        let pickupSpawned = false;
        let attempts = 0;
        const maxAttempts = gridWidth * gridHeight / 2;
        let pickup = null;

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
                pickup = fuelPickupGroup.create(pickupX, pickupY, FUEL_PICKUP_KEY);
                if (pickup) {
                    pickup.setOrigin(0.5).setDepth(0);
                    pickup.setDisplaySize(GRID_CELL_SIZE * 0.8, GRID_CELL_SIZE * 0.8);
                    this.scene.tweens.add({
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
                }
            }
            attempts++;
        }
        if (!pickupSpawned) {
            console.warn(`Could not find a free cell to spawn fuel pickup after ${attempts} attempts.`);
        }
        
        return pickup;
    }
}
