// ==============================
// --- КОНФИГ ФЕЙЗЕРА И СТАРТ ---
// ==============================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'phaser-game',
    scene: [LangScene, MainMenuScene, GameScene],
    antialias: true,
    physics: {
        default: 'arcade',
        arcade: { 
            debug: false,
            debugShowBody: true,
            debugShowStaticBody: true,
            debugShowVelocity: true,
            debugVelocityColor: 0xffff00,
            debugBodyColor: 0x0000ff,
            debugStaticBodyColor: 0xff00ff
        }
    },
    render: { 
        pixelArt: false,
        antialias: true,
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        expandParent: false
    },
    input: {
        touch: {
            capture: true
        }
    },
    callbacks: {
        preBoot: function() {
            updateLoadingProgress(20);
            
            // Применяем язык к экрану загрузки, если функция определена
            if (typeof updateLoadingScreenLanguage === 'function') {
                updateLoadingScreenLanguage();
            }
            
            // Нормализация размера контейнера игры при старте
            const gameContainer = document.getElementById('phaser-game');
            if (gameContainer) {
                // Установка фиксированных размеров для контейнера игры
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const aspectRatio = windowWidth / windowHeight;
                
                // Ограничиваем размер игры в рамках безопасного соотношения сторон
                let containerWidth = windowWidth;
                let containerHeight = windowHeight;
                
                if (aspectRatio > MAX_ASPECT_RATIO) {
                    containerWidth = windowHeight * MAX_ASPECT_RATIO;
                } else if (aspectRatio < MIN_ASPECT_RATIO) {
                    containerHeight = windowWidth / MIN_ASPECT_RATIO;
                }
                
                // Применяем фиксированные размеры и центрируем
                gameContainer.style.width = containerWidth + 'px';
                gameContainer.style.height = containerHeight + 'px';
            }
        },
        postBoot: function() {
            updateLoadingProgress(40);
        }
    }
};

function updateLoadingProgress(percent) {
    const progressBar = document.querySelector('.loading-progress');
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
}

window.onload = () => {
    if (typeof SimplexNoise === 'undefined') {
        console.error("SimplexNoise library is not loaded! Check index.html.");
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            // ... код обработки ошибки SimplexNoise ...
        }
    } else {
        updateLoadingProgress(60);
        window.game = new Phaser.Game(config);
        console.log("Phaser Game instance created.");
        updateLoadingProgress(80);
        
        // Запрещаем открытие контекстного меню на игровом контейнере
        const gameContainerForContextMenu = document.getElementById('phaser-game');
        if (gameContainerForContextMenu) {
            gameContainerForContextMenu.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }
        
        // Скрываем экран загрузки после полной загрузки игры
        window.game.events.on('ready', () => {
            updateLoadingProgress(100);
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            }, 500); // Немного задержки для плавного завершения
        });

        // Добавляем обработчик изменения размера для экрана загрузки
        window.addEventListener('resize', () => {
            const gameContainer = document.getElementById('phaser-game');
            let actualContainerWidth = 0;
            let actualContainerHeight = 0;

            if (gameContainer) {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                let newParentWidth = windowWidth;
                let newParentHeight = windowHeight;
                const parentAspectRatio = windowWidth / windowHeight;

                // Ограничиваем размер контейнера игры в рамках безопасного соотношения сторон
                if (parentAspectRatio > MAX_ASPECT_RATIO) {
                    newParentWidth = windowHeight * MAX_ASPECT_RATIO;
                } else if (parentAspectRatio < MIN_ASPECT_RATIO) {
                    newParentHeight = windowWidth / MIN_ASPECT_RATIO;
                }
                
                gameContainer.style.width = newParentWidth + 'px';
                gameContainer.style.height = newParentHeight + 'px';

                actualContainerWidth = newParentWidth;
                actualContainerHeight = newParentHeight;
            }

            // Обновляем текст на экране загрузки при изменении размера
            if (typeof updateLoadingScreenLanguage === 'function') {
                updateLoadingScreenLanguage();
            }

            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen && gameContainer) { // Убедимся, что gameContainer существует
                // Экран загрузки должен использовать обновленные размеры gameContainer
                const lsContainerWidth = actualContainerWidth; // Используем рассчитанные размеры
                const lsContainerHeight = actualContainerHeight;
                const lsAspectRatio = lsContainerWidth / lsContainerHeight;
                
                let lsWidth = lsContainerWidth;
                let lsHeight = lsContainerHeight;
                
                // Применяем ограничения соотношения сторон и для экрана загрузки, чтобы он вписывался в контейнер
                if (lsAspectRatio > MAX_ASPECT_RATIO) {
                    lsWidth = lsContainerHeight * MAX_ASPECT_RATIO;
                } else if (lsAspectRatio < MIN_ASPECT_RATIO) {
                    lsHeight = lsContainerWidth / MIN_ASPECT_RATIO;
                }
                
                loadingScreen.style.width = lsWidth + 'px';
                loadingScreen.style.height = lsHeight + 'px';
                loadingScreen.style.left = ((lsContainerWidth - lsWidth) / 2) + 'px';
                loadingScreen.style.top = ((lsContainerHeight - lsHeight) / 2) + 'px';
            }
        });
    }
};