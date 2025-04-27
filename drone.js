class Drone extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, DRONE_KEY);
        scene.add.existing(this);
        this.setDepth(5).setOrigin(0.5).setScale(0.6);
        this.shadow = null; // Инициализируем свойство для тени
    }

    planMove(target, maxDistPx) {
        const dir = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y);
        if (dir.length() > maxDistPx) dir.setLength(maxDistPx);
        this.nextX = this.x + dir.x;
        this.nextY = this.y + dir.y;
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
