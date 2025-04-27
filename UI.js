class UI {
    constructor(scene) {
        this.scene = scene;
        this.levelText = null;
        this.speedText = null;
        this.fuelText = null;
        this.winText = null;
        this.nextLevelButton = null;
        this.restartLevelText = null;
        this.playAgainButton = null;
        this.restartButtonObject = null;
        this.menuButtonObject = null;
        this.portalArrow = null;
        this.leftBorderSprite = null;
        this.rightBorderSprite = null;
    }

    create() {
        // Создание текста уровня
        this.levelText = this.scene.add.text(10, 5, `LVL: ${this.scene.currentLevel} / ${TOTAL_LEVELS}`, {
            font: '20px Lilita One',
            fill: '#fffabd',
            stroke: '#375667',
            strokeThickness: 3,
            align: 'left',
            shadow: {
                offsetX: 2,
                offsetY: 4,
                color: '#375667',
                fill: true
            }
        }).setOrigin(0, 0).setDepth(21);

        // Создание текста скорости
        this.speedText = this.scene.add.text(10, 35, '', {
            font: '20px Lilita One',
            fill: '#fffabd',
            stroke: '#375667',
            strokeThickness: 3,
            align: 'left',
            shadow: {
                offsetX: 2,
                offsetY: 4,
                color: '#375667',
                fill: true
            }
        }).setOrigin(0, 0).setDepth(21);

        // Создание текста топлива
        this.fuelText = this.scene.add.text(GAME_WIDTH / 2, 5, '', {
            font: '24px Lilita One',
            fill: '#fffabd',
            stroke: '#375667',
            strokeThickness: 3,
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 4,
                color: '#375667',
                fill: true
            }
        }).setOrigin(0.3, 0).setDepth(21);

        // Обновляем отображение топлива сразу после создания
        this.updateFuelDisplay();

        // Создание кнопки "Играть снова"
        this.playAgainButton = this.scene.add.image(0, 0, START_BUTTON_KEY)
            .setVisible(false).setInteractive({ useHandCursor: true })
            .on('pointerdown', this.scene.startNewGame, this.scene);

        // Создание кнопки рестарта
        this.restartButtonObject = this.scene.add.image(GAME_WIDTH - 5, 5, RESTART_BUTTON_KEY)
            .setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true });
        this.restartButtonObject.on('pointerdown', () => {
            console.log("Restart button clicked!");
            if (!this.scene.isMoving && !this.scene.levelComplete && !this.scene.gameOver) {
                this.scene.registry.set('isLevelRestart', true);
                this.scene.scene.restart();
            }
        });
        this.restartButtonObject.on('pointerover', () => {
            this.restartButtonObject.setTint(0xcccccc);
        });
        this.restartButtonObject.on('pointerout', () => {
            this.restartButtonObject.clearTint();
        });

        // Создание кнопки возврата в меню
        this.menuButtonObject = this.scene.add.image(GAME_WIDTH - 50, 5, 'menu_b')
            .setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true })
            .setScale(0.8);
        this.menuButtonObject.on('pointerdown', () => {
            console.log("Menu button clicked!");
            this.scene.saveGameProgress();
            this.scene.scene.start('MainMenuScene');
        });
        this.menuButtonObject.on('pointerover', () => {
            this.menuButtonObject.setTint(0xcccccc);
        });
        this.menuButtonObject.on('pointerout', () => {
            this.menuButtonObject.clearTint();
        });

        // Создание текста победы
        this.winText = this.scene.add.text(0, 0, 'LEVEL COMPLETE!', {
            font: '36px Lilita One',
            fill: '#fffabd',
            stroke: '#375667',
            strokeThickness: 3,
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 4,
                color: '#375667',
                fill: true
            }
        }).setOrigin(0.5).setDepth(25).setVisible(false);

        // Создание кнопки следующего уровня
        if (this.scene.currentLevel < TOTAL_LEVELS) {
            this.nextLevelButton = this.scene.add.image(0, 0, NEXT_LEVEL_BUTTON_KEY)
                .setVisible(false).setInteractive({ useHandCursor: true })
                .on('pointerdown', this.scene.startNextLevel, this.scene);
            this.nextLevelButton.on('pointerover', () => {
                this.nextLevelButton.setTint(0xcccccc);
            });
            this.nextLevelButton.on('pointerout', () => {
                this.nextLevelButton.clearTint();
            });
        }

        // Создание текста рестарта уровня
        this.restartLevelText = this.scene.add.text(0, 0, '', {
            font: '36px Lilita One',
            fill: '#fffabd',
            stroke: '#375667',
            strokeThickness: 3,
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 4,
                color: '#375667',
                fill: true
            }
        }).setOrigin(0.5).setDepth(26).setVisible(false);

        // Создание стрелки портала
        this.portalArrow = this.scene.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arrow')
            .setDepth(200)
            .setScrollFactor(0)
            .setVisible(false)
            .setScale(1.2);

        // Создание спрайтов рамок арки
        this.leftBorderSprite = this.scene.add.sprite(0, 0, 'strike')
            .setDepth(200)
            .setAlpha(0.8)
            .setVisible(false);
            
        this.rightBorderSprite = this.scene.add.sprite(0, 0, 'strike')
            .setDepth(200)
            .setAlpha(0.8)
            .setVisible(false);

        // Настройка UI камеры
        this.setupUICamera();
    }

    setupUICamera() {
        this.scene.uiCamera = this.scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.scene.uiCamera.setScroll(0, 0).setZoom(1);
        
        // Игнорируем все игровые объекты в UI камере
        this.scene.uiCamera.ignore([
            this.scene.backgroundTile,
            this.scene.ghostCar,
            this.scene.car,
            this.scene.carShadow,
            this.scene.obstaclesGroup.getChildren(),
            this.scene.obstacleShadowsGroup.getChildren(),
            ...this.scene.fuelPickupGroup.getChildren().filter(c => c.active),
            ...this.scene.nitroPickupGroup.getChildren().filter(c => c.active),
            this.scene.collectibleGroup.getChildren(),
            this.scene.swampGroup.getChildren(),
            this.scene.controlArcGraphics,
            this.scene.trajectoryGraphics,
            this.scene.snapCursor,
            this.scene.tiresTrackRT,
            this.scene.tireTrackGraphics,
            ...this.scene.dronesGroup.getChildren(),
            ...this.scene.droneShadowsGroup.getChildren(),
            this.leftBorderSprite,
            this.rightBorderSprite
        ]);

        // Игнорируем UI элементы в основной камере
        const mainCameraIgnoreList = [
            this.levelText,
            this.speedText,
            this.fuelText,
            this.playAgainButton,
            this.restartButtonObject,
            this.menuButtonObject,
            this.winText,
            this.nextLevelButton,
            this.restartLevelText,
            this.portalArrow
        ].filter(item => item);
        
        if (mainCameraIgnoreList.length > 0) {
            this.scene.cameras.main.ignore(mainCameraIgnoreList);
        }
    }

    updateFuelDisplay() {
        if (!this.fuelText || !this.fuelText.active) return;
        let fuelString = `FUEL: ${this.scene.fuel}`;
        if (this.scene.fuel <= FUEL_LOW_THRESHOLD) {
            this.fuelText.setFill(FUEL_COLOR_LOW);
            this.fuelText.setStroke('4a1e00');
            this.fuelText.setShadow(2, 4, '#4a1e00', true);
        } else {
            this.fuelText.setFill('#fffabd');
            this.fuelText.setStroke('#375667');
            this.fuelText.setShadow(2, 4, '#375667', true);
        }
        try {
            this.fuelText.setText(fuelString);
        } catch (e) {
            console.warn("Error updating fuel text:", e);
        }
    }

    updateInfoText() {
        if (!this.speedText || !this.scene.car || !this.speedText.active) return;
        const speed = this.scene.car.getData('speed') ?? 0;
        const nitroAvailable = this.scene.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        
        const textColor = nitroAvailable ? '#00ffff' : '#fffabd';
        
        this.speedText.setText(`SPEED: ${speed.toFixed(1)}`);
        this.speedText.setFill(textColor);
        this.speedText.setStroke('#375667');
    }

    handleResize() {
        if (!this.scene.cameras || !this.scene.cameras.main) return;

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const aspectRatio = width / height;

        let newWidth = width;
        let newHeight = height;

        if (aspectRatio > MAX_ASPECT_RATIO) {
            newWidth = height * MAX_ASPECT_RATIO;
        } else if (aspectRatio < MIN_ASPECT_RATIO) {
            newHeight = width / MIN_ASPECT_RATIO;
        }

        this.scene.cameras.main.setViewport(
            (width - newWidth) / 2,
            (height - newHeight) / 2,
            newWidth,
            newHeight
        );

        if (this.scene.uiCamera) {
            this.scene.uiCamera.setViewport(
                (width - newWidth) / 2,
                (height - newHeight) / 2,
                newWidth,
                newHeight
            );
        }

        const centerX = newWidth / 2;
        const centerY = newHeight / 2;

        if (this.winText) {
            this.winText.setPosition(centerX, centerY - 75);
        }

        if (this.restartLevelText) {
            this.restartLevelText.setPosition(centerX, centerY - 50);
        }

        if (this.playAgainButton) {
            this.playAgainButton.setPosition(centerX, centerY + 30);
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.setPosition(centerX, centerY - 10);
        }

        if (this.restartButtonObject) {
            this.restartButtonObject.setPosition(newWidth - 50, 0);
        }

        if (this.menuButtonObject) {
            this.menuButtonObject.setPosition(newWidth - 5, 5);
        }

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

    updateArcBorders(visible) {
        if (!this.leftBorderSprite || !this.rightBorderSprite || !this.scene.car) return;
        
        if (!visible) {
            this.leftBorderSprite.setVisible(false);
            this.rightBorderSprite.setVisible(false);
            return;
        }
        
        const carAngleRad = Phaser.Math.DegToRad(this.scene.car.angle);
        const speed = this.scene.car.getData('speed') ?? MIN_SPEED;
        
        const effectiveSpeed = Math.max(0.2, speed);
        const normSpeed = Phaser.Math.Clamp((effectiveSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const radiusFactor = SPEED_TO_GUI_RADIUS_FACTOR * normSpeed;
        const innerRadius = BASE_INNER_RADIUS_GUI + radiusFactor;
        const baseThick = ARC_THICKNESS_GUI;
        const thickReduce = baseThick * normSpeed * GUI_THICKNESS_REDUCTION_FACTOR;
        const arcThickness = Math.max(MIN_ARC_THICKNESS, baseThick - thickReduce);
        const outerRadius = innerRadius + arcThickness;
        const angleReductionMultiplier = 1 / (normSpeed * (MAX_GUI_ANGLE_REDUCTION_FACTOR - 1) + 1);
        const angleDeg = Math.max(MIN_ARC_ANGLE_DEG, BASE_ANGLE_DEG * angleReductionMultiplier);
        const halfAngleRad = Phaser.Math.DegToRad(angleDeg / 2);
        
        const startAngle = carAngleRad - halfAngleRad;
        const endAngle = carAngleRad + halfAngleRad;
        
        const borderScale = 0.5;
        
        // Устанавливаем точку привязки в начало спрайтов
        this.leftBorderSprite.setOrigin(1, 1.2);
        this.rightBorderSprite.setOrigin(0, 1.2);
        
        // Обновляем позиции и углы рамок
        // Позиционируем от центра машины
        this.leftBorderSprite
            .setPosition(this.scene.car.x, this.scene.car.y)
            .setAngle(Phaser.Math.RadToDeg(startAngle) + 90)
            .setScale(outerRadius / 100, borderScale)
            .setVisible(true);
            
        this.rightBorderSprite
            .setPosition(this.scene.car.x, this.scene.car.y)
            .setAngle(Phaser.Math.RadToDeg(endAngle) + 90)
            .setScale(outerRadius / 100, borderScale)
            .setVisible(true);
    }
}