class DustParticle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, color, startRadius, endRadius, lifeFrames, startAlpha, endAlpha, 
                wiggleMaxOffset, wiggleUpdateInterval, wiggleTransitionFrames) {
        super(scene, x, y, texture);
        scene.add.existing(this);

        this.particleColor = color;
        this.initialRadius = startRadius; 
        this.currentRadius = startRadius;
        this.maxRadius = endRadius;
        this.lifeSpan = lifeFrames; 
        this.currentFrame = 0;
        this.startAlpha = startAlpha;
        this.endAlpha = endAlpha;
        
        this.wiggleMaxOffset = wiggleMaxOffset;
        this.wiggleUpdateInterval = wiggleUpdateInterval;
        this.wiggleTransitionFrames = Math.max(1, wiggleTransitionFrames); // Переход должен быть хотя бы 1 кадр

        this.initialX = x;
        this.initialY = y;

        // Для плавного покачивания
        this.currentWiggleOffsetX = 0;
        this.currentWiggleOffsetY = 0;
        this.targetWiggleOffsetX = 0;
        this.targetWiggleOffsetY = 0;
        this.wiggleUpdateCounter = 0;
        this.wiggleTransitionCounter = 0;
        // Сохраняем начальные точки для интерполяции перехода
        this.sourceWiggleOffsetX = 0;
        this.sourceWiggleOffsetY = 0;

        this.setTint(this.particleColor);
        this.setAlpha(this.startAlpha);
        
        this.baseTextureRadius = this.texture.getSourceImage().width / 2; 
        if (this.baseTextureRadius === 0) {
            console.warn("DustParticle: baseTextureRadius is 0, defaulting to 1. Texture key:" + texture);
            this.baseTextureRadius = 1; 
        }
        this.setScale(this.currentRadius / this.baseTextureRadius);

        if (scene.uiCamera) {
            scene.uiCamera.ignore(this);
        }
    }

    update() {
        if (this.currentFrame >= this.lifeSpan) {
            this.setActive(false);
            this.setVisible(false);
            return;
        }

        this.currentFrame++;
        const progress = this.currentFrame / this.lifeSpan;

        // Анимация радиуса
        const radStart = (typeof this.initialRadius !== 'undefined') ? this.initialRadius : DUST_PARTICLE_START_RADIUS; 
        this.currentRadius = Phaser.Math.Linear(radStart, this.maxRadius, progress);
        
        if (this.baseTextureRadius > 0) {
            this.setScale(this.currentRadius / this.baseTextureRadius);
        } else {
            const currentTextureRadius = this.texture.getSourceImage().width / 2;
            if (currentTextureRadius > 0) {
                this.baseTextureRadius = currentTextureRadius;
                this.setScale(this.currentRadius / this.baseTextureRadius);
            } else {
                this.setScale(this.currentRadius); 
            }
        }

        // Анимация альфы
        const currentAlpha = Phaser.Math.Linear(this.startAlpha, this.endAlpha, progress);
        this.setAlpha(currentAlpha);

        // Эффект "покачивания" (wiggle)
        if (this.wiggleMaxOffset > 0) {
            this.wiggleUpdateCounter++;
            if (this.wiggleUpdateCounter >= this.wiggleUpdateInterval) {
                this.wiggleUpdateCounter = 0;
                this.wiggleTransitionCounter = 0; // Начать новый переход
                // Сохраняем текущее смещение как начальное для нового перехода
                this.sourceWiggleOffsetX = this.currentWiggleOffsetX;
                this.sourceWiggleOffsetY = this.currentWiggleOffsetY;
                // Выбираем новую цель
                this.targetWiggleOffsetX = (Math.random() * 2 - 1) * this.wiggleMaxOffset;
                this.targetWiggleOffsetY = (Math.random() * 2 - 1) * this.wiggleMaxOffset;
            }

            if (this.wiggleTransitionCounter < this.wiggleTransitionFrames) {
                this.wiggleTransitionCounter++;
                const transitionProgress = this.wiggleTransitionCounter / this.wiggleTransitionFrames;
                this.currentWiggleOffsetX = Phaser.Math.Linear(this.sourceWiggleOffsetX, this.targetWiggleOffsetX, transitionProgress);
                this.currentWiggleOffsetY = Phaser.Math.Linear(this.sourceWiggleOffsetY, this.targetWiggleOffsetY, transitionProgress);
            } else {
                // Если переход завершен, остаемся на целевой точке
                this.currentWiggleOffsetX = this.targetWiggleOffsetX;
                this.currentWiggleOffsetY = this.targetWiggleOffsetY;
            }
            
            this.x = this.initialX + this.currentWiggleOffsetX;
            this.y = this.initialY + this.currentWiggleOffsetY;
        }
    }

    // Метод для перезапуска частицы из пула (если будем использовать пул)
    // reset(x, y, color, startRadius, endRadius, durationFrames) {
    //     this.setPosition(x, y);
    //     this.particleColor = color;
    //     this.initialRadius = startRadius; // переименовал startRadius в initialRadius для ясности в reset
    //     this.currentRadius = startRadius;
    //     this.maxRadius = endRadius;
    //     this.lifeSpan = durationFrames;
    //     this.currentFrame = 0;
    //
    //     this.setTint(this.particleColor);
    //     this.setAlpha(1);
    //     const baseTextureRadius = this.texture.getSourceImage().width / 2;
    //     this.setScale(this.currentRadius / baseTextureRadius);
    //
    //     this.setActive(true);
    //     this.setVisible(true);
    // }
}

