// ArcController.js

class ArcController {
    constructor(scene, car, controlArcGraphics, trajectoryGraphics, ghostCar, snapCursor) {
        this.scene = scene;             // Ссылка на основную сцену
        this.car = car;                 // Ссылка на спрайт машины
        this.controlArcGraphics = controlArcGraphics; // Графика для дуги
        this.trajectoryGraphics = trajectoryGraphics; // Графика для траектории
        this.ghostCar = ghostCar;         // Спрайт "призрака"
        this.snapCursor = snapCursor;       // Графика для точки "примагничивания"

        this.arcParams = {};          // Параметры текущей дуги
        this.hoveredArcZone = null;   // Зона дуги под курсором
    }

    // --- Методы расчета и отрисовки состояния ---

    calculateArcGuiParams() {
        if (!this.car) return;
        const speed = this.car.getData('speed') ?? MIN_SPEED;
        const normSpeed = Phaser.Math.Clamp((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
        const arcCenterX = this.car.x;
        const arcCenterY = this.car.y;
        const radiusFactor = SPEED_TO_GUI_RADIUS_FACTOR * normSpeed;
        const innerRadius = BASE_INNER_RADIUS_GUI + radiusFactor;
        const baseThick = ARC_THICKNESS_GUI;
        const thickReduce = baseThick * normSpeed * GUI_THICKNESS_REDUCTION_FACTOR;
        const arcThickness = Math.max(MIN_ARC_THICKNESS, baseThick - thickReduce);
        const outerRadius = innerRadius + arcThickness;
        const workingRadius = innerRadius + arcThickness * GREEN_ZONE_RATIO;
        const brakeZoneThickness = workingRadius - innerRadius;
        const neutralRadius = (brakeZoneThickness > 0)
            ? innerRadius + brakeZoneThickness / 2
            : innerRadius;
        const angleReductionMultiplier = 1 / (normSpeed * (MAX_GUI_ANGLE_REDUCTION_FACTOR - 1) + 1);
        const angleDeg = Math.max(MIN_ARC_ANGLE_DEG, BASE_ANGLE_DEG * angleReductionMultiplier);
        const halfAngleRad = Phaser.Math.DegToRad(angleDeg / 2);
        this.arcParams = {
            centerX: arcCenterX,
            centerY: arcCenterY,
            innerRadius: Math.max(0, innerRadius),
            neutralRadius: Math.max(0, neutralRadius),
            workingRadius: Math.max(0, workingRadius),
            outerRadius: Math.max(0, outerRadius),
            halfAngleRad: halfAngleRad,
            orientationRad: carAngleRad
        };
    }

    fillAnnularSector(graphics, cx, cy, innerR, outerR, startA, endA, color, alpha) {
        if (!graphics || !isFinite(cx) || !isFinite(cy) || !isFinite(innerR) || !isFinite(outerR) || outerR <= innerR || innerR < 0) return;
        graphics.fillStyle(color, alpha);
        graphics.beginPath();
        graphics.arc(cx, cy, outerR, startA, endA, false);
        graphics.arc(cx, cy, innerR, endA, startA, true);
        graphics.closePath();
        graphics.fillPath();
    }

    drawControlArc() {
        if (!this.controlArcGraphics || !this.car) return;
        const ap = this.arcParams;
        this.controlArcGraphics.clear();
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;
        const hovered = this.hoveredArcZone;
        const HOVER_ALPHA = ZONE_ALPHA_HOVER;
        const DEFAULT_RED_ALPHA = ZONE_ALPHA_DEFAULT;
        const DEFAULT_ACCEL_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_BRAKE_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_REVERSE_ALPHA = ZONE_ALPHA_DEFAULT + 0.2;

        if (ap && ap.outerRadius > ap.innerRadius && ap.halfAngleRad > 0 && ap.innerRadius >= 0) {
            const startAngle = ap.orientationRad - ap.halfAngleRad;
            const endAngle = ap.orientationRad + ap.halfAngleRad;
            if (ap.workingRadius < ap.outerRadius && !redCooldownActive) {
                const redInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
                if (redInnerRadius < ap.outerRadius) {
                    const alpha = (hovered === 'red') ? HOVER_ALPHA : DEFAULT_RED_ALPHA;
                    this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, redInnerRadius, ap.outerRadius, startAngle, endAngle, COLOR_RED, alpha);
                }
            }
            if (ap.neutralRadius < ap.workingRadius && !accelIsDisabled) {
                const alpha = (hovered === 'accelerate') ? HOVER_ALPHA : DEFAULT_ACCEL_ALPHA;
                this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.neutralRadius, ap.workingRadius, startAngle, endAngle, COLOR_ACCELERATE, alpha);
            }
            if (ap.innerRadius < ap.neutralRadius) {
                const alpha = (hovered === 'brake') ? HOVER_ALPHA : DEFAULT_BRAKE_ALPHA;
                this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.innerRadius, ap.neutralRadius, startAngle, endAngle, COLOR_BRAKE, alpha);
            }
        }

