class Drone extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, DRONE_KEY);
        scene.add.existing(this);
        this.setDepth(15).setOrigin(0.5).setScale(0.6);
        this.shadow = null; // Инициализируем свойство для тени
        this.collisionDirection = null; // Направление после столкновения
    }

    planMove(target, maxDistPx) {
        const dir = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y);
        
        // Если есть направление после столкновения, используем его
        if (this.collisionDirection) {
            dir.set(this.collisionDirection.x, this.collisionDirection.y);
            this.collisionDirection = null; // Сбрасываем направление после использования
        }
        
        if (dir.length() > maxDistPx) dir.setLength(maxDistPx);
        this.nextX = this.x + dir.x;
        this.nextY = this.y + dir.y;
    }

    handleDroneCollision(otherDrone) {
        // Вычисляем вектор от текущего дрона к другому
        const collisionVector = new Phaser.Math.Vector2(otherDrone.x - this.x, otherDrone.y - this.y);
        
        // Если дроны находятся слишком близко друг к другу, добавляем случайное смещение
        if (collisionVector.length() < GRID_CELL_SIZE) {
            const randomAngle = Phaser.Math.Between(0, 360);
            collisionVector.setToPolar(randomAngle, GRID_CELL_SIZE);
        }
        
        // Нормализуем вектор
        collisionVector.normalize();
        
        // Добавляем случайный компонент к направлению (от -30 до 30 градусов)
        const randomDeviation = Phaser.Math.Between(-30, 30);
        collisionVector.rotate(Phaser.Math.DegToRad(randomDeviation));
        
        // Устанавливаем минимальное расстояние движения
        const minMoveDistance = DRONE_RANGE_CELLS * GRID_CELL_SIZE * 0.5;
        const maxMoveDistance = DRONE_RANGE_CELLS * GRID_CELL_SIZE;
        const moveDistance = Phaser.Math.Between(minMoveDistance, maxMoveDistance);
        
        // Масштабируем вектор на выбранное расстояние
        collisionVector.scale(moveDistance);
        
        // Устанавливаем противоположное направление для обоих дронов
        this.collisionDirection = new Phaser.Math.Vector2(-collisionVector.x, -collisionVector.y);
        otherDrone.collisionDirection = collisionVector;
    }

    executeMove(duration) {
        return this.scene.tweens.add({
            targets: this,
            x: this.nextX,
            y: this.nextY,
            duration,
            ease: 'Linear'
        });
    }

    checkKill(car) {
        if (!car || !car.active || !this.active) return false;
        return Phaser.Math.Distance.Between(car.x, car.y, this.x, this.y) <
               DRONE_KILL_RADIUS_CELLS * GRID_CELL_SIZE;
    }
}
