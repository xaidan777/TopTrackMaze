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
    resolution: window.devicePixelRatio || 1,
    render: { pixelArt: false },
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

window.onload = () => {
    if (typeof SimplexNoise === 'undefined') {
        console.error("SimplexNoise library is not loaded! Check index.html.");
        const gameContainer = document.getElementById('phaser-game');
        if (gameContainer) {
            // ... код обработки ошибки SimplexNoise ...
        }
    } else {
        window.game = new Phaser.Game(config);
        console.log("Phaser Game instance created.");
    }
};