        if (currentSpeed === MIN_SPEED) {
            const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
            const reverseOrientationRad = carAngleRad + Math.PI;
            const halfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const startAngleRev = reverseOrientationRad - halfReverseAngleRad;
            const endAngleRev = reverseOrientationRad + halfReverseAngleRad;
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            const alpha = (hovered === 'reverse') ? HOVER_ALPHA : DEFAULT_REVERSE_ALPHA;
            this.fillAnnularSector(this.controlArcGraphics, this.car.x, this.car.y, innerRRev, outerRRev, startAngleRev, endAngleRev, COLOR_REVERSE, alpha);
        }
    }

    // Вычисляет все параметры и перерисовывает дугу и др. элементы управления
    // Вызывается сценой после завершения хода или при инициализации
    drawState() {
        this.calculateArcGuiParams();
        this.drawControlArc();
        // Можно добавить сброс trajectory/ghost если нужно
    }

    // Сбрасывает и очищает визуальные элементы управления (дуга, траектория...)
    // Вызывается сценой, когда машина начинает движение или игра окончена
    clearVisuals() {
        if (this.controlArcGraphics) this.controlArcGraphics.clear();
        if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
        if (this.snapCursor) this.snapCursor.clear();
        this.hoveredArcZone = null;
        if (this.scene?.game?.canvas) { // Убираем кастомный курсор, если он был
             this.scene.game.canvas.style.cursor = 'default';
        }
    }

    // Сбрасывает состояние для следующего хода (вызывается из finishMove сцены)
    resetForNextTurn(pointer) {
        this.drawState();
        // Обновляем состояние ховера/призрака на основе текущей позиции курсора
        if (pointer) {
            this.handlePointerMove(pointer);
        }
    }

    // --- Методы обработки ввода ---

    getArcZoneForPoint(pointX, pointY) {
        if (!this.car) return null;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        const dx = pointX - this.car.x;
        const dy = pointY - this.car.y;
        const distSqr = dx * dx + dy * dy;
        const pointAngleRad = Math.atan2(dy, dx);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

        if (currentSpeed === MIN_SPEED) {
            const reverseOrientationRad = carAngleRad + Math.PI;
            const halfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            if (distSqr >= innerRRev * innerRRev && distSqr <= outerRRev * outerRRev) {
                const relativeAngleRadRev = Phaser.Math.Angle.Wrap(pointAngleRad - reverseOrientationRad);
                if (Math.abs(relativeAngleRadRev) <= halfReverseAngleRad) return 'reverse';
            }
        }

        const ap = this.arcParams;
        if (!ap || ap.innerRadius < 0 || ap.outerRadius <= ap.innerRadius) return null;
        if (distSqr < ap.innerRadius * ap.innerRadius || distSqr > ap.outerRadius * ap.outerRadius) return null;
        const relativeAngleRadFwd = Phaser.Math.Angle.Wrap(pointAngleRad - ap.orientationRad);
        if (Math.abs(relativeAngleRadFwd) > ap.halfAngleRad) return null;
        const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;

        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;
        if (distSqr <= ap.neutralRadius * ap.neutralRadius) {
            return 'brake';
        } else if (distSqr <= ap.workingRadius * ap.workingRadius) {
            return accelIsDisabled ? null : 'accelerate';
        } else if (distSqr < actualRedInnerRadius * actualRedInnerRadius) {
             // Мертвая зона между accelerate/red
            return null;
        } else { // distSqr >= actualRedInnerRadius * actualRedInnerRadius
            return redCooldownActive ? null : 'red';
        }
    }

    getSnapPointForForwardArc(pointerX, pointerY) {
        if (this.getArcZoneForPoint(pointerX, pointerY) !== null) {
            return null;
        }

        const cx = this.car.x;
        const cy = this.car.y;

        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const pointerAngle = Math.atan2(dy, dx);

        const ap = this.arcParams;
        if (!ap || !this.car) return null;

        const orientation = ap.orientationRad;
        const halfAngle = ap.halfAngleRad;
        const globalStartAngle = orientation - halfAngle;
        const globalEndAngle = orientation + halfAngle;

        const angleWithin = (angle, start, end) => {
            let a = Phaser.Math.Angle.Normalize(angle);
            let s = Phaser.Math.Angle.Normalize(start);
            let e = Phaser.Math.Angle.Normalize(end);
            if (s <= e) {
                return a >= s && a <= e;
            } else {
                return a >= s || a <= e;
            }
        };

        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;

        let candidates = [];

        if (ap.innerRadius >= 0 && ap.neutralRadius > ap.innerRadius) {
            candidates.push({ zone: 'brake', radius: ap.innerRadius });
            candidates.push({ zone: 'brake', radius: ap.neutralRadius });
        }
        if (ap.neutralRadius >= 0 && ap.workingRadius > ap.neutralRadius && !accelIsDisabled) {
            candidates.push({ zone: 'accelerate', radius: ap.workingRadius });
        }
        if (ap.workingRadius >= 0 && ap.outerRadius > ap.workingRadius && !redCooldownActive) {
            const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
            if (actualRedInnerRadius > ap.workingRadius) {
                candidates.push({ zone: 'red', radius: actualRedInnerRadius });
                candidates.push({ zone: 'red', radius: ap.outerRadius });
            }
        }

        let bestCandidate = null;
        let minDistance = Number.MAX_VALUE;
        for (let candidate of candidates) {
            let candidateAngle = pointerAngle;
            if (!angleWithin(pointerAngle, globalStartAngle, globalEndAngle)) {
                let diffStart = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalStartAngle)));
                let diffEnd = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalEndAngle)));

                candidateAngle = (diffStart < diffEnd) ? globalStartAngle : globalEndAngle;
            }
            const candidateX = cx + Math.cos(candidateAngle) * candidate.radius;
            const candidateY = cy + Math.sin(candidateAngle) * candidate.radius;
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, candidateX, candidateY);
            if (dist < minDistance) {
                minDistance = dist;
                bestCandidate = { snapX: candidateX, snapY: candidateY, zone: candidate.zone };
            }
        }

        const isInActiveZone = this.isPointNearArc(pointerX, pointerY, SNAP_THRESHOLD);
        const snapThreshold = isInActiveZone ? SNAP_THRESHOLD : ENHANCED_SNAP_THRESHOLD;

        if (bestCandidate && minDistance <= snapThreshold) {
            return bestCandidate;
        }

        return null;
    }

    getSnapPointForReverseArc(pointerX, pointerY) {
        const cx = this.car.x;
        const cy = this.car.y;

        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
        const reverseOrientation = carAngleRad + Math.PI;
        const halfReverseAngle = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
        const startAngle = reverseOrientation - halfReverseAngle;
        const endAngle = reverseOrientation + halfReverseAngle;

        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const pointerAngle = Math.atan2(dy, dx);

        const innerRRev = REVERSE_ARC_INNER_RADIUS;
        const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;

        if (this.getArcZoneForPoint(pointerX, pointerY) === 'reverse') {
            return null;
        }

        const angleWithin = (angle, start, end) => {
            let a = Phaser.Math.Angle.Normalize(angle);
            let s = Phaser.Math.Angle.Normalize(start);
            let e = Phaser.Math.Angle.Normalize(end);
            if (s <= e) {
                return a >= s && a <= e;
            } else {
                return a >= s || a <= e;
            }
        };

        let candidates = [
            { zone: 'reverse', radius: innerRRev },
            { zone: 'reverse', radius: outerRRev }
        ];

        let bestCandidate = null;
        let minDistance = Number.MAX_VALUE;

        for (let candidate of candidates) {
            let candidateAngle = pointerAngle;
            if (!angleWithin(pointerAngle, startAngle, endAngle)) {
                let diffStart = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(startAngle)));
                let diffEnd = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(endAngle)));
                candidateAngle = (diffStart < diffEnd) ? startAngle : endAngle;
            }
            const candidateX = cx + Math.cos(candidateAngle) * candidate.radius;
            const candidateY = cy + Math.sin(candidateAngle) * candidate.radius;
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, candidateX, candidateY);
            if (dist < minDistance) {
                minDistance = dist;
                bestCandidate = { snapX: candidateX, snapY: candidateY, zone: candidate.zone };
            }
        }

        const isInActiveZone = this.isPointNearArc(pointerX, pointerY, SNAP_THRESHOLD);
        const snapThreshold = isInActiveZone ? SNAP_THRESHOLD : ENHANCED_SNAP_THRESHOLD;

        if (bestCandidate && minDistance <= snapThreshold) {
            return bestCandidate;
        }
        return null;
    }

    isPointNearArc(pointX, pointY, thresholdDistance) {
        if (!this.car || !this.arcParams) {
            return false;
        }

        const carX = this.car.x;
        const carY = this.car.y;
        const dx = pointX - carX;
        const dy = pointY - carY;
        const distSqr = dx * dx + dy * dy;
        const dist = Math.sqrt(distSqr);
        const pointAngleRad = Math.atan2(dy, dx);
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        const ap = this.arcParams;

        if (!ap || typeof ap.innerRadius !== 'number' || typeof ap.outerRadius !== 'number' || typeof ap.orientationRad !== 'number' || typeof ap.halfAngleRad !== 'number' || typeof ap.neutralRadius !== 'number') {
            return false;
        }

        let isNear = false;

        if (ap.outerRadius > ap.innerRadius && ap.halfAngleRad > 0 && ap.innerRadius >= 0) {
            const minRadiusCheck = Math.max(0, ap.innerRadius - thresholdDistance);
            const maxRadiusCheck = ap.outerRadius + thresholdDistance;
            const orientation = ap.orientationRad;
            const baseHalfAngle = ap.halfAngleRad;

            const angularBuffer = (ap.neutralRadius > 1) ? Math.atan(thresholdDistance / ap.neutralRadius) : Phaser.Math.DegToRad(10);
            const effectiveHalfAngle = baseHalfAngle + angularBuffer;

            const relativeAngleRadFwd = Phaser.Math.Angle.Wrap(pointAngleRad - orientation);

            const checkRadius = dist >= minRadiusCheck && dist <= maxRadiusCheck;
            const checkAngle = Math.abs(relativeAngleRadFwd) <= effectiveHalfAngle;

            if (checkRadius && checkAngle) {
                isNear = true;
            }
        }

        if (!isNear && currentSpeed === MIN_SPEED) {
            const reverseOrientationRad = carAngleRad + Math.PI;
            const baseHalfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            const midRRev = innerRRev + REVERSE_ARC_THICKNESS / 2;

            const minRadiusRevCheck = Math.max(0, innerRRev - thresholdDistance);
            const maxRadiusRevCheck = outerRRev + thresholdDistance;

            const angularBufferRev = (midRRev > 1) ? Math.atan(thresholdDistance / midRRev) : Phaser.Math.DegToRad(10);
            const effectiveHalfAngleRev = baseHalfReverseAngleRad + angularBufferRev;

            const relativeAngleRadRev = Phaser.Math.Angle.Wrap(pointAngleRad - reverseOrientationRad);

            const checkRadiusRev = dist >= minRadiusRevCheck && dist <= maxRadiusRevCheck;
            const checkAngleRev = Math.abs(relativeAngleRadRev) <= effectiveHalfAngleRev;

            if (checkRadiusRev && checkAngleRev) {
                isNear = true;
            }
        }

        return isNear;
    }

    handlePointerMove(pointer) {
        if (!this.trajectoryGraphics || !this.ghostCar || !this.controlArcGraphics || !this.car) {
            return;
        }

        const pointerX = pointer.worldX;
        const pointerY = pointer.worldY;

        let snapResult = null;
        let newZone = this.getArcZoneForPoint(pointerX, pointerY);

        if (!newZone) {
            if (this.car.getData('speed') === MIN_SPEED) {
                snapResult = this.getSnapPointForReverseArc(pointerX, pointerY);
                if (snapResult) {
                    newZone = snapResult.zone;
                }
            }
            if (!newZone) {
                snapResult = this.getSnapPointForForwardArc(pointerX, pointerY);
                if (snapResult) {
                    newZone = snapResult.zone;
                }
            }
        }

        const isDraggingEmpty = this.scene?.draggingFromEmptySpace && pointer.isDown;
        let keepCursor = false;

        if (!newZone && isDraggingEmpty) {
            keepCursor = true;
        }

        if (newZone !== this.hoveredArcZone) {
            this.hoveredArcZone = newZone;
            this.drawControlArc();
        }

        if (this.hoveredArcZone || keepCursor) {
            this.scene.game.canvas.style.cursor = 'pointer';

            let displayX = pointerX;
            let displayY = pointerY;

            if (snapResult && snapResult.snapX !== undefined) {
                displayX = snapResult.snapX;
                displayY = snapResult.snapY;
            }

            if (this.snapCursor) {
                this.snapCursor.clear();
                this.snapCursor.fillStyle(0xffffff, 1);
                this.snapCursor.fillCircle(displayX, displayY, 3.5);
            }

            let targetX, targetY, targetAngleRad;
            const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

            if (this.hoveredArcZone === 'reverse') {
                const reverseAngleRad = carAngleRad + Math.PI;
                targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                targetAngleRad = carAngleRad;
            } else {
                const td = this.calculateTargetFromArcPoint(displayX, displayY);
                if (!td) {
                    this.ghostCar.setVisible(false);
                    this.trajectoryGraphics.clear();
                    return;
                }
                targetX = td.targetX;
                targetY = td.targetY;
                targetAngleRad = td.targetAngleRad;
            }

            if (this.ghostCar) {
                this.ghostCar.setPosition(targetX, targetY)
                    .setAngle(Phaser.Math.RadToDeg(targetAngleRad))
                    .setVisible(true);
            }

            this.drawTrajectory(this.car.x, this.car.y, targetX, targetY);

        } else {
            if (this.ghostCar) this.ghostCar.setVisible(false);
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
            if (this.snapCursor) this.snapCursor.clear();
            if (this.scene.game.canvas) this.scene.game.canvas.style.cursor = 'default';
        }
    }

    // --- Методы расчета движения ---

    drawTrajectory(startX, startY, endX, endY) {
        if (!this.trajectoryGraphics) return;
        this.trajectoryGraphics.clear().lineStyle(2, TRAJECTORY_COLOR, TRAJECTORY_ALPHA);
        const dist = Phaser.Math.Distance.Between(startX, startY, endX, endY);
        const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
        const dashLen = TRAJECTORY_DASH_LENGTH;
        const gapLen = TRAJECTORY_GAP_LENGTH;
        const totalPatternLen = dashLen + gapLen;
        let currentDist = 0;
        this.trajectoryGraphics.beginPath();
        while (currentDist < dist) {
            const dStartX = startX + Math.cos(angle) * currentDist;
            const dStartY = startY + Math.sin(angle) * currentDist;
            const dEndX = startX + Math.cos(angle) * Math.min(currentDist + dashLen, dist);
            const dEndY = startY + Math.sin(angle) * Math.min(currentDist + dashLen, dist);
            this.trajectoryGraphics.moveTo(dStartX, dStartY).lineTo(dEndX, dEndY);
            currentDist += totalPatternLen;
        }
        this.trajectoryGraphics.strokePath();
    }

    calculateTargetFromArcPoint(arcPointX, arcPointY) {
        if (!this.car || !this.arcParams?.innerRadius) return null;
        const ap = this.arcParams;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        const targetAngleRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, arcPointX, arcPointY);

        const clickDistanceCarCenter = Phaser.Math.Distance.Between(this.car.x, this.car.y, arcPointX, arcPointY);

        let relativeClickDistOverallArc = 0.5;
        const arcThickness = ap.outerRadius - ap.innerRadius;
        if (arcThickness > 0) {
            relativeClickDistOverallArc = Phaser.Math.Clamp((clickDistanceCarCenter - ap.innerRadius) / arcThickness, 0, 1);
        }

        let relativeClickDistInWorkingZone = 0;
        const workingZoneThickness = ap.workingRadius - ap.innerRadius;
        if (workingZoneThickness > 0) {
            const distFromNeutral = clickDistanceCarCenter - ap.neutralRadius;
            const halfWorkingThickness = (ap.workingRadius - ap.neutralRadius);
            if (halfWorkingThickness > 0 && distFromNeutral > 0) {
                relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfWorkingThickness, 0, 1);
            } else {
                const halfBrakeThickness = (ap.neutralRadius - ap.innerRadius);
                if (halfBrakeThickness > 0) {
                    relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfBrakeThickness, -1, 0);
                }
            }
        }

        const currentMidRadius = ap.innerRadius + arcThickness / 2;
        const baseDist = Phaser.Math.Linear(MIN_MOVE_DISTANCE_FACTOR * currentMidRadius, MAX_MOVE_DISTANCE_FACTOR * currentMidRadius, relativeClickDistOverallArc);
        const totalMoveDist = baseDist + currentSpeed * SPEED_TO_DISTANCE_MULTIPLIER;

        const targetX = this.car.x + Math.cos(targetAngleRad) * totalMoveDist;
        const targetY = this.car.y + Math.sin(targetAngleRad) * totalMoveDist;

        return {
            targetX,
            targetY,
            targetAngleRad,
            relativeClickDistOverallArc,
            relativeClickDistInWorkingZone
        };
    }

    // --- Методы инициации движения ---

    handleSceneClick(pointer) {
        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        let snapResult = null;
        let effectiveX = clickX;
        let effectiveY = clickY;

        let clickArcZone = this.getArcZoneForPoint(clickX, clickY);

        if (!clickArcZone && this.car?.getData('speed') === MIN_SPEED) {
            snapResult = this.getSnapPointForReverseArc(clickX, clickY);
            if (snapResult) {
                clickArcZone = snapResult.zone;
                effectiveX = snapResult.snapX;
                effectiveY = snapResult.snapY;
            }
        }

        if (!clickArcZone) {
            snapResult = this.getSnapPointForForwardArc(clickX, clickY);
            if (snapResult) {
                clickArcZone = snapResult.zone;
                effectiveX = snapResult.snapX;
                effectiveY = snapResult.snapY;
            } else {
                return null;
            }
        }

        let moveData = null;
        if (clickArcZone === 'reverse') {
            const reverseAngleRad = Phaser.Math.DegToRad(this.car.angle + 180);
            const targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
            const targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
            moveData = this.initiateReverseMove(targetX, targetY);

        } else {
            const targetData = this.calculateTargetFromArcPoint(effectiveX, effectiveY);
            if (targetData) {
                moveData = this.initiateForwardMove(
                    targetData.targetX,
                    targetData.targetY,
                    clickArcZone,
                    targetData.relativeClickDistOverallArc,
                    targetData.relativeClickDistInWorkingZone
                );
            }
        }

        if (moveData) {
            this.clearVisuals();
            return { moveData };
        }
        return null;
    }

    initiateForwardMove(targetX, targetY, clickArcZone, relativeClickDistOverallArc, relativeClickDistInWorkingZone) {
        if (!this.car?.body) return null;

        this.clearVisuals();

        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        let speedForNextTurn = currentSpeed;
        let nextRedCooldown = 0;
        let nextAccelDisabled = false;

        if (clickArcZone === 'accelerate' || clickArcZone === 'brake') {
            const speedFactor = (relativeClickDistInWorkingZone < 0) ? 0.75 : 1.0;
            const speedChange = relativeClickDistInWorkingZone * SPEED_INCREMENT * speedFactor;
            speedForNextTurn = currentSpeed + speedChange;
        } else if (clickArcZone === 'red') {
            speedForNextTurn = currentSpeed + RED_ZONE_SPEED_BOOST;
            nextRedCooldown = RED_ZONE_COOLDOWN_TURNS;
            nextAccelDisabled = true;
        }
        speedForNextTurn = Phaser.Math.Clamp(speedForNextTurn, MIN_SPEED, MAX_SPEED);

        this.car.setData('nextSpeed', speedForNextTurn);
        this.car.setData('nextRedCooldown', nextRedCooldown);
        this.car.setData('nextAccelDisabled', nextAccelDisabled);

        const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);
        const currentAngleDeg = this.car.angle;
        const angleToTargetRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, targetX, targetY);
        const rawTargetAngleDeg = Phaser.Math.RadToDeg(angleToTargetRad);
        const shortestAngleDiff = Phaser.Math.Angle.ShortestBetween(currentAngleDeg, rawTargetAngleDeg);
        const finalAngleDeg = currentAngleDeg + shortestAngleDiff;

        this.scene.tweens.add({
            targets: this.car,
            angle: finalAngleDeg,
            duration: TURN_DURATION,
            ease: 'Linear'
        });

        const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const animationSpeedMultiplier = Phaser.Math.Linear(MIN_ANIM_SPEED_MULTIPLIER, MAX_ANIM_SPEED_MULTIPLIER, normCurrentSpeed);
        const baseAnimSpeed = moveDistance * BASE_PHYSICS_MOVE_SPEED_FACTOR;
        const clickPosBonus = (1 + relativeClickDistOverallArc * CLICK_POS_ANIM_SPEED_FACTOR);
        const desiredPhysicsSpeed = baseAnimSpeed * clickPosBonus * animationSpeedMultiplier;
        const finalAnimSpeed = Math.max(desiredPhysicsSpeed, MIN_VISUAL_ANIM_SPEED);

        this.scene.physics.moveTo(this.car, targetX, targetY, finalAnimSpeed);
        if (this.scene.physics.world) {
            this.scene.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
        }

        const moveTime = (finalAnimSpeed > 0) ? (moveDistance / finalAnimSpeed) * 1000 : 0;

        return {
            startX: this.car.x,
            startY: this.car.y,
            fromAngleDeg: currentAngleDeg,
            finalAngleDeg,
            targetX,
            targetY,
            turnDuration: TURN_DURATION,
            moveTime
        };
    }

    initiateReverseMove(targetX, targetY) {
        if (!this.car?.body) return null;

        this.clearVisuals();

        this.car.setData('nextSpeed', MIN_SPEED);
        this.car.setData('nextRedCooldown', 0);
        this.car.setData('nextAccelDisabled', false);

        this.scene.physics.moveTo(this.car, targetX, targetY, REVERSE_SPEED_ANIMATION);
        if (this.scene.physics.world) {
            this.scene.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
        }

        const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);
        const moveTime = (REVERSE_SPEED_ANIMATION > 0) ? (moveDistance / REVERSE_SPEED_ANIMATION) * 1000 : 0;
        const currentAngleDeg = this.car.angle;

        return {
            startX: this.car.x,
            startY: this.car.y,
            fromAngleDeg: currentAngleDeg,
            finalAngleDeg: currentAngleDeg,
            targetX,
            targetY,
            turnDuration: 0,
            moveTime
        };
    }
}

