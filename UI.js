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
        
        // Добавляем ссылки на окно с советами
        this.tipsWindow = null;
        this.okButtonContainer = null;
        
        // Константы для окна советов
        this.TIPS_SIZE = { w: 384, h: 512 };

        // Добавляем ссылки на элементы полоски топлива
        this.fuelTankBg = null;
        this.fuelTankEmpty = null;
        this.fuelTankFill = null;
    }

    create() {
        // Получаем выбранный язык
        const language = localStorage.getItem('language') || 'en';
        
        // Текст кнопок в зависимости от языка
        const buttonTexts = {
            nextLevel: language === 'ru' ? 'ДАЛЬШЕ' : 'NEXT LEVEL',
            playAgain: language === 'ru' ? 'ИГРАТЬ СНОВА' : 'PLAY AGAIN'
        };

        // Создаем кнопку "Следующий уровень" с текстом
        this.nextLevelButton = this.scene.add.container(0, 0).setVisible(false);
        const nextLevelBg = this.scene.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });
        const nextLevelText = this.scene.add.text(0, -3, buttonTexts.nextLevel, {
            font: '32px Lilita One',
            fill: '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        this.nextLevelButton.add([nextLevelBg, nextLevelText]);
        
        nextLevelBg.on('pointerdown', this.scene.startNextLevel, this.scene);
        nextLevelBg.on('pointerover', () => {
            nextLevelBg.setTint(0xcccccc);
            nextLevelText.setTint(0xcccccc);
        });
        nextLevelBg.on('pointerout', () => {
            nextLevelBg.clearTint();
            nextLevelText.clearTint();
        });

        // Создаем кнопку "Играть снова" с текстом
        this.playAgainButton = this.scene.add.container(0, 0).setVisible(false);
        const playAgainBg = this.scene.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });
        const playAgainText = this.scene.add.text(0, -3, buttonTexts.playAgain, {
            font: '32px Lilita One',
            fill: '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        this.playAgainButton.add([playAgainBg, playAgainText]);
        
        playAgainBg.on('pointerdown', this.scene.startNewGame, this.scene);
        playAgainBg.on('pointerover', () => {
            playAgainBg.setTint(0xcccccc);
            playAgainText.setTint(0xcccccc);
        });
        playAgainBg.on('pointerout', () => {
            playAgainBg.clearTint();
            playAgainText.clearTint();
        });

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

        // Создание текста уровня
        this.levelText = this.scene.add.text(10, 5, language === 'ru' ? `УРОВЕНЬ: ${this.scene.currentLevel} / ${TOTAL_LEVELS}` : `LEVEL: ${this.scene.currentLevel} / ${TOTAL_LEVELS}`, {
            font: '18px Lilita One',
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
            font: '18px Lilita One',
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
            font: '22px Lilita One',
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

        // Создание полоски топлива
        this.fuelTankBg = this.scene.add.image(18, 0, 'fuel_tank')
            .setOrigin(0, 0.5)
            .setDepth(21);

        // Создаем пустую шкалу
        this.fuelTankEmpty = this.scene.add.graphics()
            .setDepth(22);
        this.fuelTankEmpty.fillStyle(0x484736);
        this.fuelTankEmpty.fillRoundedRect(0, 0, 264, 20, 5);
        this.fuelTankEmpty.setX(22);
        this.fuelTankEmpty.setY(0); 

        // Создаем заполненную шкалу
        this.fuelTankFill = this.scene.add.graphics()
            .setDepth(23);
        this.fuelTankFill.fillStyle(0xfffabd);
        this.fuelTankFill.fillRoundedRect(0, 0, 264, 20, 5); 
        this.fuelTankFill.setX(22);
        this.fuelTankFill.setY(0);

        // Обновляем отображение топлива сразу после создания
        this.updateFuelDisplay();
        this.updateFuelTank();

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
        this.winText = this.scene.add.text(0, 0, language === 'ru' ? 'УРОВЕНЬ ПРОЙДЕН!' : 'LEVEL COMPLETE!', {
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
            this.portalArrow,
            this.fuelTankBg, 
            this.fuelTankEmpty,
            this.fuelTankFill 
        ].filter(item => item);
        
        if (mainCameraIgnoreList.length > 0) {
            this.scene.cameras.main.ignore(mainCameraIgnoreList);
        }
    }

    updateFuelTank() {
        if (!this.fuelTankFill || !this.fuelTankFill.active) return;

        const fuelPercentage = this.scene.fuel / MAX_FUEL;
        const fillWidth = 264 * fuelPercentage;
        
        this.fuelTankFill.clear();
        if (this.scene.fuel <= FUEL_LOW_THRESHOLD) {
            this.fuelTankFill.fillStyle(0xde2a06);
        } else {
            this.fuelTankFill.fillStyle(0xfffabd);
        }
        this.fuelTankFill.fillRoundedRect(0, 0, fillWidth, 20, 5);
    }

    updateFuelDisplay() {
        if (!this.fuelText || !this.fuelText.active) return;
        const language = localStorage.getItem('language') || 'en';
        const fuelPrefix = language === 'ru' ? 'ТОПЛИВО: ' : 'FUEL: ';
        let fuelString = `${fuelPrefix}${this.scene.fuel}`;
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
            this.updateFuelTank(); // Обновляем полоску топлива при обновлении текста
        } catch (e) {
            console.warn("Error updating fuel text:", e);
        }
    }

    updateInfoText() {
        if (!this.speedText || !this.scene.car || !this.speedText.active) return;
        const language = localStorage.getItem('language') || 'en';
        const speed = this.scene.car.getData('speed') ?? 0;
        const nitroAvailable = this.scene.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        const textColor = nitroAvailable ? '#00ffff' : '#fffabd';
        if (language === 'ru') {
            this.speedText.setText(`СКОРОСТЬ: ${speed.toFixed(1)}`);
        } else {
            this.speedText.setText(`SPEED: ${speed.toFixed(1)}`);
        }
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
            this.winText.setPosition(centerX, centerY - 45);
        }

        if (this.restartLevelText) {
            this.restartLevelText.setPosition(centerX, centerY - 20);
        }

        if (this.playAgainButton) {
            this.playAgainButton.setPosition(centerX, centerY + 30);
        }

        if (this.nextLevelButton) {
            this.nextLevelButton.setPosition(centerX, centerY + 50);
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
            this.fuelText.setPosition(25, newHeight - 70);
        }

        if (this.fuelTankBg) {
            this.fuelTankBg.setPosition(16, newHeight - 27);
        }

        if (this.fuelTankEmpty) {
            this.fuelTankEmpty.setY(newHeight - 35);
        }

        if (this.fuelTankFill) {
            this.fuelTankFill.setY(newHeight - 35);
        }

        // Обновляем позиции границ арки
        if (this.leftBorderSprite) {
            this.leftBorderSprite.setPosition(0, centerY);
        }
        if (this.rightBorderSprite) {
            this.rightBorderSprite.setPosition(width, centerY);
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
        this.leftBorderSprite.setOrigin(1, 1.5);
        this.rightBorderSprite.setOrigin(0, 1.5);
        
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

    /**
     * Показывает окно с советами для первых трех уровней
     */
    showTipsWindow() {
        if (this.scene.currentLevel > 3) return;
        
        const language = localStorage.getItem('language') || 'en';
        const isRussian = language === 'ru';
        
        // Определяем текст сообщения в зависимости от уровня
        let messageText;
        if (this.scene.currentLevel === 1) {
            if (isRussian) {
                messageText = "Для движения - кликните на сектор в АРКЕ перед машиной.\nИли зажмите пальцем в любом свободном месте экрана.\nДоберитесь до портала.";
            } else {
                messageText = "To make the car move - click on the sector in the ARC in front of the car.\nOr hold your finger anywhere on the screen.\nReach the portal.";
            }
        } else if (this.scene.currentLevel === 2) {
            if (isRussian) {
                messageText = "Собирайте ОРАНЖЕВЫЕ ОГНИ, чтобы пополнить запас топлива. \n\nСобирайте СИНИЕ ОГНИ, чтобы получить НИТРО.\n\nСОВЕТ: Двигайтесь быстро, чтобы экономить топливо.";
            } else {
                messageText = "Collect ORANGE LIGHTS to replenish your fuel supply. \n\nCollect BLUE LIGHTS to get NITRO.\n\nTIP: Move fast to save fuel.";
            }
        } else if (this.scene.currentLevel === 3) {
            if (isRussian) {
                messageText = "Это Дроны-перехватчики. Они пытаются не дать вам добраться до портала. Избегайте контакта с ними. \n\nСОВЕТ: Используйте Нитро, для эффектного рывка от них.";
            } else {
                messageText = "These are Interceptor Drones. They are trying to prevent you from reaching the portal. Avoid contact with them. \n\nTIP: Use NITRO to make a fast escape from them.";
            }
        }
        
        // Размеры и отступы для окна
        const windowWidth = this.TIPS_SIZE.w;
        const windowHeight = this.TIPS_SIZE.h;
        const padding = 30;
        
        // Центр экрана
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Создаем контейнер для окна
        this.tipsContainer = this.scene.add.container(centerX, centerY).setDepth(1000);
        
        // Создаем прямоугольник для тени с помощью graphics
        const shadowRect = this.scene.add.graphics();
        shadowRect.fillStyle(0x2b2610, 0.5);
        shadowRect.fillRoundedRect(-windowWidth/2 + 5, -windowHeight/2 + 5, windowWidth, windowHeight, 20);

        // Создаем фон: простой скругленный прямоугольник с заливкой
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xad9463, 1); // Цветrgb(143, 134, 105)
        bg.fillRoundedRect(-windowWidth / 2, -windowHeight / 2, windowWidth, windowHeight, 20);
        
        // Создаем рамку (прямоугольник с прозрачным центром)
        const borderRect = this.scene.add.graphics();
        borderRect.lineStyle(3, 0x2b2610, 1);
        // Рисуем скругленный прямоугольник
        borderRect.strokeRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 20);
        
        // Создаем текст сообщения
        let textStyle = {
            font: '22px Lilita One',
            fill: '#fffabd',
            align: 'left',
            wordWrap: { width: windowWidth - padding * 2 },
            stroke: '#372f21',
            strokeThickness: 1,
            shadow: {
                offsetX: 1,
                offsetY: 2,
                color: '#4e4a30',
                fill: true
            }
        };
        
        // Если это первый уровень, то особый форматированный текст
        let messageTextObj;
        if (this.scene.currentLevel === 1) {
            // Создаем контейнер для изображения и текста
            const tipContainer = this.scene.add.container(0, -windowHeight/2 + padding*2);
            
            // Добавляем изображение
            const tipImage = this.scene.add.image(0, 70, 'tip_1')
                .setOrigin(0.5, 0)
                .setScale(0.6);
                
            // Создаем текст сообщения ниже изображения
            const tipText = this.scene.add.text(0, -40, messageText, textStyle)
                .setOrigin(0.5, 0);
                
            // Добавляем все элементы в контейнер
            tipContainer.add([tipImage, tipText]);
            
            messageTextObj = tipContainer;
        } else if (this.scene.currentLevel === 2) {
            // Создаем контейнер для текста и спрайтов
            const headerContainer = this.scene.add.container(0, -windowHeight/2 + padding*2 + 30);
            
            // Создаем спрайты
            const fuelSprite = this.scene.add.image(-30, -10, FUEL_PICKUP_KEY)
                .setScale(1.5)
                .setOrigin(0.5, 0.5);
                
            const nitroSprite = this.scene.add.image(30, -10, NITRO_PICKUP_KEY)
                .setScale(1.5)
                .setOrigin(0.5, 0.5);
            
            // Создаем текст
            const headerText = this.scene.add.text(0, 40, messageText, textStyle)
                .setOrigin(0.5, 0);
            
            // Добавляем все элементы в контейнер
            headerContainer.add([fuelSprite, nitroSprite, headerText]);
            
            messageTextObj = headerContainer;

        } else if (this.scene.currentLevel === 3) {
            // Создаем контейнер для текста и спрайта дрона
            const headerContainer = this.scene.add.container(0, -windowHeight/2 + padding*2 + 30);
            
            // Создаем тень для дрона
            const droneShadowSprite = this.scene.add.image(10, 20, DRONE_KEY) // Смещение 6 вправо, 10 вниз
                .setScale(1)
                .setOrigin(0.5, 0.5)
                .setTint(0x000000) // Черный цвет
                .setAlpha(0.3);    // Полупрозрачность

            // Создаем спрайт дрона
            const droneSprite = this.scene.add.image(0, -10, DRONE_KEY)
                .setScale(1)
                .setOrigin(0.5, 0.5);
            
            // Создаем текст
            const headerText = this.scene.add.text(0, 60, messageText, textStyle)
                .setOrigin(0.5, 0);
            
            // Добавляем все элементы в контейнер
            headerContainer.add([droneShadowSprite, droneSprite, headerText]);
            
            messageTextObj = headerContainer;
        }
        
        // Создаем кнопку OK
        this.okButtonContainer = this.scene.add.container(0, windowHeight/2 - padding*2.5);
        const okButtonBg = this.scene.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });
            
        const okButtonText = this.scene.add.text(0, -3, "OK", {
            font: '32px Lilita One',
            fill: '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        this.okButtonContainer.add([okButtonBg, okButtonText]);
        
        // Добавляем все элементы в контейнер советов
        this.tipsContainer.add([shadowRect, bg, borderRect, messageTextObj, this.okButtonContainer]);
        
        // Настраиваем адаптивное изменение размера
        this.resizeTipsWindow();
        this.scene.scale.on('resize', this.resizeTipsWindow, this);
        
        // Добавляем элементы в игнор игровой камеры
        this.scene.cameras.main.ignore(this.tipsContainer);
        
        // Добавляем обработчик нажатия на кнопку
        okButtonBg.on('pointerdown', () => {
            // Отключаем обработчик resize для окна советов
            this.scene.scale.off('resize', this.resizeTipsWindow, this);
            
            this.tipsContainer.destroy();
            this.tipsContainer = null;
            this.okButtonContainer = null;
        });
        
        okButtonBg.on('pointerover', () => {
            okButtonBg.setTint(0xf7cf79);
            okButtonText.setTint(0xf7cf79);
        });
        
        okButtonBg.on('pointerout', () => {
            okButtonBg.clearTint();
            okButtonText.clearTint();
        });
        

    }

    /**
     * Показывает эффект вспышки и текст при подборе топлива
     * @param {number} amount - количество полученного топлива
     * @param {object} position - позиция для отображения {x, y}
     */
    showFuelPickupEffect(amount, position) {
        // Создаем эффект вспышки под машиной
        const flash = this.scene.add.circle(position.x, position.y, 20, 0xffa200, 0.7); //НИКОГДА НЕ ТРОГАЙ ЭТОТ КОД!
        this.scene.uiCamera.ignore(flash);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Создаем текст с количеством полученного топлива
        const fuelText = this.scene.add.text(
            position.x, 
            position.y - 50, 
            `+${amount}`, 
            { 
                fontFamily: 'Lilita One', 
                fontSize: 20, 
                color: '#fffabd', 
                stroke: '#b15e38', 
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 4,
                    color: '#b15e38',
                    fill: true
                }
            }
        ).setOrigin(0.5, 0.5).setDepth(100);

        // Создаем иконку топлива
        const fuelIcon = this.scene.add.image(
            position.x + 22,
            position.y - 50,
            FUEL_PICKUP_KEY
        ).setScale(0.75) 
         .setOrigin(0.5, 0.5)
         .setDepth(100);

        // Добавляем в игнор UI камеры
        this.scene.uiCamera.ignore(fuelText);
        this.scene.uiCamera.ignore(fuelIcon);

        // Анимация для текста и иконки
        this.scene.tweens.add({
            targets: [fuelText, fuelIcon],
            y: '-=30',
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                fuelText.destroy();
                fuelIcon.destroy();
            }
        });
    }

    /**
     * Показывает эффект вспышки и текст при подборе нитро
     * @param {object} position - позиция для отображения {x, y}
     */
    showNitroPickupEffect(position) {
        const flash = this.scene.add.circle(position.x, position.y, GRID_CELL_SIZE * 0.6, COLOR_NITRO, 0.7);
        this.scene.uiCamera.ignore(flash);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // Получаем выбранный язык
        const language = localStorage.getItem('language') || 'en';
        
        const nitroText = this.scene.add.text(
            position.x, 
            position.y - 50, 
            language === 'ru' ? "НИТРО ГОТОВО!" : "NITRO READY!", 
            { 
                fontFamily: 'Lilita One', 
                fontSize: 20, 
                color: '#00ffff', 
                stroke: '#375667', 
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 4,
                    color: '#375667',
                    fill: true
                }
            }
        ).setOrigin(0.5, 0.5).setDepth(100);
        
        this.scene.uiCamera.ignore(nitroText);
        
        this.scene.tweens.add({
            targets: nitroText,
            y: nitroText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => nitroText.destroy()
        });
    }

    /**
     * Показывает эффект при попадании в болото
     * @param {object} position - позиция для отображения {x, y}
     */
    showSwampEffect(position) {
        // Создаем эффект вспышки под машиной
        const flash = this.scene.add.circle(position.x, position.y, GRID_CELL_SIZE * 0.6, BIOME_GRASS_COLOR, 0.7);
        this.scene.uiCamera.ignore(flash);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // Создаем только иконку клея
        const glueIcon = this.scene.add.image(
            position.x, 
            position.y - 50,
            'glue'
        ).setScale(0.75) 
         .setOrigin(0.5, 0.5)
         .setDepth(100);
         
        // Добавляем в игнор UI камеры
        this.scene.uiCamera.ignore(glueIcon);
        
        // Анимация для иконки
        this.scene.tweens.add({
            targets: glueIcon,
            y: '-=30',
            alpha: 0,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                glueIcon.destroy();
            }
        });
    }

    /**
     * Обновляет положение и видимость стрелки портала
     */
    updatePortalArrow() {
        if (!this.portalArrow || !this.scene.cube || !this.scene.cube.active) {
            if (this.portalArrow) this.portalArrow.setVisible(false);
            return;
        }
        
        const camera = this.scene.cameras.main;
        const inCameraView = camera.worldView.contains(this.scene.cube.x, this.scene.cube.y);

        if (inCameraView) {
            this.portalArrow.setVisible(false);
        } else {
            this.portalArrow.setVisible(true);

            const screenCenterX = camera.width / 2;
            const screenCenterY = camera.height / 2;

            const portalWorldPos = new Phaser.Math.Vector2(this.scene.cube.x, this.scene.cube.y);
            const carWorldPos = new Phaser.Math.Vector2(this.scene.car.x, this.scene.car.y);
            const angleRad = Phaser.Math.Angle.Between(carWorldPos.x, carWorldPos.y, portalWorldPos.x, portalWorldPos.y);

            const margin = 50;
            const radius = Math.min(camera.width, camera.height) / 2 - margin;

            const arrowScreenX = screenCenterX + Math.cos(angleRad) * radius;
            const arrowScreenY = screenCenterY + Math.sin(angleRad) * radius;

            this.portalArrow.setPosition(arrowScreenX, arrowScreenY);
            const angleDeg = Phaser.Math.RadToDeg(angleRad) - 90;
            this.portalArrow.setAngle(angleDeg);
        }
    }

    /**
     * Показывает экран завершения уровня
     */
    showLevelComplete() {
        // Получаем выбранный язык
        const language = localStorage.getItem('language') || 'en';
        
        this.winText.setVisible(true);
        
        if (this.scene.currentLevel >= TOTAL_LEVELS) {
            this.winText.setText(language === 'ru' ? 'ПОБЕДА!' : 'YOU WIN!')
                .setStyle({ 
                    font: '50px Lilita One', 
                    fill: '#fffabd', 
                    stroke: '#375667', 
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 2,
                        offsetY: 4,
                        color: '#375667',
                        fill: true
                    }
                })
                .setVisible(true);
            
            this.playAgainButton.setVisible(true);
            if (this.nextLevelButton) this.nextLevelButton.setVisible(false);
        } else {
            this.winText.setText(language === 'ru' ? 'УРОВЕНЬ ПРОЙДЕН!' : 'LEVEL COMPLETE!')
                .setStyle({ 
                    font: '34px Lilita One', 
                    fill: '#fffabd', 
                    stroke: '#375667', 
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 2,
                        offsetY: 4,
                        color: '#375667',
                        fill: true
                    }
                })
                .setVisible(true);
            
            if (this.nextLevelButton) this.nextLevelButton.setVisible(true);
            this.playAgainButton.setVisible(false);
        }
    }

    /**
     * Показывает экран проигрыша
     * @param {string} message - сообщение о причине проигрыша
     */
    showGameOver(message) {
        // Получаем выбранный язык
        const language = localStorage.getItem('language') || 'en';
        
        // Переводим сообщения
        let translatedMessage = message;
        if (language === 'ru') {
            switch (message) {
                case 'OUT OF FUEL!':
                    translatedMessage = 'НЕТ ТОПЛИВА!';
                    break;
                case 'CRASHED!':
                    translatedMessage = 'СТОЛКНОВЕНИЕ!';
                    break;
                case 'INTERCEPTED!':
                    translatedMessage = 'ПЕРЕХВАЧЕН!';
                    break;
            }
        }

        this.restartLevelText.setText(translatedMessage)
            .setStyle({ 
                font: '40px Lilita One', 
                fill: '#fffabd', 
                stroke: '#375667', 
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 4,
                    color: '#375667',
                    fill: true
                }
            })
            .setVisible(true);
            
        if (message === 'OUT OF FUEL!') {
            const fuelFlashColorHex = 0xffa200;
            
            const flashRect = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                fuelFlashColorHex,
                0.7
            ).setScrollFactor(0).setDepth(1000);
            
            if (this.scene.uiCamera) this.scene.uiCamera.ignore(flashRect);
            
            this.scene.tweens.add({
                targets: flashRect,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => flashRect.destroy()
            });
        } else {
            if (this.scene.cameras.main) {
                this.scene.cameras.main.flash(FLASH_DURATION, FLASH_COLOR);
                this.scene.cameras.main.shake(SHAKE_DURATION, SHAKE_INTENSITY);
            }
        }
    }

    resizeTipsWindow(gameSize = this.scene.scale) {
        if (!this.tipsContainer) return; // окна может не быть
        const currentWidth = gameSize.width; // реальные размеры canvas
        const currentHeight = gameSize.height;
        const margin = 5; // оставим небольшую рамку
        const MAX_WIDTH_FOR_TIP_SCALING = 960; // Максимальная ширина экрана, при которой окно советов еще масштабируется

        let scalingWidth = currentWidth;
        let scalingHeight = currentHeight;

        if (currentWidth > MAX_WIDTH_FOR_TIP_SCALING) {
            scalingWidth = MAX_WIDTH_FOR_TIP_SCALING;
            // Корректируем высоту пропорционально, чтобы сохранить соотношение сторон исходного окна gameSize
            // при расчете масштаба для "ограниченной" ширины.
            scalingHeight = currentHeight * (MAX_WIDTH_FOR_TIP_SCALING / currentWidth);
        }

        // максимальное пространство для контента окна советов в рамках scalingWidth/Height
        const maxContentWidth = scalingWidth - margin * 2;
        const maxContentHeight = scalingHeight - margin * 2;

        // коэффициент масштаба
        const k = Math.min(maxContentWidth / this.TIPS_SIZE.w,
                           maxContentHeight / this.TIPS_SIZE.h);

        this.tipsContainer
            .setScale(k)
            .setPosition(currentWidth / 2, currentHeight / 2); // Центрируем на реальном канвасе
    }
}