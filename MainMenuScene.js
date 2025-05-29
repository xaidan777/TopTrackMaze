class MainMenuScene extends Phaser.Scene {

    constructor() {
        super('MainMenuScene');
        this.menuButtons = []; // Массив для хранения контейнеров кнопок меню
        this.menuMusic = null; // Добавляем переменную для хранения музыки
        this.settingsContainer = null; // Контейнер для окна настроек
        this.aboutContainer = null; // Контейнер для окна About
        this.soundEnabled = true; // Флаг включения/выключения звука
        
        // Константы для кнопок
        this.BASE_BUTTON_WIDTH = 264;
        this.BASE_BUTTON_HEIGHT = 78;
        this.BASE_BUTTON_SPACING = 7;
        
        // Константы для окна About
        this.ABOUT_SIZE = { w: 640, h: 640 };
    }

    preload() {
        this.load.image('packshot', 'assets/MainBG.jpg?v=' + GAME_VERSION); // Замени на путь к твоему пэкшоту
        this.load.image('button', 'assets/button.png?v=' + GAME_VERSION); // Загружаем единую текстуру кнопки
        this.load.image('close', 'assets/close.png?v=' + GAME_VERSION); // Кнопка "Закрыть"
        this.load.image('checkbox', 'assets/checkbox.png?v=' + GAME_VERSION); // Чекбокс
        this.load.image('checkbox_checked', 'assets/checkbox_checked.png?v=' + GAME_VERSION); // Отмеченный чекбокс
        
        // Загрузка фоновой музыки
        this.load.audio('menu_music', 'assets/sounds/menu_music.mp3');
    }

    create() {
        // Останавливаем все звуки при входе в меню
        this.sound.stopAll();
        
        // Проверяем состояние звука из localStorage
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // По умолчанию включен
        
        // Запускаем фоновую музыку
        this.menuMusic = this.sound.add('menu_music', {
            volume: this.soundEnabled ? 0.3 : 0,
            loop: false
        });
        this.menuMusic.play();

        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        // Определяем, является ли устройство мобильным
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let buttonScale = isMobile ? 0.67 : 1;
        
        // Дополнительное масштабирование кнопок при малой высоте окна
        if (gameHeight < 600) {
            const heightScale = gameHeight / 600; // коэффициент уменьшения от высоты
            buttonScale *= heightScale;
        }

        // Добавляем пэкшот (фон) с центрированием
        this.background = this.add.image(centerX, centerY, 'packshot');
        this.background.setOrigin(0.5, 0.5);
        
        // Масштабируем фон так, чтобы безопасная зона 1024x1024 всегда была видна
        const safeZoneSize = GAME_WIDTH; // Используем константу безопасной зоны
        const scaleX = gameWidth / safeZoneSize;
        const scaleY = gameHeight / safeZoneSize;
        const scale = Math.min(scaleX, scaleY); // Убираем ограничение в 1
        this.background.setScale(scale);

        // --- Конфигурация кнопок меню ---
        const buttonWidth = this.BASE_BUTTON_WIDTH * buttonScale;
        const buttonHeight = this.BASE_BUTTON_HEIGHT * buttonScale;
        const buttonSpacing = this.BASE_BUTTON_SPACING * buttonScale;
        const shadowOffsetX = 0;
        const shadowOffsetY = 0 * buttonScale; // Масштабируем и смещение тени
        const shadowColor = 0x2f1c00;
        const shadowAlpha = 0;
        const fadeInDuration = 200;
        const startDelay = 200;

        // Проверяем сохраненный прогресс
        const savedProgress = localStorage.getItem('gameProgress');
        let currentLevel = 1;
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            currentLevel = progress.currentLevel || 1;
        }

        // Получаем выбранный язык
        const language = localStorage.getItem('language') || 'en';

        // Словарь с текстами кнопок
        const buttonTexts = {
            startGame: language === 'ru' ? 'НОВАЯ ИГРА' : 'NEW GAME',
            resumeGame: language === 'ru' ? 'ПРОДОЛЖИТЬ' : 'RESUME GAME',
            settings: language === 'ru' ? 'НАСТРОЙКИ' : 'SETTINGS',
            creator: language === 'ru' ? 'ОБ АВТОРЕ' : 'ABOUT'
        };

        // Определяем, какие кнопки показывать
        const buttonsData = [
            { text: buttonTexts.startGame, action: 'startGame' },
            { text: buttonTexts.settings, action: 'showSettings' },
            { text: buttonTexts.creator, action: 'openCreatorLink' }
        ];

        // Добавляем кнопку RESUME только если уровень больше 1
        if (currentLevel > 1) {
            buttonsData.unshift({ text: buttonTexts.resumeGame, action: 'resumeGame' });
        }

        // Очищаем массив кнопок перед созданием новых
        this.menuButtons = [];

        // --- Создаем кнопки меню ---
        buttonsData.forEach((buttonInfo, index) => {
            // Вычисляем позицию кнопки относительно центра экрана
            const buttonY = centerY + index * (buttonHeight + buttonSpacing) - (gameHeight / 5) + 20;
            const container = this.add.container(centerX, buttonY);
            
            // 1. Создаем изображение для тени
            const shadowImage = this.add.image(
                shadowOffsetX,
                shadowOffsetY,
                'button'
            );
            shadowImage.setOrigin(0.5, 0.5);
            shadowImage.setTintFill(shadowColor);
            shadowImage.setAlpha(shadowAlpha);
            shadowImage.setScale(buttonScale);
            container.add(shadowImage);

            // 2. Создаем изображение кнопки
            const button = this.add.image(0, 0, 'button')
                .setOrigin(0.5, 0.5)
                .setScale(buttonScale);
            container.add(button);

            // 3. Добавляем текст на кнопку
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

            container.setAlpha(0);
            this.menuButtons.push(container);

            this.tweens.add({
                targets: container,
                alpha: 1,
                duration: fadeInDuration,
                ease: 'Linear',
                delay: startDelay + index * fadeInDuration
            });
        });

        // Добавляем обработчик изменения размера после создания всех элементов
        this.scale.on('resize', this.handleResize, this);
        
        // Принудительно вызываем handleResize при создании сцены, чтобы гарантировать правильное масштабирование
        this.handleResize();
        // Дополнительный вызов handleResize с задержкой в 1 кадр для надежности
        this.time.delayedCall(1, this.handleResize, [], this);

        // Добавляем задержку для корректного масштабирования окна
        setTimeout(() => {
            this.scale.resize(window.innerWidth, window.innerHeight);
        }, 100);
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
        let buttonScale = isMobile ? 0.67 : 1;
        
        // Дополнительное масштабирование кнопок при малой высоте окна
        if (height < 600) {
            const heightScale = height / 600; // коэффициент уменьшения от высоты
            buttonScale *= heightScale;
        }

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
            const safeZoneSize = GAME_WIDTH; // Используем константу безопасной зоны
            const scaleX = newWidth / safeZoneSize;
            const scaleY = newHeight / safeZoneSize;
            const scale = Math.min(scaleX, scaleY); // Убираем ограничение в 1
            this.background.setScale(scale*1.25);
        }

        // Обновляем позиции кнопок
        const buttonHeight = this.BASE_BUTTON_HEIGHT * buttonScale;
        const buttonSpacing = this.BASE_BUTTON_SPACING * buttonScale;
        this.menuButtons.forEach((button, index) => {
            const buttonY = centerY + index * (buttonHeight + buttonSpacing) - (newHeight / 20) + 20 + 20;
            button.setPosition(centerX, buttonY);
            
            // Обновляем масштаб всех элементов кнопки
            button.list.forEach(child => {
                if (child.setScale) {
                    if (child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text) {
                        child.setScale(buttonScale);
                    } else if (child instanceof Phaser.GameObjects.Rectangle) {
                        // Для hitArea (невидимой области клика)
                        child.setScale(buttonScale);
                    }
                }
            });
        });

        // Обновляем позицию окна настроек
        if (this.settingsContainer && this.settingsContainer.visible) {
            this.settingsContainer.setPosition(centerX, centerY);
        }
        
        // Обновляем позицию окна About
        if (this.aboutContainer && this.aboutContainer.visible) {
            this.aboutContainer.setPosition(centerX, centerY);
        }
    }

    // --- Методы для обработки действий кнопок ---

    handleButtonClick(action) {
        console.log(`Выполняется действие: ${action}`);
        switch (action) {
            case 'startGame':
                // Останавливаем музыку перед началом игры
                if (this.menuMusic) {
                    this.menuMusic.stop();
                }
                // Очищаем сохраненный прогресс при начале новой игры
                localStorage.removeItem('gameProgress');
                console.log('Сохраненный прогресс очищен');
                // Проверяем наличие сцены перед запуском
                if (this.scene.get('GameScene')) {
                    this.scene.start('GameScene');
                } else {
                     console.warn("Сцена 'GameScene' не найдена!");
                }
                break;
            case 'resumeGame':
                // Останавливаем музыку перед возобновлением игры
                if (this.menuMusic) {
                    this.menuMusic.stop();
                }
                // Проверяем наличие сохраненного прогресса
                const savedProgress = localStorage.getItem('gameProgress');
                if (savedProgress) {
                    if (this.scene.get('GameScene')) {
                        this.scene.start('GameScene');
                    } else {
                        console.warn("Сцена 'GameScene' не найдена!");
                    }
                } else {
                    console.log('Нет сохраненного прогресса');
                    // Если нет сохраненного прогресса, начинаем новую игру
                    if (this.scene.get('GameScene')) {
                        this.scene.start('GameScene');
                    }
                }
                break;
            case 'showSettings':
                this.showSettingsWindow();
                break;
            case 'openCreatorLink':
                this.showAboutWindow();
                break;
            default:
                console.warn(`Неизвестное действие кнопки: ${action}`);
        }
    }

    showAboutWindow() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // Получаем текущий язык
        const language = localStorage.getItem('language') || 'en';
        
        // Размеры окна
        const windowWidth = 450;
        const windowHeight = 600;
        const padding = 30;
        
        // Создаем контейнер для окна
        this.aboutContainer = this.add.container(centerX, centerY).setDepth(1000);
        
        // Создаем тень
        const shadowRect = this.add.graphics();
        shadowRect.fillStyle(0x2b2610, 0.5);
        shadowRect.fillRoundedRect(-windowWidth/2 + 5, -windowHeight/2 + 5, windowWidth, windowHeight, 20);
        
        // Создаем фон
        const bg = this.add.graphics();
        bg.fillStyle(0xad9463, 1);
        bg.fillRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 20);
        
        // Создаем рамку
        const borderRect = this.add.graphics();
        borderRect.lineStyle(3, 0x2b2610, 1);
        borderRect.strokeRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 20);
        
        // Заголовок окна
        const titleText = this.add.text(0, -windowHeight/2 + padding, language === 'ru' ? 'ОБ АВТОРЕ' : 'ABOUT', {
            font: '32px Lilita One',
            fill: '#fffabd',
            align: 'center',
            stroke: '#372f21',
            strokeThickness: 2,
            shadow: {
                offsetX: 1,
                offsetY: 2,
                color: '#4e4a30',
                fill: true
            }
        }).setOrigin(0.5, 0);
        
        // Текст сообщения
        const messageText = language === 'ru' ? 
        'Привет!\n\nЯ Антон Чуев (TEAREVO), и это моя первая игра.\n\nArcfade — экспериментальный проект. Я не разработчик и не написал здесь ни строчки кода — всё сделали нейросети по моим идеям.\n\nЕсли игра зайдёт, пишите отзывы и ставьте оценки — я реально всё читаю!' : 
        'Hi!\n\nMy name is Anton Chuev (TEAREVO), and this is my first game.\n\nArcfade is an experimental project. I am not a developer and did not write a single line of code here—all was generated by AI based on my ideas.\n\nIf you enjoy the game, please leave feedback and ratings—I genuinely read every comment!';

        const aboutText = this.add.text(0, -windowHeight/2 + padding + 50, messageText, {
        font: '21px Lilita One',
        fill: '#fffabd',
        align: 'left',
        wordWrap: { width: windowWidth - padding * 2 - 20 },
        lineSpacing: 4,
        stroke: '#372f21',
        strokeThickness: 1
        }).setOrigin(0.5, 0);
        
        // Кнопка OK
        const okButtonContainer = this.add.container(0, windowHeight/2 - padding*2);
        const okButtonBg = this.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });
            
        const okButtonText = this.add.text(0, -3, "OK", {
            font: '32px Lilita One',
            fill: '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        okButtonContainer.add([okButtonBg, okButtonText]);
        
        // Обработчик для кнопки OK
        okButtonBg.on('pointerdown', () => {
            this.hideAboutWindow();
        });
        
        okButtonBg.on('pointerover', () => {
            okButtonBg.setTint(0xf7cf79);
            okButtonText.setTint(0xf7cf79);
        });
        
        okButtonBg.on('pointerout', () => {
            okButtonBg.clearTint();
            okButtonText.clearTint();
        });
        
        // Добавляем все элементы в контейнер
        this.aboutContainer.add([
            shadowRect, bg, borderRect, titleText,
            aboutText, okButtonContainer
        ]);
        
        // Настраиваем адаптивное изменение размера
        this.resizeAboutWindow();
        this.scale.on('resize', this.resizeAboutWindow, this);
        
        // Делаем кнопки меню неактивными и полупрозрачными
        this.menuButtons.forEach(buttonContainer => {
            // Находим hitArea внутри контейнера
            const hitArea = buttonContainer.list.find(child => child instanceof Phaser.GameObjects.Rectangle && child.input);
            if (hitArea) {
                hitArea.disableInteractive(); // Отключаем интерактивность у hitArea
            }
            buttonContainer.setAlpha(0.5); // Делаем полупрозрачными для визуального отличия
        });
    }
    
    hideAboutWindow() {
        if (this.aboutContainer) {
            // Отключаем обработчик resize для окна About
            this.scale.off('resize', this.resizeAboutWindow, this);
            
            // Удаляем контейнер
            this.aboutContainer.destroy();
            this.aboutContainer = null;
            
            // Возвращаем кнопкам меню активность и нормальную прозрачность
            this.menuButtons.forEach(buttonContainer => {
                // Находим hitArea внутри контейнера
                const hitArea = buttonContainer.list.find(child => child instanceof Phaser.GameObjects.Rectangle && child.input);
                if (hitArea) {
                    hitArea.setInteractive(); // Включаем интерактивность у hitArea
                }
                buttonContainer.setAlpha(1); // Возвращаем нормальную прозрачность
            });
        }
    }

    resizeAboutWindow(gameSize = this.scale) {
        if (!this.aboutContainer) return; // окна может не быть
        const { width, height } = gameSize; // реальные размеры canvas
        const margin = 5; // оставим небольшую рамку

        // максимальное, что мы можем себе позволить
        const maxW = width - margin * 2;
        const maxH = height - margin * 2;

        // коэффициент масштаба: не больше 1 (чтоб не растягивать на десктопе)
        const k = Math.min(maxW / this.ABOUT_SIZE.w,
                           maxH / this.ABOUT_SIZE.h, 1);

        this.aboutContainer
            .setScale(k)
            .setPosition(width / 2, height / 2);
    }

    showSettingsWindow() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // Получаем текущие настройки
        const language = localStorage.getItem('language') || 'en';
        const soundEnabled = this.soundEnabled;
        
        // Размеры окна настроек
        const windowWidth = 384;
        const windowHeight = 384;
        const padding = 30;
        
        // Создаем контейнер для окна настроек
        this.settingsContainer = this.add.container(centerX, centerY).setDepth(1000);
        
        // Создаем тень
        const shadowRect = this.add.graphics();
        shadowRect.fillStyle(0x2b2610, 0.5);
        shadowRect.fillRoundedRect(-windowWidth/2 + 5, -windowHeight/2 + 5, windowWidth, windowHeight, 20);
        
        // Создаем фон
        const bg = this.add.graphics();
        bg.fillStyle(0xad9463, 1);
        bg.fillRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 20);
        
        // Создаем рамку
        const borderRect = this.add.graphics();
        borderRect.lineStyle(3, 0x2b2610, 1);
        borderRect.strokeRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 20);
        
        // Заголовок окна настроек
        const titleText = this.add.text(0, -windowHeight/2 + padding, language === 'ru' ? 'НАСТРОЙКИ' : 'SETTINGS', {
            font: '32px Lilita One',
            fill: '#fffabd',
            align: 'center',
            stroke: '#372f21',
            strokeThickness: 2,
            shadow: {
                offsetX: 1,
                offsetY: 2,
                color: '#4e4a30',
                fill: true
            }
        }).setOrigin(0.5, 0);
        
        // --- Блок выбора языка ---
        const languageTitle = this.add.text(0, -70, language === 'ru' ? 'ЯЗЫК:' : 'LANGUAGE:', {
            font: '24px Lilita One',
            fill: '#fffabd',
            align: 'center',
            stroke: '#372f21',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        
        // Кнопка русского языка
        const russianButton = this.add.container(-70, -20);
        const russianBg = this.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });
        const russianText = this.add.text(0, -3, 'Русский', {
            font: '24px Lilita One',
            fill: language === 'ru' ? '#2b2610' : '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        if (language === 'ru') {
            russianBg.setTint(0xf7cf79);
            russianText.setTint(0xf7cf79);
        }
        russianButton.add([russianBg, russianText]);
        
        // Кнопка английского языка
        const englishButton = this.add.container(70, -20);
        const englishBg = this.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });
        const englishText = this.add.text(0, -3, 'English', {
            font: '24px Lilita One',
            fill: language === 'en' ? '#2b2610' : '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        if (language === 'en') {
            englishBg.setTint(0xf7cf79);
            englishText.setTint(0xf7cf79);
        }
        englishButton.add([englishBg, englishText]);
        
        // Обработчики для кнопок языка
        russianBg.on('pointerdown', () => {
            if (this.menuMusic) {
                this.menuMusic.stop();
            }
            localStorage.setItem('language', 'ru');
            this.hideSettingsWindow();
            this.scene.restart();
        });
        
        englishBg.on('pointerdown', () => {
            if (this.menuMusic) {
                this.menuMusic.stop();
            }
            localStorage.setItem('language', 'en');
            this.hideSettingsWindow();
            this.scene.restart();
        });
        
        // --- Блок настройки звука ---
        const soundTitle = this.add.text(0, 20, language === 'ru' ? 'ЗВУК:' : 'SOUND:', {
            font: '24px Lilita One',
            fill: '#fffabd',
            align: 'center',
            stroke: '#372f21',
            strokeThickness: 1
        }).setOrigin(0.5, 0);
        
        // Чекбокс звука
        const soundCheckbox = this.add.image(0, 65, soundEnabled ? 'checkbox_checked' : 'checkbox')
            .setOrigin(0.5, 0.5)
            .setScale(0.8)
            .setInteractive({ useHandCursor: true });
            
        // Обработчик для чекбокса
        soundCheckbox.on('pointerdown', () => {
            this.soundEnabled = !this.soundEnabled;
            soundCheckbox.setTexture(this.soundEnabled ? 'checkbox_checked' : 'checkbox');
            
            // Сохраняем настройку звука
            localStorage.setItem('soundEnabled', this.soundEnabled ? 'true' : 'false');
            
            // Обновляем громкость меню музыки
            if (this.menuMusic) {
                this.menuMusic.setVolume(this.soundEnabled ? 0.3 : 0);
            }
        });
        
        // --- Кнопка OK ---
        const okButtonContainer = this.add.container(0, windowHeight/2 - padding*2);
        const okButtonBg = this.add.image(0, 0, 'button')
            .setOrigin(0.5, 0.5)
            .setInteractive({ useHandCursor: true });
            
        const okButtonText = this.add.text(0, -3, "OK", {
            font: '32px Lilita One',
            fill: '#23200e',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        okButtonContainer.add([okButtonBg, okButtonText]);
        
        // Обработчик для кнопки OK
        okButtonBg.on('pointerdown', () => {
            this.hideSettingsWindow();
        });
        
        okButtonBg.on('pointerover', () => {
            okButtonBg.setTint(0xf7cf79);
            okButtonText.setTint(0xf7cf79);
        });
        
        okButtonBg.on('pointerout', () => {
            okButtonBg.clearTint();
            okButtonText.clearTint();
        });
        
        // Добавляем все элементы в контейнер настроек
        this.settingsContainer.add([
            shadowRect, bg, borderRect, titleText,
            languageTitle, russianButton, englishButton,
            soundTitle, soundCheckbox, okButtonContainer
        ]);
        
        // Делаем кнопки меню неактивными и полупрозрачными
        this.menuButtons.forEach(buttonContainer => {
            // Находим hitArea внутри контейнера
            const hitArea = buttonContainer.list.find(child => child instanceof Phaser.GameObjects.Rectangle && child.input);
            if (hitArea) {
                hitArea.disableInteractive(); // Отключаем интерактивность у hitArea
            }
            buttonContainer.setAlpha(0.5); // Делаем полупрозрачными для визуального отличия
        });
    }

    hideSettingsWindow() {
        if (this.settingsContainer) {
            // Удаляем контейнер настроек
            this.settingsContainer.destroy();
            this.settingsContainer = null;
            
            // Возвращаем кнопкам меню активность и нормальную прозрачность
            this.menuButtons.forEach(buttonContainer => {
                // Находим hitArea внутри контейнера
                const hitArea = buttonContainer.list.find(child => child instanceof Phaser.GameObjects.Rectangle && child.input);
                if (hitArea) {
                    hitArea.setInteractive(); // Включаем интерактивность у hitArea
                }
                buttonContainer.setAlpha(1); // Возвращаем нормальную прозрачность
            });
        }
    }

    update() {
    }
}