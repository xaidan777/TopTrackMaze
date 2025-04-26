// ==============================
// --- КОНФИГ ФЕЙЗЕРА И СТАРТ ---
// ==============================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'phaser-game',
    scene: [MainMenuScene, GameScene],
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
                
                // Применяем фиксированные размеры
                gameContainer.style.width = containerWidth + 'px';
                gameContainer.style.height = containerHeight + 'px';
                gameContainer.style.position = 'absolute';
                gameContainer.style.left = ((windowWidth - containerWidth) / 2) + 'px';
                gameContainer.style.top = ((windowHeight - containerHeight) / 2) + 'px';
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
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                const gameContainer = document.getElementById('phaser-game');
                if (gameContainer) {
                    const containerWidth = gameContainer.clientWidth;
                    const containerHeight = gameContainer.clientHeight;
                    const aspectRatio = containerWidth / containerHeight;
                    
                    // Ограничиваем соотношение сторон
                    let newWidth = containerWidth;
                    let newHeight = containerHeight;
                    
                    if (aspectRatio > MAX_ASPECT_RATIO) {
                        newWidth = containerHeight * MAX_ASPECT_RATIO;
                    } else if (aspectRatio < MIN_ASPECT_RATIO) {
                        newHeight = containerWidth / MIN_ASPECT_RATIO;
                    }
                    
                    // Центрируем экран загрузки
                    loadingScreen.style.width = newWidth + 'px';
                    loadingScreen.style.height = newHeight + 'px';
                    loadingScreen.style.left = ((containerWidth - newWidth) / 2) + 'px';
                    loadingScreen.style.top = ((containerHeight - newHeight) / 2) + 'px';
                }
            }
        });
    }
};