// Константы для частиц пыли ПЕРЕМЕЩЕНЫ в Constants.js
// const DUST_PARTICLE_START_RADIUS = 3;
// const DUST_PARTICLE_END_RADIUS = 50;
// const DUST_PARTICLE_DURATION_FRAMES = 9; // "Кадры" анимации
// const DUST_PARTICLE_TEXTURE_KEY = 'dust_particle'; // Ключ для текстуры частицы пыли 

DustParticle.getDustColorForBiome = function(biome) {
    if (!biome) return SHADOW_COLOR; // Возвращаем запасной цвет, если биом не определен
    if (biome === BIOME_DESERT) {
        return 0x81591e;
    } else if (biome === BIOME_SNOW) {
        return 0x98afc1;
    } else if (biome === BIOME_GRASS) {
        return 0x91b15b;
    } else {
        return SHADOW_COLOR; // Запасной цвет
    }
};

DustParticle.getReplayDustColorForBiome = function(biome) {
    if (!biome) return SHADOW_COLOR; // Возвращаем запасной цвет, если биом не определен
    if (biome === BIOME_DESERT) {
        return BIOME_DESERT_COLOR;
    } else if (biome === BIOME_SNOW) {
        return BIOME_SNOW_COLOR;
    } else if (biome === BIOME_GRASS) {
        return BIOME_GRASS_COLOR;
    } else {
        return SHADOW_COLOR; 
    }
};

DustParticle.spawnDustParticles = function(scene, car, dustParticlesGroup, wheelPositions, currentBiome, isNitroActive = false) {
    if (!scene || !car || !car.active || !dustParticlesGroup || !currentBiome) return;

    const carAngle = Phaser.Math.DegToRad(car.angle);
    
    // Если нитро активно в этом ходу, используем цвет нитро, иначе цвет биома
    const dustColor = isNitroActive ? DUST_PARTICLE_NITRO_COLOR : DustParticle.getDustColorForBiome(currentBiome);

    // Индексы колес для создания пыли (0 и 2)
    const wheelIndicesForDust = [0, 2];

    for (const wheelIndex of wheelIndicesForDust) {
        if (wheelIndex < wheelPositions.length) {
            const wheel = wheelPositions[wheelIndex];
            const rotatedX = wheel.offsetX * Math.cos(carAngle) - wheel.offsetY * Math.sin(carAngle);
            const rotatedY = wheel.offsetX * Math.sin(carAngle) + wheel.offsetY * Math.cos(carAngle);
            
            const dustX = car.x + rotatedX;
            const dustY = car.y + rotatedY;

            const particle = new DustParticle(
                scene, 
                dustX, 
                dustY, 
                DUST_PARTICLE_TEXTURE_KEY, 
                dustColor, 
                DUST_PARTICLE_START_RADIUS, 
                DUST_PARTICLE_END_RADIUS, 
                DUST_PARTICLE_LIFE_FRAMES,
                DUST_PARTICLE_START_ALPHA,
                DUST_PARTICLE_END_ALPHA,
                DUST_PARTICLE_WIGGLE_MAX_OFFSET,
                DUST_PARTICLE_WIGGLE_UPDATE_INTERVAL_FRAMES,
                DUST_PARTICLE_WIGGLE_TRANSITION_FRAMES
            );
            // Глубина частицы должна быть ниже следов шин. Предполагаем, что tiresTrackRT существует в сцене.
            if (scene.tiresTrackRT) {
                particle.setDepth(8);
            } else {
                particle.setDepth(8); // Значение по умолчанию, если tiresTrackRT нет
            }
            dustParticlesGroup.add(particle);
        }
    }
};

DustParticle.spawnReplayDustParticles = function(scene, replayCar, replayDustParticlesGroup, wheelPositions, replayBiome) {
    if (!scene || !replayCar || !replayCar.active || !replayDustParticlesGroup || !replayBiome) return;

    const carAngle = Phaser.Math.DegToRad(replayCar.angle);
    const dustColor = DustParticle.getReplayDustColorForBiome(replayBiome);
    const wheelIndicesForDust = [0, 2];

    for (const wheelIndex of wheelIndicesForDust) {
        if (wheelIndex < wheelPositions.length) {
            const wheel = wheelPositions[wheelIndex];
            const rotatedX = wheel.offsetX * Math.cos(carAngle) - wheel.offsetY * Math.sin(carAngle);
            const rotatedY = wheel.offsetX * Math.sin(carAngle) + wheel.offsetY * Math.cos(carAngle);
            
            const dustX = replayCar.x + rotatedX;
            const dustY = replayCar.y + rotatedY;

            const particle = new DustParticle(
                scene, 
                dustX, 
                dustY, 
                DUST_PARTICLE_TEXTURE_KEY, 
                dustColor, 
                DUST_PARTICLE_START_RADIUS, 
                DUST_PARTICLE_END_RADIUS, 
                DUST_PARTICLE_LIFE_FRAMES,
                DUST_PARTICLE_START_ALPHA,
                DUST_PARTICLE_END_ALPHA,
                DUST_PARTICLE_WIGGLE_MAX_OFFSET,
                DUST_PARTICLE_WIGGLE_UPDATE_INTERVAL_FRAMES,
                DUST_PARTICLE_WIGGLE_TRANSITION_FRAMES
            );
            // Глубина частицы должна быть ниже следов шин. Предполагаем, что tiresTrackRT существует в сцене.
            if (scene.tiresTrackRT) {
                particle.setDepth(scene.tiresTrackRT.depth - 1);
            } else {
                particle.setDepth(-16); // Значение по умолчанию, если tiresTrackRT нет
            }
            replayDustParticlesGroup.add(particle);
        }
    }
}; 