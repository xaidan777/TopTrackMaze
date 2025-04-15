// Обработчик консольных команд
class ConsoleCommands {
    constructor(game) {
        this.game = game;
        this.setupConsoleCommands();
        this.setupDebugFunction();
    }

    setupConsoleCommands() {
        // Сохраняем оригинальную функцию console.log
        const originalConsoleLog = console.log;
        
        // Переопределяем console.log для перехвата команд
        console.log = (...args) => {
            // Проверяем, является ли первый аргумент командой
            if (typeof args[0] === 'string' && args[0].trim() === 'debug') {
                this.activateDebug();
                return;
            }
            
            // Если это не команда, вызываем оригинальный console.log
            originalConsoleLog.apply(console, args);
        };
    }

    setupDebugFunction() {
        // Создаем глобальную функцию debug, которая сразу же возвращает результат своего выполнения
        Object.defineProperty(window, 'debug', {
            get: () => {
                this.activateDebug();
                return 'Debug mode activated!';
            }
        });
    }

    activateDebug() {
        const gameScene = this.game.scene.getScene('GameScene');
        if (gameScene) {
            gameScene.activateDebugMode();
        } else {
            console.log('GameScene не найдена');
        }
    }
} 