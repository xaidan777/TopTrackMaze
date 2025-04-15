class MainMenuScene extends Phaser.Scene {

    constructor() {
        super('MainMenuScene');
        this.howtoImage = null;
        this.closeButton = null;
        this.menuButtons = []; // Массив для хранения контейнеров кнопок меню
    }

    preload() {
        this.load.image('packshot', 'assets/MainBG.jpg?v=__GIT_HASH__'); // Замени на путь к твоему пэкшоту
        this.load.image('STARTGAME', 'assets/STARTGAME.png?v=__GIT_HASH__');
        this.load.image('HOW', 'assets/HOW.png?v=__GIT_HASH__');
        this.load.image('CREATOR', 'assets/CREATOR.png?v=__GIT_HASH__');
        this.load.image('howtoplay', 'assets/howtoplay.png?v=__GIT_HASH__'); // Картинка "Как играть" (728x728)
        this.load.image('close', 'assets/close.png?v=__GIT_HASH__'); // Кнопка "Закрыть"
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        // Добавляем пэкшот (фон) с центрированием
        this.background = this.add.image(centerX, centerY, 'packshot');
        this.background.setOrigin(0.5, 0.5);
        
        // Масштабируем фон так, чтобы безопасная зона 1024x1024 всегда была видна
        const safeZoneSize = 1024;
        const scaleX = gameWidth / safeZoneSize;
        const scaleY = gameHeight / safeZoneSize;
        const scale = Math.min(scaleX, scaleY); // Используем минимальный масштаб
        this.background.setScale(scale);

        // --- Конфигурация кнопок меню ---
        const buttonWidth = 338;
        const buttonHeight = 100;
        const buttonSpacing = 20;
        const shadowOffsetX = 0;
        const shadowOffsetY = 5;
        const shadowColor = 0x2f1c00;
        const shadowAlpha = 0.5;
        const fadeInDuration = 200;
        const startDelay = 200;

        const buttonsData = [
            { key: 'STARTGAME', action: 'startGame' },
            { key: 'HOW', action: 'showHowToPlay' },
            { key: 'CREATOR', action: 'openCreatorLink' }
        ];

        // Очищаем массив кнопок перед созданием новых
        this.menuButtons = [];

        // --- Создаем кнопки меню ---
        buttonsData.forEach((buttonInfo, index) => {
            // Вычисляем позицию кнопки относительно центра экрана
            // STARTGAME в центре, остальные под ней
            const buttonY = centerY + index * (buttonHeight + buttonSpacing);
            const container = this.add.container(centerX, buttonY);
            container.setSize(buttonWidth, buttonHeight);
            container.setAlpha(0);

            // 1. Создаем изображение для тени
            const shadowImage = this.add.image(
                shadowOffsetX,
                shadowOffsetY,
                buttonInfo.key
            );
            shadowImage.setOrigin(0.5, 0.5);
            shadowImage.setTintFill(shadowColor);
            shadowImage.setAlpha(shadowAlpha);
            container.add(shadowImage);

            const button = this.add.image(0, 0, buttonInfo.key).setOrigin(0.5, 0.5);
            container.add(button);

            container.setInteractive();

            container.on('pointerdown', () => {
                this.handleButtonClick(buttonInfo.action);
            });

            container.on('pointerover', () => { button.setTint(0xf7cf79); });
            container.on('pointerout', () => { button.clearTint(); });

            this.menuButtons.push(container);

            this.tweens.add({
                targets: container,
                alpha: 1,
                duration: fadeInDuration,
                ease: 'Linear',
                delay: startDelay + index * fadeInDuration
            });
        });

        // --- Создаем окно "Как играть" ---
        this.howtoImage = this.add.image(centerX, centerY, 'howtoplay');
        this.howtoImage.setOrigin(0.5, 0.5);
        this.howtoImage.setVisible(false);
        this.howtoImage.setDepth(10);

        // Кнопка "Закрыть" для окна "Как играть"
        const closeButtonX = this.howtoImage.x + this.howtoImage.displayWidth / 2 - 30;
        const closeButtonY = this.howtoImage.y - this.howtoImage.displayHeight / 2 + 30;
        this.closeButton = this.add.image(closeButtonX, closeButtonY, 'close');
        this.closeButton.setOrigin(0.5, 0.5);
        this.closeButton.setVisible(false);
        this.closeButton.setDepth(11);
        this.closeButton.setInteractive();

        // Добавляем обработчик изменения размера после создания всех элементов
        this.scale.on('resize', this.handleResize, this);
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

        // Обновляем позиции элементов меню
        const centerX = newWidth / 2;
        const centerY = newHeight / 2;

        // Обновляем позицию и масштаб фона
        if (this.background) {
            this.background.setPosition(centerX, centerY);
            const safeZoneSize = 1024;
            const scaleX = newWidth / safeZoneSize;
            const scaleY = newHeight / safeZoneSize;
            const scale = Math.min(scaleX, scaleY); // Используем минимальный масштаб
            this.background.setScale(scale);
        }

        // Обновляем позиции кнопок
        const buttonHeight = 100;
        const buttonSpacing = 20;
        this.menuButtons.forEach((button, index) => {
            const buttonY = centerY + index * (buttonHeight + buttonSpacing);
            button.setPosition(centerX, buttonY);
        });

        // Обновляем позицию окна "Как играть"
        if (this.howtoImage) {
            this.howtoImage.setPosition(centerX, centerY);
        }

        // Обновляем позицию кнопки закрытия
        if (this.closeButton && this.howtoImage) {
            this.closeButton.setPosition(
                centerX + this.howtoImage.displayWidth / 2 - 30,
                centerY - this.howtoImage.displayHeight / 2 + 30
            );
        }
    }

    // --- Методы для обработки действий кнопок ---

    handleButtonClick(action) {
        console.log(`Выполняется действие: ${action}`);
        switch (action) {
            case 'startGame':
                // Проверяем наличие сцены перед запуском
                if (this.scene.get('GameScene')) {
                    this.scene.start('GameScene');
                } else {
                     console.warn("Сцена 'GameScene' не найдена!");
                }
                break;
            case 'showHowToPlay':
                this.showHowToPlayWindow();
                break;
            case 'openCreatorLink':
                const url = 'https://t.me/tearevo';
                if (window) {
                    window.open(url, '_blank');
                } else {
                    console.warn('Не удалось открыть ссылку: объект window не доступен.');
                }
                break;
            default:
                console.warn(`Неизвестное действие кнопки: ${action}`);
        }
    }

    showHowToPlayWindow() {
        if (this.howtoImage && this.closeButton) {
            // Показываем окно и кнопку закрытия
            this.howtoImage.setVisible(true);
            this.closeButton.setVisible(true).setInteractive(); // Делаем кнопку снова интерактивной

            // Делаем кнопки меню неактивными и полупрозрачными
            this.menuButtons.forEach(buttonContainer => {
                buttonContainer.disableInteractive(); // Отключаем кликабельность
                buttonContainer.setAlpha(0.5); // Делаем полупрозрачными для визуального отличия
            });
        }
    }

    hideHowToPlayWindow() {
        if (this.howtoImage && this.closeButton) {
            // Скрываем окно и кнопку закрытия
            this.howtoImage.setVisible(false);
            this.closeButton.setVisible(false).disableInteractive(); // Снова отключаем

            // Возвращаем кнопкам меню активность и нормальную прозрачность
            this.menuButtons.forEach(buttonContainer => {
                buttonContainer.setInteractive(); // Включаем кликабельность
                buttonContainer.setAlpha(1); // Возвращаем нормальную прозрачность
            });
        }
    }

    update() {
    }
}