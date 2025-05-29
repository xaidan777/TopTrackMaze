class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.engineSound = null;
        this.isEnginePlaying = false;
        this.fadeTween = null;
        this.replayEngineSound = null;
        this.isReplayEnginePlaying = false;
        this.replayFadeTween = null;
    }

    preload() {
        // Загрузка звуков
        this.scene.load.audio('engine', 'assets/sounds/engine.mp3');
        this.scene.load.audio('crash', 'assets/sounds/crash.mp3');
        this.scene.load.audio('fuel', 'assets/sounds/fuel.mp3');
        this.scene.load.audio('nitro', 'assets/sounds/nitro.mp3');
        this.scene.load.audio('win', 'assets/sounds/win.mp3');
        this.scene.load.audio('out', 'assets/sounds/out.mp3');
        this.scene.load.audio('drone', 'assets/sounds/drone.mp3');
    }

    create() {
        // Создание звуков
        this.sounds.engine = this.scene.sound.add('engine', {
            loop: true,
            volume: 0
        });
        
        this.sounds.crash = this.scene.sound.add('crash', {
            volume: 0.5
        });
        
        this.sounds.fuel = this.scene.sound.add('fuel', {
            volume: 0.4
        });
        
        this.sounds.nitro = this.scene.sound.add('nitro', {
            volume: 0.5
        });
        
        this.sounds.win = this.scene.sound.add('win', {
            volume: 0.6
        });

        this.sounds.out = this.scene.sound.add('out', {
            volume: 0.6
        });

        this.sounds.drone = this.scene.sound.add('drone', {
            volume: 0.6
        });
    }

    updateEngineSoundRate(speed) {
        if (!this.isEnginePlaying) return;
        
        // Нормализуем скорость в диапазон [0, 1]
        const normalizedSpeed = Phaser.Math.Clamp(
            (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED),
            0,
            1
        );
        
        // Интерполируем скорость воспроизведения
        const rate = Phaser.Math.Linear(
            ENGINE_SOUND_MIN_RATE,
            ENGINE_SOUND_MAX_RATE,
            normalizedSpeed
        );
        
        // Применяем новую скорость воспроизведения
        this.sounds.engine.setRate(rate);
    }

    playEngine(initialSpeed = MIN_SPEED) {
        if (!this.isEnginePlaying) {
            // Устанавливаем начальную скорость воспроизведения перед запуском
            this.updateEngineSoundRate(initialSpeed);
            
            // Устанавливаем начальную громкость перед запуском
            this.sounds.engine.setVolume(0);
            
            this.sounds.engine.play();
            this.isEnginePlaying = true;
            
            // Отменяем предыдущий твин, если он есть
            if (this.fadeTween) {
                this.fadeTween.stop();
            }
            
            // Плавное появление звука
            this.fadeTween = this.scene.tweens.add({
                targets: this.sounds.engine,
                volume: ENGINE_SOUND_BASE_VOLUME,
                duration: 500,
                ease: 'Linear'
            });
        }
    }

    stopEngine(immediate = false) {
        if (this.isEnginePlaying) {
            // Отменяем предыдущий твин, если он есть
            if (this.fadeTween) {
                this.fadeTween.stop();
            }
            
            if (immediate) {
                // Немедленная остановка звука
                this.sounds.engine.stop();
                this.sounds.engine.setVolume(0);
                this.isEnginePlaying = false;
            } else {
                // Плавное затухание звука
                this.fadeTween = this.scene.tweens.add({
                    targets: this.sounds.engine,
                    volume: 0,
                    duration: 100,
                    ease: 'Linear',
                    onComplete: () => {
                        this.sounds.engine.stop();
                        this.isEnginePlaying = false;
                    }
                });
            }
        }
    }

    playCrash() {
        this.sounds.crash.play();
    }

    playFuel() {
        this.sounds.fuel.play();
    }

    playNitro() {
        this.sounds.nitro.play();
    }

    playWin() {
        this.sounds.win.play();
    }

    playOut() {
        this.sounds.out.play();
    }

    playDrone() {
        this.sounds.drone.play();
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.setVolume(volume);
        });
    }

    updateReplayEngineSoundRate(speed) {
        if (!this.isReplayEnginePlaying) return;
        
        // Нормализуем скорость в диапазон [0, 1]
        const normalizedSpeed = Phaser.Math.Clamp(
            (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED),
            0,
            1
        );
        
        // Интерполируем скорость воспроизведения
        const rate = Phaser.Math.Linear(
            REPLAY_ENGINE_SOUND_MIN_RATE,
            REPLAY_ENGINE_SOUND_MAX_RATE,
            normalizedSpeed
        );
        
        // Применяем новую скорость воспроизведения
        this.sounds.engine.setRate(rate);
    }

    playReplayEngine(initialSpeed = MIN_SPEED) {
        if (!this.isReplayEnginePlaying) {
            // Устанавливаем начальную скорость воспроизведения перед запуском
            this.updateReplayEngineSoundRate(initialSpeed);
            
            // Устанавливаем начальную громкость перед запуском
            this.sounds.engine.setVolume(0);
            
            this.sounds.engine.play();
            this.isReplayEnginePlaying = true;
            
            // Отменяем предыдущий твин, если он есть
            if (this.replayFadeTween) {
                this.replayFadeTween.stop();
            }
            
            // Плавное появление звука
            this.replayFadeTween = this.scene.tweens.add({
                targets: this.sounds.engine,
                volume: REPLAY_ENGINE_SOUND_BASE_VOLUME,
                duration: 500,
                ease: 'Linear'
            });
        }
    }

    stopReplayEngine(immediate = false) {
        if (this.isReplayEnginePlaying) {
            // Отменяем предыдущий твин, если он есть
            if (this.replayFadeTween) {
                this.replayFadeTween.stop();
            }
            
            if (immediate) {
                // Немедленная остановка звука
                this.sounds.engine.stop();
                this.sounds.engine.setVolume(0);
                this.isReplayEnginePlaying = false;
            } else {
                // Плавное затухание звука
                this.replayFadeTween = this.scene.tweens.add({
                    targets: this.sounds.engine,
                    volume: 0,
                    duration: 100,
                    ease: 'Linear',
                    onComplete: () => {
                        this.sounds.engine.stop();
                        this.isReplayEnginePlaying = false;
                    }
                });
            }
        }
    }
}
