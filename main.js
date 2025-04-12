// ==============================
// --- КОНФИГ ФЕЙЗЕРА И СТАРТ ---
// ==============================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'phaser-game',
    scene: [MainMenuScene, GameScene], // <--- Проблемное место
    antialias: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    resolution: window.devicePixelRatio || 1,
    render: { pixelArt: false }
};

window.onload = () => {
    if (typeof SimplexNoise === 'undefined') {
        console.error("SimplexNoise library is not loaded! Check index.html.");
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            // ... код обработки ошибки SimplexNoise ...
        }
    } else {
        const game = new Phaser.Game(config); // <--- Запуск игры
        console.log("Phaser Game instance created.");
    }
};