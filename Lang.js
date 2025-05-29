class LangScene extends Phaser.Scene {
    constructor() {
        super('LangScene');
        this.menuButtons = []; // Массив для хранения контейнеров кнопок меню
        
        // Константы для кнопок
        this.BASE_BUTTON_WIDTH = 264;
        this.BASE_BUTTON_HEIGHT = 78;
        this.BASE_BUTTON_SPACING = 7;
    }

    preload() {
        this.load.image('lang_bg', 'assets/lang_bg.jpg?v=' + GAME_VERSION);
        this.load.image('button', 'assets/button.png?v=' + GAME_VERSION); // Загружаем единую текстуру кнопки
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        // Определяем, является ли устройство мобильным
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const buttonScale = isMobile ? 0.67 : 1;

        // Добавляем фон с центрированием
        this.background = this.add.image(centerX, centerY, 'lang_bg');
        this.background.setOrigin(0.5, 0.5);
        
        // Масштабируем фон так, чтобы безопасная зона 1024x1024 всегда была видна
        const safeZoneSize = GAME_WIDTH;
        const scaleX = gameWidth / safeZoneSize;
        const scaleY = gameHeight / safeZoneSize;
        const scale = Math.min(scaleX, scaleY);
        this.background.setScale(scale);

        // Конфигурация кнопок меню
        const buttonWidth = this.BASE_BUTTON_WIDTH * buttonScale;
        const buttonHeight = this.BASE_BUTTON_HEIGHT * buttonScale;
        const buttonSpacing = this.BASE_BUTTON_SPACING * buttonScale;

        // Определяем кнопки для отображения
        const buttonsData = [
            { text: 'ENGLISH', action: 'setEnglish' },
            { text: 'РУССКИЙ', action: 'setRussian' }
        ];

        // Создаем кнопки меню
        buttonsData.forEach((buttonInfo, index) => {
            const buttonY = centerY + index * (buttonHeight + buttonSpacing) - (gameHeight / 5);
            const container = this.add.container(centerX, buttonY);
            
            // Создаем изображение кнопки
            const button = this.add.image(0, 0, 'button')
                .setOrigin(0.5, 0.5)
                .setScale(buttonScale);
            container.add(button);

            // Добавляем текст на кнопку
            const buttonText = this.add.text(0, -3, buttonInfo.text, {
                font: '32px Lilita One',
                fill: '#23200e',
                align: 'center'
            });
            buttonText.setOrigin(0.5, 0.5);
            buttonText.setScale(buttonScale);
            container.add(buttonText);

            // Создаем невидимую кнопку для обработки кликов
            const hitArea = this.add.rectangle(0, 0, this.BASE_BUTTON_WIDTH, this.BASE_BUTTON_HEIGHT);
            hitArea.setScale(buttonScale);
            hitArea.setOrigin(0.5, 0.5);
            hitArea.setInteractive();
            container.add(hitArea);

            hitArea.on('pointerdown', () => {
                this.handleButtonClick(buttonInfo.action);
            });

            hitArea.on('pointerover', () => { 
                button.setTint(0xf7cf79);
                buttonText.setTint(0xf7cf79);
            });
            hitArea.on('pointerout', () => { 
                button.clearTint();
                buttonText.clearTint();
            });

            this.menuButtons.push(container);
        });

        // Добавляем обработчик изменения размера
        this.scale.on('resize', this.handleResize, this);
        
        // Принудительно вызываем handleResize при создании сцены
        this.handleResize();
    }

    handleResize() {
        if (!this.cameras || !this.cameras.main) {
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;
        const aspectRatio = width / height;

        // Определяем, является ли устройство мобильным
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const buttonScale = isMobile ? 0.67 : 1;

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
            const safeZoneSize = GAME_WIDTH;
            const scaleX = newWidth / safeZoneSize;
            const scaleY = newHeight / safeZoneSize;
            const scale = Math.min(scaleX, scaleY);
            this.background.setScale(scale);
        }

        // Обновляем позиции кнопок
        const buttonHeight = this.BASE_BUTTON_HEIGHT * buttonScale;
        const buttonSpacing = this.BASE_BUTTON_SPACING * buttonScale;
        this.menuButtons.forEach((button, index) => {
            const buttonY = centerY + index * (buttonHeight + buttonSpacing) - (newHeight / 20) + 20;
            button.setPosition(centerX, buttonY);
        });
    }

    handleButtonClick(action) {
        switch (action) {
            case 'setEnglish':
                localStorage.setItem('language', 'en');
                // Применяем язык к экрану загрузки, если функция определена
                if (typeof updateLoadingScreenLanguage === 'function') {
                    updateLoadingScreenLanguage();
                }
                this.scene.start('MainMenuScene');
                break;
            case 'setRussian':
                localStorage.setItem('language', 'ru');
                // Применяем язык к экрану загрузки, если функция определена
                if (typeof updateLoadingScreenLanguage === 'function') {
                    updateLoadingScreenLanguage();
                }
                this.scene.start('MainMenuScene');
                break;
            default:
                console.warn(`Неизвестное действие кнопки: ${action}`);
        }
    }

    update() {
    }
} 