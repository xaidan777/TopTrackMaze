class MainMenuScene extends Phaser.Scene {

    constructor() {
        super('MainMenuScene');
        this.howtoImage = null;
        this.closeButton = null;
        this.menuButtons = []; // Массив для хранения контейнеров кнопок меню
    }

    preload() {
        this.load.image('packshot', 'assets/MainBG.jpg'); // Замени на путь к твоему пэкшоту
        this.load.image('STARTGAME', 'assets/STARTGAME.png');
        this.load.image('HOW', 'assets/HOW.png');
        this.load.image('CREATOR', 'assets/CREATOR.png');
        this.load.image('howtoplay', 'assets/howtoplay.png'); // Картинка "Как играть" (728x728)
        this.load.image('close', 'assets/close.png'); // Кнопка "Закрыть"
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2; // Центр по Y для окна "Как играть"

        // Добавляем пэкшот (фон)
        this.add.image(centerX, centerY, 'packshot');

        // --- Конфигурация кнопок меню ---
        const buttonStartY = 410;
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
            const currentButtonY = buttonStartY + index * (buttonHeight + buttonSpacing);
            const container = this.add.container(centerX, currentButtonY);
            container.setSize(buttonWidth, buttonHeight);
            container.setAlpha(0);

            // 1. Создаем изображение для тени, используя ту же картинку кнопки
            const shadowImage = this.add.image(
                shadowOffsetX,  // Смещаем тень как и раньше
                shadowOffsetY,
                buttonInfo.key  // Используем ключ картинки кнопки
            );
            shadowImage.setOrigin(0.5, 0.5); // Ставим точку привязки в центр
            shadowImage.setTintFill(shadowColor); // Закрашивает непрозрачные пиксели цветом 0x2f1c00
            shadowImage.setAlpha(shadowAlpha);    // Устанавливает прозрачность 50%
            container.add(shadowImage);

            const button = this.add.image(0, 0, buttonInfo.key).setOrigin(0.5, 0.5);
            container.add(button); // Добавляем основную кнопку поверх тени

            container.setInteractive();

            container.on('pointerdown', () => {
                this.handleButtonClick(buttonInfo.action);
            });

            container.on('pointerover', () => { button.setTint(0xf7cf79); }); // Эффект наведения на основную кнопку
            container.on('pointerout', () => { button.clearTint(); });

            this.menuButtons.push(container);

            this.tweens.add({
                targets: container,
                alpha: 1,
                duration: fadeInDuration,
                ease: 'Linear',
                delay: startDelay + index * fadeInDuration
            });
        }); // Конец forEach

        // --- Создаем окно "Как играть" (изначально невидимое) ---
        this.howtoImage = this.add.image(centerX, centerY, 'howtoplay');
        this.howtoImage.setOrigin(0.5, 0.5); // Центрируем
        this.howtoImage.setVisible(false); // Скрыто по умолчанию
        this.howtoImage.setDepth(10); // Устанавливаем глубину, чтобы было поверх кнопок меню

        // Кнопка "Закрыть" для окна "Как играть"
        const closeButtonX = this.howtoImage.x + this.howtoImage.displayWidth / 2 - 30; // Небольшой отступ от края
        const closeButtonY = this.howtoImage.y - this.howtoImage.displayHeight / 2 + 30; // Небольшой отступ от края
        this.closeButton = this.add.image(closeButtonX, closeButtonY, 'close');
        this.closeButton.setOrigin(0.5, 0.5);
        this.closeButton.setVisible(false); // Скрыто по умолчанию
        this.closeButton.setDepth(11); // Поверх картинки howto
        this.closeButton.setInteractive(); // Делаем кликабельной

        // Действие при клике на кнопку "Закрыть"
        this.closeButton.on('pointerdown', () => {
            this.hideHowToPlayWindow();
        });
        // Добавляем эффекты наведения и для кнопки закрытия
         this.closeButton.on('pointerover', () => { this.closeButton.setAlpha(0.7); });
         this.closeButton.on('pointerout', () => { this.closeButton.setAlpha(1); });

    } // Конец метода create

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