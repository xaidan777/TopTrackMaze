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
        antialias: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        expandParent: true
    },
    input: {
        touch: {
            capture: true
        }
    },
    callbacks: {
        preBoot: function() {
            updateLoadingProgress(20);
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
    }
};