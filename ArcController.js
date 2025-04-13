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
        // ... (код метода calculateArcGuiParams из старого GameScene) ...
        // Скопируйте сюда ВЕСЬ код метода calculateArcGuiParams
        // из вашего оригинального game.js или текущего GameScene.js
        // Убедитесь, что используются this.car, а не просто car
        // Глобальные константы (MIN_SPEED, MAX_SPEED и т.д.) должны быть доступны
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
        // ... (код метода fillAnnularSector из старого GameScene) ...
        if (!graphics || !isFinite(cx) || !isFinite(cy) || !isFinite(innerR) || !isFinite(outerR) || outerR <= innerR || innerR < 0) return;
        graphics.fillStyle(color, alpha);
        graphics.beginPath();
        graphics.arc(cx, cy, outerR, startA, endA, false);
        graphics.arc(cx, cy, innerR, endA, startA, true);
        graphics.closePath();
        graphics.fillPath();
    }

    drawControlArc() {
        // ... (код метода drawControlArc из старого GameScene) ...
        // Скопируйте сюда ВЕСЬ код метода drawControlArc
        // Используйте this.controlArcGraphics, this.car, this.arcParams, this.hoveredArcZone
        // Используйте this.fillAnnularSector(...)
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
        // ... (код метода getArcZoneForPoint из старого GameScene) ...
        // Скопируйте сюда ВЕСЬ код метода getArcZoneForPoint
        // Используйте this.car, this.arcParams
        if (!this.car) return null; // Добавим проверку
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
        // ... (код метода getSnapPointForForwardArc из старого GameScene) ...
         // Если курсор находится внутри активной арки – снапинг не применяется.
        if (this.getArcZoneForPoint(pointerX, pointerY) !== null) {
            return null;
        }

        const cx = this.car.x;
        const cy = this.car.y;

        // Вычисляем расстояние и угол от центра машины до курсора.
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        // const pointerDist = Math.sqrt(dx * dx + dy * dy); // Не используется напрямую здесь
        const pointerAngle = Math.atan2(dy, dx);

        // Получаем параметры арки
        const ap = this.arcParams;
        if (!ap || !this.car) return null; // Добавил проверку this.car

        const orientation = ap.orientationRad;
        const halfAngle = ap.halfAngleRad;
        const globalStartAngle = orientation - halfAngle;
        const globalEndAngle = orientation + halfAngle;

        // Локальный хелпер для проверки, находится ли угол внутри диапазона.
        const angleWithin = (angle, start, end) => {
            let a = Phaser.Math.Angle.Normalize(angle);
            let s = Phaser.Math.Angle.Normalize(start);
            let e = Phaser.Math.Angle.Normalize(end);
            if (s <= e) {
                return a >= s && a <= e;
            } else { // Угол пересекает 0/2PI
                return a >= s || a <= e;
            }
        };

        const redCooldownActive = (this.car.getData('redCooldown') ?? 0) > 0;
        const accelIsDisabled = this.car.getData('accelDisabled') ?? false;

        let candidates = [];

        // Добавляем границы зон в кандидаты для "примагничивания"
        if (ap.innerRadius >= 0 && ap.neutralRadius > ap.innerRadius) {
            candidates.push({ zone: 'brake', radius: ap.innerRadius });
            candidates.push({ zone: 'brake', radius: ap.neutralRadius });
        }
        if (ap.neutralRadius >= 0 && ap.workingRadius > ap.neutralRadius && !accelIsDisabled) {
            // Используем ту же границу neutralRadius, что и у brake
            // candidates.push({ zone: 'accelerate', radius: ap.neutralRadius }); // Уже есть от brake
            candidates.push({ zone: 'accelerate', radius: ap.workingRadius });
        }
        if (ap.workingRadius >= 0 && ap.outerRadius > ap.workingRadius && !redCooldownActive) {
            const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
             if (actualRedInnerRadius > ap.workingRadius) { // Проверка, что red зона вообще есть
                // Используем ту же границу workingRadius, что и у accelerate
                // candidates.push({ zone: 'red', radius: ap.workingRadius }); // Уже есть от accelerate
                candidates.push({ zone: 'red', radius: actualRedInnerRadius });
                candidates.push({ zone: 'red', radius: ap.outerRadius });
             }
        }

        // Выбираем кандидата, к которому курсор ближе.
        let bestCandidate = null;
        let minDistance = Number.MAX_VALUE;
        for (let candidate of candidates) {
            let candidateAngle = pointerAngle;
            // Проверяем, нужно ли снапить угол к границе дуги
            if (!angleWithin(pointerAngle, globalStartAngle, globalEndAngle)) {
                 let diffStart = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalStartAngle)));
                 let diffEnd = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalEndAngle)));

                 // Снапим к ближайшей угловой границе
                candidateAngle = (diffStart < diffEnd) ? globalStartAngle : globalEndAngle;
            }
            // Вычисляем координаты кандидата на окружности с данным радиусом и (возможно снапнутым) углом.
            const candidateX = cx + Math.cos(candidateAngle) * candidate.radius;
            const candidateY = cy + Math.sin(candidateAngle) * candidate.radius;
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, candidateX, candidateY);
            if (dist < minDistance) {
                minDistance = dist;
                bestCandidate = { snapX: candidateX, snapY: candidateY, zone: candidate.zone };
            }
        }

        // Если минимальное расстояние от курсора до кандидата меньше порога, возвращаем его.
        if (bestCandidate && minDistance <= SNAP_THRESHOLD) {
            return bestCandidate;
        }

        return null;
    }

    getSnapPointForReverseArc(pointerX, pointerY) {
        // ... (код метода getSnapPointForReverseArc из старого GameScene) ...
        const cx = this.car.x;
        const cy = this.car.y;

        // Определяем ориентацию реверс-арки: это угол машины + 180°
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
        const reverseOrientation = carAngleRad + Math.PI;
        const halfReverseAngle = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
        const startAngle = reverseOrientation - halfReverseAngle;
        const endAngle = reverseOrientation + halfReverseAngle;

        // Вычисляем расстояние и угол от центра машины до курсора
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        // const pointerDist = Math.sqrt(dx * dx + dy * dy); // Не используется
        const pointerAngle = Math.atan2(dy, dx);

        // Определяем радиусы реверс-арки (фиксированные)
        const innerRRev = REVERSE_ARC_INNER_RADIUS;
        const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;

        // Если курсор уже находится внутри реверс-арки (по базовой логике getArcZoneForPoint),
        // то снап не нужен.
        if (this.getArcZoneForPoint(pointerX, pointerY) === 'reverse') {
            return null;
        }

        // Локальный helper для проверки, находится ли угол внутри заданного диапазона.
        const angleWithin = (angle, start, end) => {
            let a = Phaser.Math.Angle.Normalize(angle);
            let s = Phaser.Math.Angle.Normalize(start);
            let e = Phaser.Math.Angle.Normalize(end);
            if (s <= e) {
                return a >= s && a <= e;
            } else { // Угол пересекает 0/2PI
                return a >= s || a <= e;
            }
        };

        // Собираем кандидатов для снапа по границам реверс-арки
        let candidates = [
            { zone: 'reverse', radius: innerRRev },
            { zone: 'reverse', radius: outerRRev }
        ];

        let bestCandidate = null;
        let minDistance = Number.MAX_VALUE;

        // Ищем ближайшего кандидата
        for (let candidate of candidates) {
            let candidateAngle = pointerAngle;
            // Проверяем, нужно ли снапить угол к границе дуги
            if (!angleWithin(pointerAngle, startAngle, endAngle)) {
                 let diffStart = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(startAngle)));
                 let diffEnd = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(endAngle)));
                // Снапим к ближайшей угловой границе
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

        if (bestCandidate && minDistance <= SNAP_THRESHOLD) {
            return bestCandidate;
        }
        return null;
    }

     isPointNearArc(pointX, pointY, thresholdDistance) {
        // --- START DEBUG LOGGING ---
        console.log(`[DEBUG] isPointNearArc: Checking point (${pointX.toFixed(1)}, ${pointY.toFixed(1)}) with threshold ${thresholdDistance}`);
        if (!this.car || !this.arcParams) {
            console.log("[DEBUG] isPointNearArc: Car or arcParams missing, returning false.");
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

        console.log(`[DEBUG]   Car Pos: (${carX.toFixed(1)}, ${carY.toFixed(1)}), Speed: ${currentSpeed.toFixed(2)}`);
        console.log(`[DEBUG]   Point Dist: ${dist.toFixed(1)}, AngleRad: ${pointAngleRad.toFixed(2)} (${Phaser.Math.RadToDeg(pointAngleRad).toFixed(1)} deg)`);

        // Добавил проверку neutralRadius, так как он используется ниже
        if (!ap || typeof ap.innerRadius !== 'number' || typeof ap.outerRadius !== 'number' || typeof ap.orientationRad !== 'number' || typeof ap.halfAngleRad !== 'number' || typeof ap.neutralRadius !== 'number') {
             console.log("[DEBUG] isPointNearArc: Invalid arcParams (radius/angle/neutral missing?), returning false.", ap);
             return false;
        }

        let isNear = false;

        // --- Проверка передней арки ---
        console.log(`[DEBUG]   Forward Arc Params: InnerR=${ap.innerRadius.toFixed(1)}, OuterR=${ap.outerRadius.toFixed(1)}, NeutralR=${ap.neutralRadius.toFixed(1)}, OrientRad=${ap.orientationRad.toFixed(2)}, HalfAngleRad=${ap.halfAngleRad.toFixed(2)}`);

        if (ap.outerRadius > ap.innerRadius && ap.halfAngleRad > 0 && ap.innerRadius >= 0) {
            const minRadiusCheck = Math.max(0, ap.innerRadius - thresholdDistance);
            const maxRadiusCheck = ap.outerRadius + thresholdDistance;
            const orientation = ap.orientationRad;
            const baseHalfAngle = ap.halfAngleRad;

            // *** НОВОЕ: Расчет углового буфера ***
            // Приближение: угол, соответствующий thresholdDistance на нейтральном радиусе
            // Добавляем минимальный буфер (напр. 10 град), если радиус очень мал
            const angularBuffer = (ap.neutralRadius > 1) ? Math.atan(thresholdDistance / ap.neutralRadius) : Phaser.Math.DegToRad(10);
            // Эффективный полуугол = базовый + буфер
            const effectiveHalfAngle = baseHalfAngle + angularBuffer;
            console.log(`[DEBUG]     Angular Buffer Calc: atan(${thresholdDistance} / ${ap.neutralRadius.toFixed(1)}) = ${angularBuffer.toFixed(2)} rad`);
            console.log(`[DEBUG]     Effective Half Angle: ${baseHalfAngle.toFixed(2)} + ${angularBuffer.toFixed(2)} = ${effectiveHalfAngle.toFixed(2)}`);
            // *** КОНЕЦ НОВОГО ***

            const relativeAngleRadFwd = Phaser.Math.Angle.Wrap(pointAngleRad - orientation);

            const checkRadius = dist >= minRadiusCheck && dist <= maxRadiusCheck;
            // *** ИЗМЕНЕНО: Используем effectiveHalfAngle для проверки ***
            const checkAngle = Math.abs(relativeAngleRadFwd) <= effectiveHalfAngle;

            console.log(`[DEBUG]   Forward Check: MinR_Check=${minRadiusCheck.toFixed(1)}, MaxR_Check=${maxRadiusCheck.toFixed(1)}, RelAngle=${relativeAngleRadFwd.toFixed(2)} (vs Effective ${effectiveHalfAngle.toFixed(2)})`);
            console.log(`[DEBUG]     Radius Check (${minRadiusCheck.toFixed(1)} <= ${dist.toFixed(1)} <= ${maxRadiusCheck.toFixed(1)}): ${checkRadius}`);
            // Лог теперь использует effectiveHalfAngle
            console.log(`[DEBUG]     Angle Check (|${relativeAngleRadFwd.toFixed(2)}| <= ${effectiveHalfAngle.toFixed(2)}): ${checkAngle}`);

            if (checkRadius && checkAngle) {
                console.log("[DEBUG]     => NEAR (Forward)");
                isNear = true;
            } else {
                 console.log("[DEBUG]     => NOT NEAR (Forward)");
            }
        } else {
            console.log("[DEBUG]   Forward Check: Skipped (invalid params or zero size)");
        }

        // --- Проверка задней арки (только если скорость минимальна) ---
        if (!isNear && currentSpeed === MIN_SPEED) {
            console.log("[DEBUG]   Checking Reverse Arc...");
            const reverseOrientationRad = carAngleRad + Math.PI;
            const baseHalfReverseAngleRad = Phaser.Math.DegToRad(REVERSE_ARC_ANGLE_DEG / 2);
            const innerRRev = REVERSE_ARC_INNER_RADIUS;
            const outerRRev = innerRRev + REVERSE_ARC_THICKNESS;
            // Используем средний радиус для расчета буфера задней арки
            const midRRev = innerRRev + REVERSE_ARC_THICKNESS / 2;

            const minRadiusRevCheck = Math.max(0, innerRRev - thresholdDistance);
            const maxRadiusRevCheck = outerRRev + thresholdDistance;
            console.log(`[DEBUG]   Reverse Arc Params: InnerR=${innerRRev.toFixed(1)}, OuterR=${outerRRev.toFixed(1)}, OrientRad=${reverseOrientationRad.toFixed(2)}, HalfAngleRad=${baseHalfReverseAngleRad.toFixed(2)}`);

             // *** НОВОЕ: Расчет углового буфера для задней арки ***
            const angularBufferRev = (midRRev > 1) ? Math.atan(thresholdDistance / midRRev) : Phaser.Math.DegToRad(10);
            const effectiveHalfAngleRev = baseHalfReverseAngleRad + angularBufferRev;
            console.log(`[DEBUG]     Angular Buffer Calc (Rev): atan(${thresholdDistance} / ${midRRev.toFixed(1)}) = ${angularBufferRev.toFixed(2)} rad`);
            console.log(`[DEBUG]     Effective Half Angle (Rev): ${baseHalfReverseAngleRad.toFixed(2)} + ${angularBufferRev.toFixed(2)} = ${effectiveHalfAngleRev.toFixed(2)}`);
             // *** КОНЕЦ НОВОГО ***

            const relativeAngleRadRev = Phaser.Math.Angle.Wrap(pointAngleRad - reverseOrientationRad);

            const checkRadiusRev = dist >= minRadiusRevCheck && dist <= maxRadiusRevCheck;
            // *** ИЗМЕНЕНО: Используем effectiveHalfAngleRev для проверки ***
            const checkAngleRev = Math.abs(relativeAngleRadRev) <= effectiveHalfAngleRev;

            console.log(`[DEBUG]   Reverse Check: MinR_Check=${minRadiusRevCheck.toFixed(1)}, MaxR_Check=${maxRadiusRevCheck.toFixed(1)}, RelAngle=${relativeAngleRadRev.toFixed(2)} (vs Effective ${effectiveHalfAngleRev.toFixed(2)})`);
            console.log(`[DEBUG]     Radius Check (${minRadiusRevCheck.toFixed(1)} <= ${dist.toFixed(1)} <= ${maxRadiusRevCheck.toFixed(1)}): ${checkRadiusRev}`);
            // Лог теперь использует effectiveHalfAngleRev
            console.log(`[DEBUG]     Angle Check (|${relativeAngleRadRev.toFixed(2)}| <= ${effectiveHalfAngleRev.toFixed(2)}): ${checkAngleRev}`);

            if (checkRadiusRev && checkAngleRev) {
                console.log("[DEBUG]     => NEAR (Reverse)");
                isNear = true;
            } else {
                 console.log("[DEBUG]     => NOT NEAR (Reverse)");
            }
        } else if (!isNear) {
             console.log("[DEBUG]   Reverse Check: Skipped (already near or speed > min)");
        }

        console.log(`[DEBUG] isPointNearArc: Final Result = ${isNear}`);
        // --- END DEBUG LOGGING ---
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

        // Если указатель вне арки – проверяем, попадает ли он в магнитную зону
        if (!newZone) {
            // Если машина стоит на месте, проверяем реверс-арку
            if (this.car.getData('speed') === MIN_SPEED) {
                snapResult = this.getSnapPointForReverseArc(pointerX, pointerY);
                if (snapResult) {
                    newZone = snapResult.zone;
                }
            }
            // Если не нашли в реверсе (или машина не стоит), проверяем основную
            if (!newZone) {
                snapResult = this.getSnapPointForForwardArc(pointerX, pointerY);
                if (snapResult) {
                    newZone = snapResult.zone;
                }
            }
        }

        // --- Проверяем, нужно ли нам в принципе очищать арку ---
        // Если мы *не* нашли никакой зоны/снап, но при этом GameScene говорит, что
        // мы "тащим из пустого места" и ЛКМ ещё зажата – можно оставить курсор на месте,
        // чтобы не пропадал визуально. Иначе будет "моргание".
        const isDraggingEmpty = this.scene?.draggingFromEmptySpace && pointer.isDown;
        let keepCursor = false;

        if (!newZone && isDraggingEmpty) {
            // Говорим "не чисти"
            keepCursor = true;
        }

        if (newZone !== this.hoveredArcZone) {
            this.hoveredArcZone = newZone;
            this.drawControlArc();
        }

        // Если у нас есть зона (или мы "держим" курсор принудительно)
        if (this.hoveredArcZone || keepCursor) {
            this.scene.game.canvas.style.cursor = 'pointer';

            // Определяем точку для отображения (либо реальный курсор, либо snap-координаты)
            let displayX = pointerX;
            let displayY = pointerY;

            if (snapResult && snapResult.snapX !== undefined) {
                displayX = snapResult.snapX;
                displayY = snapResult.snapY;
            }

            // Рисуем курсор
            if (this.snapCursor) {
                this.snapCursor.clear();
                this.snapCursor.fillStyle(0xffffff, 1);
                this.snapCursor.fillCircle(displayX, displayY, 3.5);
            }

            // И показываем призрак
            let targetX, targetY, targetAngleRad;
            const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

            if (this.hoveredArcZone === 'reverse') {
                // Для реверса цель всегда одна и та же
                const reverseAngleRad = carAngleRad + Math.PI;
                targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                targetAngleRad = carAngleRad;
            } else {
                // Для остальных зон цель зависит от точки
                const td = this.calculateTargetFromArcPoint(displayX, displayY);
                if (!td) {
                    // Если не удалось
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
            // Если не в зоне/не держим, скрываем призрака, очищаем траекторию, курсор
            if (this.ghostCar) this.ghostCar.setVisible(false);
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
            if (this.snapCursor) this.snapCursor.clear();
            if (this.scene.game.canvas) this.scene.game.canvas.style.cursor = 'default';
        }
    }



    // --- Методы расчета движения ---

    drawTrajectory(startX, startY, endX, endY) {
        // ... (код метода drawTrajectory из старого GameScene) ...
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
        // ... (код метода calculateTargetFromArcPoint из старого GameScene) ...
        // Скопируйте сюда ВЕСЬ код метода calculateTargetFromArcPoint
        // Используйте this.car, this.arcParams
         if (!this.car || !this.arcParams?.innerRadius) return null;
        const ap = this.arcParams;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;

        // Угол от центра машины к точке на дуге - это угол поворота
        const targetAngleRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, arcPointX, arcPointY);

        // Расстояние от центра машины до точки клика на дуге
        const clickDistanceCarCenter = Phaser.Math.Distance.Between(this.car.x, this.car.y, arcPointX, arcPointY);

        // Нормализуем позицию клика относительно всей толщины дуги (от 0 до 1)
        let relativeClickDistOverallArc = 0.5; // По умолчанию середина
        const arcThickness = ap.outerRadius - ap.innerRadius;
        if (arcThickness > 0) {
            relativeClickDistOverallArc = Phaser.Math.Clamp((clickDistanceCarCenter - ap.innerRadius) / arcThickness, 0, 1);
        }

         // Нормализуем позицию клика относительно "рабочей" зоны (accelerate/brake) от -1 до 1
         // где -1 - край brake, 0 - neutral, 1 - край accelerate
        let relativeClickDistInWorkingZone = 0;
        const workingZoneThickness = ap.workingRadius - ap.innerRadius; // Полная толщина brake + accelerate
        if (workingZoneThickness > 0) {
             // Расстояние от нейтральной линии (0 соответствует ap.neutralRadius)
             const distFromNeutral = clickDistanceCarCenter - ap.neutralRadius;
             // Нормализуем относительно половины толщины рабочей зоны
             const halfWorkingThickness = (ap.workingRadius - ap.neutralRadius); // толщина accelerate
             if (halfWorkingThickness > 0 && distFromNeutral > 0) { // accelerate zone
                relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfWorkingThickness, 0, 1);
             } else { // brake zone (distFromNeutral <= 0)
                const halfBrakeThickness = (ap.neutralRadius - ap.innerRadius); // толщина brake
                if (halfBrakeThickness > 0) {
                     relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfBrakeThickness, -1, 0);
                }
             }
        }

        // Рассчитываем дистанцию хода
        const currentMidRadius = ap.innerRadius + arcThickness / 2; // Средний радиус текущей дуги
        // Базовая дистанция зависит от относительного положения клика на всей дуге
        const baseDist = Phaser.Math.Linear(MIN_MOVE_DISTANCE_FACTOR * currentMidRadius, MAX_MOVE_DISTANCE_FACTOR * currentMidRadius, relativeClickDistOverallArc);
        // Добавляем бонус от скорости
        const totalMoveDist = baseDist + currentSpeed * SPEED_TO_DISTANCE_MULTIPLIER;

        // Рассчитываем координаты цели
        const targetX = this.car.x + Math.cos(targetAngleRad) * totalMoveDist;
        const targetY = this.car.y + Math.sin(targetAngleRad) * totalMoveDist;

        return {
            targetX,
            targetY,
            targetAngleRad, // Угол, куда машина должна повернуться
            relativeClickDistOverallArc, // Для расчета скорости анимации
            relativeClickDistInWorkingZone // Для расчета изменения скорости машины
        };
    }

    // --- Методы инициации движения ---


        handleSceneClick(pointer) {
        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        let snapResult = null;
        let effectiveX = clickX;
        let effectiveY = clickY;

        // Определяем зону клика, учитывая "примагничивание"
        let clickArcZone = this.getArcZoneForPoint(clickX, clickY);

        // Попытка примагничивания к реверс-арке (только если speed == MIN_SPEED)
        if (!clickArcZone && this.car?.getData('speed') === MIN_SPEED) {
            snapResult = this.getSnapPointForReverseArc(clickX, clickY);
            if (snapResult) {
                clickArcZone = snapResult.zone;
                effectiveX = snapResult.snapX;
                effectiveY = snapResult.snapY;
            }
        }

        // Если всё ещё нет зоны – попробуем снап к передней арке
        if (!clickArcZone) {
            snapResult = this.getSnapPointForForwardArc(clickX, clickY);
            if (snapResult) {
                clickArcZone = snapResult.zone;
                effectiveX = snapResult.snapX;
                effectiveY = snapResult.snapY;
            } else {
                // Если не попали ни в арку, ни в магнитные зоны – не двигаем машину
                console.log("ArcController: Clicked empty space (no zone). No move initiated.");
                return null;
            }
        }

        // На этом этапе clickArcZone точно не null
        let moveData = null;
        if (clickArcZone === 'reverse') {
            console.log("ArcController: Clicked REVERSE arc");
            const reverseAngleRad = Phaser.Math.DegToRad(this.car.angle + 180);
            const targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
            const targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
            moveData = this.initiateReverseMove(targetX, targetY);

        } else {
            // Обычный передний ход: brake / accelerate / red
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
         // ... (код метода handleMove из старого GameScene, НО без установки isMoving и без расхода топлива) ...
         // Должен возвращать объект с данными для истории
         if (!this.car?.body) return null; // Проверка

        this.clearVisuals(); // Очищаем элементы управления

        // --- Расчет и установка данных для СЛЕДУЮЩЕГО хода ---
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        let speedForNextTurn = currentSpeed;
        let nextRedCooldown = 0; // По умолчанию сбрасываем
        let nextAccelDisabled = false; // По умолчанию разрешено

        if (clickArcZone === 'accelerate' || clickArcZone === 'brake') {
            const speedFactor = (relativeClickDistInWorkingZone < 0) ? 0.75 : 1.0; // Мягче тормозим?
            const speedChange = relativeClickDistInWorkingZone * SPEED_INCREMENT * speedFactor;
            speedForNextTurn = currentSpeed + speedChange;
            // nextRedCooldown = undefined; // Явный сброс не нужен, т.к. по умолч. 0
            // nextAccelDisabled = undefined; // Явный сброс не нужен, т.к. по умолч. false
            console.log(`Controller: FORWARD Move: Click in ${clickArcZone} (RelPos: ${relativeClickDistInWorkingZone.toFixed(2)}). Speed change: ${speedChange.toFixed(2)}`);
        } else if (clickArcZone === 'red') {
            console.log("Controller: FORWARD Move: Click in RED zone. Applying boost!");
            speedForNextTurn = currentSpeed + RED_ZONE_SPEED_BOOST;
            nextRedCooldown = RED_ZONE_COOLDOWN_TURNS; // Устанавливаем кулдаун
            nextAccelDisabled = true; // Блокируем ускорение
        }
        speedForNextTurn = Phaser.Math.Clamp(speedForNextTurn, MIN_SPEED, MAX_SPEED);

        // Сохраняем планируемое состояние в данных машины
        this.car.setData('nextSpeed', speedForNextTurn);
        this.car.setData('nextRedCooldown', nextRedCooldown);
        this.car.setData('nextAccelDisabled', nextAccelDisabled);

        console.log(`Controller: FORWARD Move End: Next Turn Planned - Speed: ${speedForNextTurn.toFixed(2)}, Next Red CD: ${nextRedCooldown}, Next Accel Disabled: ${nextAccelDisabled}`);

        // --- Расчет анимации для ТЕКУЩЕГО хода ---
        const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);
        const currentAngleDeg = this.car.angle;
        const angleToTargetRad = Phaser.Math.Angle.Between(this.car.x, this.car.y, targetX, targetY);
        const rawTargetAngleDeg = Phaser.Math.RadToDeg(angleToTargetRad);
        // Находим кратчайший угол поворота
        const shortestAngleDiff = Phaser.Math.Angle.ShortestBetween(currentAngleDeg, rawTargetAngleDeg);
        const finalAngleDeg = currentAngleDeg + shortestAngleDiff;

        console.log(`Controller Rotation: Current=${currentAngleDeg.toFixed(1)}, RawTarget=${rawTargetAngleDeg.toFixed(1)}, Diff=${shortestAngleDiff.toFixed(1)}, FinalTarget=${finalAngleDeg.toFixed(1)}`);

        // Анимация поворота
        this.scene.tweens.add({
            targets: this.car,
            angle: finalAngleDeg, // Поворачиваем на рассчитанный конечный угол
            duration: TURN_DURATION, // Фиксированная длительность поворота
            ease: 'Linear' // Или 'Sine.easeInOut'
        });

        // Расчет скорости анимации движения
        const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const animationSpeedMultiplier = Phaser.Math.Linear(MIN_ANIM_SPEED_MULTIPLIER, MAX_ANIM_SPEED_MULTIPLIER, normCurrentSpeed);
        const baseAnimSpeed = moveDistance * BASE_PHYSICS_MOVE_SPEED_FACTOR; // Базовая скорость зависит от дистанции
        // Бонус скорости от дальности клика по дуге
        const clickPosBonus = (1 + relativeClickDistOverallArc * CLICK_POS_ANIM_SPEED_FACTOR);
        const desiredPhysicsSpeed = baseAnimSpeed * clickPosBonus * animationSpeedMultiplier;
        // Финальная скорость анимации (с минимальным порогом)
        const finalAnimSpeed = Math.max(desiredPhysicsSpeed, MIN_VISUAL_ANIM_SPEED);

        console.log(`Controller Animation Speed: normCurrentSpeed=${normCurrentSpeed.toFixed(2)}, animMultiplier=${animationSpeedMultiplier.toFixed(2)}, baseAnim=${baseAnimSpeed.toFixed(2)}, clickBonus=${clickPosBonus.toFixed(2)}, finalAnimSpeed=${finalAnimSpeed.toFixed(2)}`);

        // Запуск физики движения к цели
        this.scene.physics.moveTo(this.car, targetX, targetY, finalAnimSpeed);
        // Сохраняем цель для проверки в update сцены
        if (this.scene.physics.world) {
            this.scene.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
        }

        // Рассчитываем время движения для истории
        const moveTime = (finalAnimSpeed > 0) ? (moveDistance / finalAnimSpeed) * 1000 : 0;

        // Возвращаем данные для добавления в историю ходов
        return {
            startX: this.car.x,
            startY: this.car.y,
            fromAngleDeg: currentAngleDeg,
            finalAngleDeg, // Угол, к которому машина повернется
            targetX,
            targetY,
            turnDuration: TURN_DURATION, // Длительность поворота
            moveTime // Расчетное время движения
        };
    }

    initiateReverseMove(targetX, targetY) {
        // ... (код метода handleReverseMove из старого GameScene, НО без установки isMoving и без расхода топлива) ...
        // Должен возвращать объект с данными для истории
        if (!this.car?.body) return null;

        console.log("Controller: Executing REVERSE Move");
        this.clearVisuals(); // Очищаем элементы управления

        // Устанавливаем состояние для СЛЕДУЮЩЕГО хода (после реверса машина стоит)
        this.car.setData('nextSpeed', MIN_SPEED);
        this.car.setData('nextRedCooldown', 0); // Сбрасываем кулдаун
        this.car.setData('nextAccelDisabled', false); // Разрешаем ускорение
        console.log(`Controller: REVERSE Move: Next Turn Planned - Speed: ${MIN_SPEED.toFixed(2)}, Resetting Cooldowns.`);

        // Запускаем движение назад
        this.scene.physics.moveTo(this.car, targetX, targetY, REVERSE_SPEED_ANIMATION);
        // Сохраняем цель для проверки в update сцены
        if (this.scene.physics.world) {
            this.scene.physics.world.destination = new Phaser.Math.Vector2(targetX, targetY);
        }

        // Рассчитываем время движения для истории
        const moveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY);
        const moveTime = (REVERSE_SPEED_ANIMATION > 0) ? (moveDistance / REVERSE_SPEED_ANIMATION) * 1000 : 0;
        const currentAngleDeg = this.car.angle; // Угол не меняется

        // Возвращаем данные для добавления в историю ходов
        return {
            startX: this.car.x,
            startY: this.car.y,
            fromAngleDeg: currentAngleDeg,
            finalAngleDeg: currentAngleDeg, // Угол не меняется
            targetX,
            targetY,
            turnDuration: 0, // Поворота нет
            moveTime
        };
    }

} // Конец класса ArcController

