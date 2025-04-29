// ArcController.js

class ArcController {
    constructor(scene, car, controlArcGraphics, trajectoryGraphics, ghostCar, snapCursor) {
        this.scene = scene;             // Ссылка на основную сцену
        this.car = car;                 // Ссылка на спрайт машины
        this.controlArcGraphics = controlArcGraphics; // Графика для дуги
        this.trajectoryGraphics = trajectoryGraphics; // Графика для траектории
        this.ghostCar = ghostCar;         // Спрайт "призрака"
        this.snapCursor = snapCursor;       // Графика для точки "примагничивания"

        this.arcParams = {};          // Параметры текущей дуги (GUI)
        this.hoveredArcZone = null;   // Зона дуги под курсором
        this.currentArcData = null;   // Данные для отрисовки траектории и движения
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

    // Новый метод для отрисовки сектора с использованием текстуры
    fillAnnularSectorWithTexture(graphics, cx, cy, innerR, outerR, startA, endA, texture, alpha) {
        if (!graphics || !isFinite(cx) || !isFinite(cy) || !isFinite(innerR) || !isFinite(outerR) || outerR <= innerR || innerR < 0) return;
        
        // Создаем маску в виде сектора
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.arc(cx, cy, outerR, startA, endA, false);
        graphics.arc(cx, cy, innerR, endA, startA, true);
        graphics.closePath();
        graphics.fillPath();
        
        // Используем графику как маску для текстуры
        const textureImg = this.scene.textures.get(texture).getSourceImage();
        if (!textureImg) return;
        
        // Размеры текстуры и масштаб
        const textureSize = Math.max(outerR * 2, outerR * 2);
        const scale = textureSize / Math.max(textureImg.width, textureImg.height);
        
        // Отображаем текстуру через маску
        graphics.generateTexture(texture, cx - textureSize/2, cy - textureSize/2, textureSize, textureSize);
        
        // Прозрачность для текстуры
        if (alpha < 1) {
            graphics.alpha = alpha;
        }
    }

    drawControlArc() {
        if (!this.controlArcGraphics || !this.car) return;
        const ap = this.arcParams;
        this.controlArcGraphics.clear();
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        const nitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        const hovered = this.hoveredArcZone;
        const HOVER_ALPHA = ZONE_ALPHA_HOVER;
        const DEFAULT_RED_ALPHA = ZONE_ALPHA_DEFAULT;
        const DEFAULT_ACCEL_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_BRAKE_ALPHA = ZONE_ALPHA_DEFAULT + 0.1;
        const DEFAULT_REVERSE_ALPHA = ZONE_ALPHA_DEFAULT + 0.2;

        // Очищаем предыдущие спрайты с текстурами
        this.scene.children.list
            .filter(child => child.texture && 
                  (child.texture.key === ARC_SLOW_KEY || child.texture.key === ARC_GO_KEY) &&
                  child._arcUI === true)
            .forEach(sprite => sprite.destroy());

        if (ap && ap.outerRadius > ap.innerRadius && ap.halfAngleRad > 0 && ap.innerRadius >= 0) {
            const startAngle = ap.orientationRad - ap.halfAngleRad;
            const endAngle = ap.orientationRad + ap.halfAngleRad;
            
            // Рисуем нитро-зону
            if (ap.workingRadius < ap.outerRadius && nitroAvailable) {
                const redInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
                if (redInnerRadius < ap.outerRadius) {
                    const alpha = (hovered === 'red') ? HOVER_ALPHA : DEFAULT_RED_ALPHA;
                    this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, redInnerRadius, ap.outerRadius, startAngle, endAngle, COLOR_NITRO, alpha);
                }
            }

            // Рисуем зону ускорения
            if (ap.neutralRadius < ap.workingRadius) {
                const alpha = (hovered === 'accelerate') ? HOVER_ALPHA : DEFAULT_ACCEL_ALPHA;
                
                // Используем текстуру для зоны ускорения если она доступна
                if (this.scene.textures.exists(ARC_GO_KEY)) {
                    // Сначала создаем маску для текстуры
                    const maskGraphics = this.scene.make.graphics({x: 0, y: 0, add: false});
                    
                    // Рисуем форму сектора в маске
                    maskGraphics.fillStyle(0xffffff);
                    maskGraphics.beginPath();
                    maskGraphics.arc(ap.centerX, ap.centerY, ap.workingRadius, startAngle, endAngle, false);
                    maskGraphics.arc(ap.centerX, ap.centerY, ap.neutralRadius, endAngle, startAngle, true);
                    maskGraphics.closePath();
                    maskGraphics.fillPath();
                    
                    // Создаем геометрическую маску
                    const mask = maskGraphics.createGeometryMask();
                    
                    // Создаем спрайт текстуры
                    const diameter = Math.max(ap.workingRadius * 2, ap.workingRadius * 2);
                    const textureSprite = this.scene.add.image(ap.centerX, ap.centerY, ARC_GO_KEY)
                        .setOrigin(0.5, 0.5)
                        .setAlpha(alpha)
                        .setScale(diameter / Math.max(
                            this.scene.textures.get(ARC_GO_KEY).source[0].width,
                            this.scene.textures.get(ARC_GO_KEY).source[0].height
                        ));
                    
                    // Помечаем спрайт как элемент UI арки для последующего управления
                    textureSprite._arcUI = true;
                    
                    // Применяем маску к спрайту
                    textureSprite.setMask(mask);
                    
                    // Игнорируем этот спрайт UI камерой, если она существует
                    if (this.scene.uiCamera) {
                        this.scene.uiCamera.ignore(textureSprite);
                    }
                } else {
                    // Запасной вариант - цвет
                    this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.neutralRadius, ap.workingRadius, startAngle, endAngle, COLOR_ACCELERATE, alpha);
                }
            }

            // Рисуем зону торможения
            if (ap.innerRadius < ap.neutralRadius) {
                const alpha = (hovered === 'brake') ? HOVER_ALPHA : DEFAULT_BRAKE_ALPHA;
                
                // Используем текстуру для зоны торможения если она доступна
                if (this.scene.textures.exists(ARC_SLOW_KEY)) {
                    // Сначала создаем маску для текстуры
                    const maskGraphics = this.scene.make.graphics({x: 0, y: 0, add: false});
                    
                    // Рисуем форму сектора в маске
                    maskGraphics.fillStyle(0xffffff);
                    maskGraphics.beginPath();
                    maskGraphics.arc(ap.centerX, ap.centerY, ap.neutralRadius, startAngle, endAngle, false);
                    maskGraphics.arc(ap.centerX, ap.centerY, ap.innerRadius, endAngle, startAngle, true);
                    maskGraphics.closePath();
                    maskGraphics.fillPath();
                    
                    // Создаем геометрическую маску
                    const mask = maskGraphics.createGeometryMask();
                    
                    // Создаем спрайт текстуры
                    const diameter = Math.max(ap.neutralRadius * 2, ap.neutralRadius * 2);
                    const textureSprite = this.scene.add.image(ap.centerX, ap.centerY, ARC_SLOW_KEY)
                        .setOrigin(0.5, 0.5)
                        .setAlpha(alpha)
                        .setScale(diameter / Math.max(
                            this.scene.textures.get(ARC_SLOW_KEY).source[0].width,
                            this.scene.textures.get(ARC_SLOW_KEY).source[0].height
                        ));
                    
                    // Помечаем спрайт как элемент UI арки для последующего управления
                    textureSprite._arcUI = true;
                    
                    // Применяем маску к спрайту
                    textureSprite.setMask(mask);
                    
                    // Игнорируем этот спрайт UI камерой, если она существует
                    if (this.scene.uiCamera) {
                        this.scene.uiCamera.ignore(textureSprite);
                    }
                } else {
                    // Запасной вариант - цвет
                    this.fillAnnularSector(this.controlArcGraphics, ap.centerX, ap.centerY, ap.innerRadius, ap.neutralRadius, startAngle, endAngle, COLOR_BRAKE, alpha);
                }
            }
        }

        // Рисуем задний ход
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
        this.currentArcData = null; // Сбрасываем данные дуги при отрисовке состояния
        if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
        if (this.snapCursor) this.snapCursor.clear();
    }

    // Сбрасывает и очищает визуальные элементы управления (дуга, траектория...)
    // Вызывается сценой, когда машина начинает движение или игра окончена
    clearVisuals() {
        if (this.controlArcGraphics) this.controlArcGraphics.clear();
        if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
        if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
        if (this.snapCursor) this.snapCursor.clear();
        this.hoveredArcZone = null;
        this.currentArcData = null; // Очищаем данные текущей дуги
        
        // Очищаем временные спрайты текстур
        if (this.scene) {
            this.scene.children.list
                .filter(child => child.texture && 
                      (child.texture.key === ARC_SLOW_KEY || child.texture.key === ARC_GO_KEY) &&
                      child._arcUI === true)
                .forEach(sprite => sprite.destroy());
        }
        
        if (this.scene?.game?.canvas) { // Убираем кастомный курсор, если он был
             this.scene.game.canvas.style.cursor = 'default';
        }
    }

    // Сбрасывает состояние для следующего хода (вызывается из finishMove сцены)
    resetForNextTurn(pointer) {
        // Очищаем временные спрайты текстур перед перерисовкой
        if (this.scene) {
            this.scene.children.list
                .filter(child => child.texture && 
                      (child.texture.key === ARC_SLOW_KEY || child.texture.key === ARC_GO_KEY) &&
                      child._arcUI === true)
                .forEach(sprite => sprite.destroy());
        }
        
        this.drawState(); // Перерисовываем GUI арку
        // Обновляем состояние ховера/призрака/траектории на основе текущей позиции курсора
        if (pointer) {
            this.handlePointerMove(pointer); // Это обновит currentArcData, если нужно
        } else {
             this.currentArcData = null; // Сбрасываем данные, если нет указателя
             if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
             if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
             if (this.snapCursor) this.snapCursor.clear();
             if (this.scene.game.canvas) this.scene.game.canvas.style.cursor = 'default';
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

        const nitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        
        if (distSqr <= ap.neutralRadius * ap.neutralRadius) {
            return 'brake';
        } else if (distSqr <= ap.workingRadius * ap.workingRadius) {
            return 'accelerate';
        } else if (distSqr < actualRedInnerRadius * actualRedInnerRadius) {
             // Мертвая зона между accelerate/red
            return null;
        } else { // distSqr >= actualRedInnerRadius * actualRedInnerRadius
            return !nitroAvailable ? null : 'red';
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

        const nitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;

        let candidates = [];

        if (ap.innerRadius >= 0) {
            candidates.push({ zone: 'brake', radius: ap.innerRadius });
        }
        if (ap.workingRadius > 0) {
            candidates.push({ zone: 'accelerate', radius: ap.workingRadius });
        }
        if (ap.workingRadius >= 0 && ap.outerRadius > ap.workingRadius && nitroAvailable) {
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
            this.currentArcData = null; // Очистить данные, если не можем обработать
            return;
        }

        const pointerX = pointer.worldX;
        const pointerY = pointer.worldY;

        let snapResult = null;
        let newZone = this.getArcZoneForPoint(pointerX, pointerY);
        let effectiveX = pointerX;
        let effectiveY = pointerY;

        // Проверяем, используется ли альтернативное управление (перетаскивание из пустой области)
        const isDraggingEmpty = this.scene?.draggingFromEmptySpace && pointer.isDown;

        // Логика примагничивания к краям/центрам зон
        if (!newZone) {
            if (this.car.getData('speed') === MIN_SPEED) {
                snapResult = this.getSnapPointForReverseArc(pointerX, pointerY);
            }
            if (!snapResult) { // Если не задний ход или не примагнитились к нему
                snapResult = this.getSnapPointForForwardArc(pointerX, pointerY);
            }

            if (snapResult) {
                newZone = snapResult.zone; // Используем зону из результата примагничивания
                effectiveX = snapResult.snapX; // Используем примагниченные координаты
                effectiveY = snapResult.snapY;
            }
        }

        // При альтернативном управлении всегда прикрепляем к краю арки, если нет обычного snap
        // и мы не в промежутке между ускорением и нитро
        if (isDraggingEmpty && !newZone && !snapResult) {
            // Получаем ближайшую точку на арке
            const forceSnapResult = this.getForceSnapPointOnArc(pointerX, pointerY);
            if (forceSnapResult) {
                newZone = forceSnapResult.zone;
                effectiveX = forceSnapResult.snapX;
                effectiveY = forceSnapResult.snapY;
                snapResult = forceSnapResult;
            }
        }

        let keepCursor = false;

        if (!newZone && isDraggingEmpty) {
            keepCursor = true; // Сохраняем курсор-указатель при драге из пустоты
        }

        // Обновляем подсветку зоны арки
        if (newZone !== this.hoveredArcZone) {
            this.hoveredArcZone = newZone;
            this.drawControlArc(); // Перерисовываем GUI арку с новой подсветкой
        }

        // Обновляем точку примагничивания (snapCursor)
        if (this.snapCursor) {
            this.snapCursor.clear();
            if (snapResult) {
                this.snapCursor.fillStyle(0xffffff, 1);
                this.snapCursor.fillCircle(effectiveX, effectiveY, 3.5);
            } else if (this.hoveredArcZone) {
                 // Если есть зона, но нет snap'а (курсор внутри зоны), рисуем точку под курсором
                 this.snapCursor.fillStyle(0xffffff, 0.7);
                 this.snapCursor.fillCircle(pointerX, pointerY, 3.5);
            }
        }

        // Устанавливаем стиль курсора
        if (this.hoveredArcZone || keepCursor) {
             if(this.scene.game.canvas) this.scene.game.canvas.style.cursor = 'pointer';
        } else {
             if(this.scene.game.canvas) this.scene.game.canvas.style.cursor = 'default';
        }

        // Рассчитываем и отрисовываем траекторию и призрака, если курсор в активной зоне или при альтернативном управлении
        if (this.hoveredArcZone) {
            if (this.hoveredArcZone === 'reverse') {
                // Логика для заднего хода (прямая траектория)
                const carAngleRad = Phaser.Math.DegToRad(this.car.angle);
                const reverseAngleRad = carAngleRad + Math.PI;
                const targetX = this.car.x + Math.cos(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                const targetY = this.car.y + Math.sin(reverseAngleRad) * REVERSE_MOVE_DISTANCE;
                const targetAngleRad = carAngleRad; // Угол машины не меняется при заднем ходе

                this.currentArcData = {
                    isArc: false, // Помечаем, что это не дуга
                    startX: this.car.x,
                    startY: this.car.y,
                    targetX: targetX,
                    targetY: targetY,
                    targetAngleRad: targetAngleRad,
                    moveDistance: REVERSE_MOVE_DISTANCE,
                    zone: 'reverse' // Добавляем информацию о зоне
                };

                this.drawTrajectory(this.currentArcData); // Передаем объект arcData
                if (this.ghostCar) {
                    this.ghostCar.setPosition(targetX, targetY)
                        .setAngle(Phaser.Math.RadToDeg(targetAngleRad))
                        .setVisible(true);
                }

            } else {
                // Логика для переднего хода (дуга или прямая)
                // Получаем зону ДО вызова calculateTarget
                const currentZone = this.hoveredArcZone; // или snapResult?.zone, если есть snap
                const arcData = this.calculateTargetFromArcPoint(effectiveX, effectiveY, currentZone); // Передаем зону
                this.currentArcData = arcData; // Сохраняем рассчитанные данные

                // Используем более строгую проверку - убедимся, что isArc определено
                if (arcData && arcData.isArc !== undefined) {
                    this.drawTrajectory(arcData); // Рисуем прямую или дугу
                    if (this.ghostCar) {
                        // Явно используем данные из arcData
                         const displayAngle = Phaser.Math.RadToDeg(arcData.targetAngleRad);
                         const displayX = arcData.targetX;
                         const displayY = arcData.targetY;

                        this.ghostCar.setPosition(displayX, displayY)
                            .setAngle(displayAngle)
                            .setVisible(true);
                    }
                } else {
                    // Скрываем, если calculateTarget вернул null или невалидный объект
                    this.currentArcData = null;
                    if (this.ghostCar) this.ghostCar.setVisible(false);
                    if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
                }
            }
        } else {
            // Если курсор не в зоне, скрываем всё
            this.currentArcData = null;
            if (this.ghostCar) this.ghostCar.setVisible(false);
            if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
            // Snap cursor уже очищен выше
        }
    }

    // Новый метод для принудительного определения точки на арке при альтернативном управлении
    getForceSnapPointOnArc(pointerX, pointerY) {
        const ap = this.arcParams;
        if (!ap || !this.car) return null;

        const cx = this.car.x;
        const cy = this.car.y;
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        const pointerAngle = Math.atan2(dy, dx);
        const pointerDist = Math.sqrt(dx * dx + dy * dy);

        // Определяем, находится ли курсор в промежутке между accelerate и red зонами
        // Это единственный случай, когда мы не должны прикреплять к арке
        const nitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        
        if (nitroAvailable && ap.workingRadius && ap.outerRadius) {
            const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
            if (pointerDist > ap.workingRadius && pointerDist < actualRedInnerRadius) {
                // Курсор в "мертвой зоне" между accelerate и red - не применяем принудительный snap
                return null;
            }
        }

        const orientation = ap.orientationRad;
        const halfAngle = ap.halfAngleRad;
        const globalStartAngle = orientation - halfAngle;
        const globalEndAngle = orientation + halfAngle;

        // Ограничиваем угол в пределах арки
        let clampedAngle = pointerAngle;
        if (!this.isAngleWithinRange(pointerAngle, globalStartAngle, globalEndAngle)) {
            // Определяем ближайший угол границы арки
            const diffStart = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalStartAngle)));
            const diffEnd = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(pointerAngle), Phaser.Math.RadToDeg(globalEndAngle)));
            clampedAngle = (diffStart < diffEnd) ? globalStartAngle : globalEndAngle;
        }

        // Определяем ближайший радиус арки
        let targetRadius = ap.neutralRadius; // По умолчанию - нейтральный радиус
        
        // Определяем подходящую зону в зависимости от расстояния
        let zone = 'brake';
        
        // Стандартная логика определения зоны
        if (pointerDist <= ap.innerRadius) {
            targetRadius = ap.innerRadius;
            zone = 'brake';
        } else if (pointerDist >= ap.outerRadius) {
            if (nitroAvailable) {
                targetRadius = ap.outerRadius;
                zone = 'red';
            } else {
                // Если нитро недоступно, используем рабочий радиус
                targetRadius = ap.workingRadius;
                zone = 'accelerate';
            }
        } else if (pointerDist >= ap.workingRadius) {
            if (nitroAvailable) {
                const actualRedInnerRadius = (ap.workingRadius + ap.outerRadius) / 2;
                if (pointerDist >= actualRedInnerRadius) {
                    targetRadius = Math.min(pointerDist, ap.outerRadius);
                    zone = 'red';
                } else {
                    targetRadius = ap.workingRadius;
                    zone = 'accelerate';
                }
            } else {
                targetRadius = ap.workingRadius;
                zone = 'accelerate';
            }
        } else if (pointerDist >= ap.neutralRadius) {
            targetRadius = Math.min(pointerDist, ap.workingRadius);
            zone = 'accelerate';
        } else {
            targetRadius = Math.max(pointerDist, ap.innerRadius);
            zone = 'brake';
        }

        // Вычисляем координаты точки на арке
        const snapX = cx + Math.cos(clampedAngle) * targetRadius;
        const snapY = cy + Math.sin(clampedAngle) * targetRadius;

        return { snapX, snapY, zone };
    }

    // Вспомогательный метод для проверки, находится ли угол в заданном диапазоне
    isAngleWithinRange(angle, start, end) {
        let a = Phaser.Math.Angle.Normalize(angle);
        let s = Phaser.Math.Angle.Normalize(start);
        let e = Phaser.Math.Angle.Normalize(end);
        
        if (s <= e) {
            return a >= s && a <= e;
        } else {
            return a >= s || a <= e;
        }
    }

    // --- Методы расчета движения ---

    drawTrajectory(arcData) {
        if (!this.trajectoryGraphics || !arcData) return;
        this.trajectoryGraphics.clear().lineStyle(2, TRAJECTORY_COLOR, TRAJECTORY_ALPHA);

        if (arcData.isArc === false) {
            // Рисуем прямую линию (для заднего хода)
            const dashLen = TRAJECTORY_DASH_LENGTH;
            const gapLen = TRAJECTORY_GAP_LENGTH;
            const totalPatternLen = dashLen + gapLen;
            let currentDist = 0;
            const angle = Phaser.Math.Angle.Between(arcData.startX, arcData.startY, arcData.targetX, arcData.targetY);

            this.trajectoryGraphics.beginPath();
            while (currentDist < arcData.moveDistance) {
                const dStartX = arcData.startX + Math.cos(angle) * currentDist;
                const dStartY = arcData.startY + Math.sin(angle) * currentDist;
                const dEndX = arcData.startX + Math.cos(angle) * Math.min(currentDist + dashLen, arcData.moveDistance);
                const dEndY = arcData.startY + Math.sin(angle) * Math.min(currentDist + dashLen, arcData.moveDistance);
                this.trajectoryGraphics.moveTo(dStartX, dStartY).lineTo(dEndX, dEndY);
                currentDist += totalPatternLen;
            }
            this.trajectoryGraphics.strokePath();
        } else {
            // Рисуем дугу (для переднего хода)
            const points = [];
            const numSegments = 20; // Количество сегментов для отрисовки дуги

            for (let i = 0; i <= numSegments; i++) {
                const ratio = i / numSegments;
                const currentAngle = Phaser.Math.Interpolation.Linear([arcData.startAngleInArc, arcData.endAngleInArc], ratio);
                points.push(
                    arcData.arcCenterX + Math.cos(currentAngle) * arcData.turnRadius,
                    arcData.arcCenterY + Math.sin(currentAngle) * arcData.turnRadius
                );
            }

            // Рисуем пунктирную дугу
            const dashLen = TRAJECTORY_DASH_LENGTH;
            const gapLen = TRAJECTORY_GAP_LENGTH;
            const totalPatternLen = dashLen + gapLen;
            let distanceAlongArc = 0;
            let isDrawingDash = true;
            let segmentStartPoint = new Phaser.Math.Vector2(points[0], points[1]);

            this.trajectoryGraphics.beginPath();

            for (let i = 1; i < points.length / 2; i++) {
                const segmentEndPoint = new Phaser.Math.Vector2(points[i*2], points[i*2 + 1]);
                let segmentLength = Phaser.Math.Distance.BetweenPoints(segmentStartPoint, segmentEndPoint);
                let remainingSegmentLength = segmentLength;

                while (remainingSegmentLength > 0.01) {
                    const patternLength = isDrawingDash ? dashLen : gapLen;
                    const drawLength = Math.min(remainingSegmentLength, patternLength - (distanceAlongArc % patternLength));

                    if (isDrawingDash) {
                        const ratioStart = (segmentLength - remainingSegmentLength) / segmentLength;
                        const ratioEnd = (segmentLength - remainingSegmentLength + drawLength) / segmentLength;
                        const p1 = segmentStartPoint.clone().lerp(segmentEndPoint, ratioStart);
                        const p2 = segmentStartPoint.clone().lerp(segmentEndPoint, ratioEnd);
                        this.trajectoryGraphics.moveTo(p1.x, p1.y);
                        this.trajectoryGraphics.lineTo(p2.x, p2.y);
                    }

                    distanceAlongArc += drawLength;
                    remainingSegmentLength -= drawLength;

                    // Переключаем режим рисования (тире/пробел), если текущий паттерн закончился
                    if (distanceAlongArc % patternLength < 0.01) {
                       isDrawingDash = !isDrawingDash;
                    }
                 }
                 segmentStartPoint = segmentEndPoint;
            }
            this.trajectoryGraphics.strokePath();
        }
    }

    calculateTargetFromArcPoint(arcPointX, arcPointY, zone) {
        if (!this.car || !this.arcParams?.innerRadius) return null;
        if (!zone || zone === 'reverse') return null; // Не обрабатываем задний ход здесь

        const ap = this.arcParams;
        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        const carX = this.car.x;
        const carY = this.car.y;
        const carAngleRad = Phaser.Math.DegToRad(this.car.angle);

        // 1. Рассчитываем базовые параметры клика
        const clickDistanceCarCenter = Phaser.Math.Distance.Between(carX, carY, arcPointX, arcPointY);
        const angleToClickRad = Phaser.Math.Angle.Between(carX, carY, arcPointX, arcPointY);

        // 2. Рассчитываем относительные позиции клика для определения скорости/длины хода
        let relativeClickDistOverallArc = 0.5; // От 0 (внутр. край) до 1 (внешн. край)
        const arcThickness = ap.outerRadius - ap.innerRadius;
        if (arcThickness > 0) {
            relativeClickDistOverallArc = Phaser.Math.Clamp((clickDistanceCarCenter - ap.innerRadius) / arcThickness, 0, 1);
        }

        let relativeClickDistInWorkingZone = 0; // От -1 (внутр. край тормоза) до 1 (внешн. край ускорения)
        const workingZoneThickness = ap.workingRadius - ap.innerRadius; // Общая толщина зоны accelerate + brake
         if (workingZoneThickness > 0) {
            const distFromNeutral = clickDistanceCarCenter - ap.neutralRadius; // Смещение от нейтральной линии
            const halfWorkingThickness = (ap.workingRadius - ap.neutralRadius); // Толщина зоны ускорения
            const halfBrakeThickness = (ap.neutralRadius - ap.innerRadius);    // Толщина зоны торможения

            if (distFromNeutral >= 0 && halfWorkingThickness > 0) { // Зона ускорения
                relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfWorkingThickness, 0, 1);
            } else if (distFromNeutral < 0 && halfBrakeThickness > 0) { // Зона торможения
                relativeClickDistInWorkingZone = Phaser.Math.Clamp(distFromNeutral / halfBrakeThickness, -1, 0);
            }
        }

        // Проверяем наличие штрафа за болото
        let effectiveMaxMoveDistanceFactor = MAX_MOVE_DISTANCE_FACTOR;
        if (this.car.getData('swampPenaltyActive')) {
            // Уменьшаем MAX_MOVE_DISTANCE_FACTOR на 1 при активном штрафе болота
            effectiveMaxMoveDistanceFactor = Math.max(MIN_MOVE_DISTANCE_FACTOR, MAX_MOVE_DISTANCE_FACTOR - 0.5);
        }

        // 3. Рассчитываем общую длину хода (длину дуги)
        const currentMidRadius = ap.innerRadius + arcThickness / 2;
        const baseDist = Phaser.Math.Linear(MIN_MOVE_DISTANCE_FACTOR * currentMidRadius, effectiveMaxMoveDistanceFactor * currentMidRadius, relativeClickDistOverallArc);
        const arcLength = baseDist + currentSpeed * SPEED_TO_DISTANCE_MULTIPLIER;

        // 4. Рассчитываем угол отклонения клика от оси машины
        const angleDeviationRad = Phaser.Math.Angle.Wrap(angleToClickRad - carAngleRad);
        const angleDeviationDeg = Phaser.Math.RadToDeg(angleDeviationRad);

        // 6. Нормализуем угловое отклонение
        const normalizedDeviation = Phaser.Math.Clamp(Math.abs(angleDeviationDeg) / MAX_ANGLE_DEVIATION_DEG, 0, 1);

        // 7. Вычисляем текущий МИНИМАЛЬНЫЙ радиус, УЧИТЫВАЯ ТЕКУЩУЮ СКОРОСТЬ
        // Нормализуем текущую скорость машины (0..1)
        const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        // Рассчитываем, насколько сильно скорость уменьшает влияние дальности клика
        const speedInfluenceFactor = Phaser.Math.Linear(1, 1 - SPEED_INFLUENCE_ON_MIN_RADIUS, normCurrentSpeed);
        // Эффективный фактор интерполяции для мин. радиуса
        const effectiveMinRadiusInterpolation = relativeClickDistOverallArc * speedInfluenceFactor;

        const currentMinRadius = Phaser.Math.Linear(
            MIN_TURN_RADIUS_CLOSE,          // Мин. радиус при клике БЛИЗКО
            MIN_TURN_RADIUS_FAR,            // Мин. радиус при клике ДАЛЕКО
            effectiveMinRadiusInterpolation // Используем скорректированный фактор
        );

        // 8. НЕлинейная интерполяция РЕАЛЬНОГО радиуса между currentMinRadius и MAX_POSSIBLE_RADIUS
        // 8а. Вычисляем текущий показатель степени на основе скорости
        const currentExponent = Phaser.Math.Linear(
            RADIUS_SENSITIVITY_EXPONENT_LOW_SPEED,  // Степень при низкой скорости
            RADIUS_SENSITIVITY_EXPONENT_HIGH_SPEED, // Степень при высокой скорости
            normCurrentSpeed                        // Нормализованная текущая скорость (0..1)
        );
        // 8б. Применяем нелинейную интерполяцию с текущей степенью
        const radiusFactor = Math.pow(1 - normalizedDeviation, currentExponent);
        const radiusRange = Math.max(0, MAX_POSSIBLE_RADIUS - currentMinRadius);
        let turnRadius = currentMinRadius + radiusRange * radiusFactor;

        // 9. Ограничиваем радиус
        turnRadius = Phaser.Math.Clamp(turnRadius, currentMinRadius, MAX_POSSIBLE_RADIUS);

        // 10. Определяем направление вращения
        const rotationDirection = (angleDeviationDeg === 0) ? 1 : Math.sign(angleDeviationDeg);


        // 11. Вычисляем центр дуги
        const perpAngle = carAngleRad + rotationDirection * Math.PI / 2;
        const arcCenterX = carX + Math.cos(perpAngle) * turnRadius;
        const arcCenterY = carY + Math.sin(perpAngle) * turnRadius;

        // 12. Вычисляем угол дуги
        const arcAngleRad = (turnRadius > 0 && isFinite(turnRadius)) ? arcLength / turnRadius : 0;

        // 13. Вычисляем начальный и конечный углы относительно центра дуги
        const startAngleInArc = Math.atan2(carY - arcCenterY, carX - arcCenterX);
        const endAngleInArc = startAngleInArc + rotationDirection * arcAngleRad;

        // 14. Вычисляем конечные координаты и угол машины
        const targetX = arcCenterX + Math.cos(endAngleInArc) * turnRadius;
        const targetY = arcCenterY + Math.sin(endAngleInArc) * turnRadius;
        const targetAngleRad = Phaser.Math.Angle.Wrap(carAngleRad + rotationDirection * arcAngleRad);

        return {
            isArc: true, // Всегда дуга
            startX: carX,
            startY: carY,
            targetX,
            targetY,
            targetAngleRad,
            moveDistance: arcLength, // Длина дуги
            arcCenterX,
            arcCenterY,
            turnRadius,
            arcAngleRad: rotationDirection * arcAngleRad, // Угол дуги со знаком
            startAngleInArc,
            endAngleInArc,
            rotationDirection,
            relativeClickDistOverallArc,
            relativeClickDistInWorkingZone,
            zone: zone // Добавляем зону
        };
    }

    // --- Методы инициации движения ---

    handleSceneClick(pointer) {
        if (!this.car || this.scene.isMoving) return null; // Добавил проверку isMoving

        const clickX = pointer.worldX;
        const clickY = pointer.worldY;

        // Используем текущие данные дуги, если они есть (рассчитаны в handlePointerMove)
        const targetArcData = this.currentArcData;
        const clickArcZone = this.hoveredArcZone; // Используем зону из handlePointerMove

        if (!clickArcZone || !targetArcData) {
             console.log("Click outside active zone or no arc data, no move initiated.");
             // Очищаем визуалы, если клик был вне зоны и мы не двигаемся
             if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
             if (this.ghostCar?.visible) this.ghostCar.setVisible(false);
             if (this.snapCursor) this.snapCursor.clear();
             this.currentArcData = null;
             return null;
        }

        let moveData = null;
        let finalArcData = targetArcData;
        
        if (clickArcZone === 'reverse') {
            // Инициируем задний ход (он уже рассчитан в targetArcData)
            moveData = this.initiateReverseMove(targetArcData.targetX, targetArcData.targetY);
            
            // Убедимся, что для заднего хода установлен флаг isArc = false
            finalArcData = {
                ...targetArcData,
                isArc: false
            };

        } else if (targetArcData.isArc !== undefined) { // Убедимся, что есть данные для переднего хода
            // Инициируем передний ход (дуга или прямая)
            moveData = this.initiateForwardMove(
                targetArcData, // Передаем весь объект с данными дуги/прямой
                clickArcZone
            );
            
            // Для движения вперед явно устанавливаем isArc = true
            finalArcData = {
                ...targetArcData,
                isArc: true
            };
        }

        if (moveData) {
            // Сохраняем данные для реплея - ВАЖНО: добавляем arcData
            const historyEntry = {
                 startX: this.car.x,
                 startY: this.car.y,
                 fromAngleDeg: this.car.angle,
                 // Конечные значения берем из moveData, которые вернули initiate...Move
                 finalAngleDeg: moveData.finalAngleDeg,
                 targetX: moveData.targetX,
                 targetY: moveData.targetY,
                 turnDuration: moveData.turnDuration, // Может быть не нужно, если используем moveTime
                 moveTime: moveData.moveTime,
                 arcData: finalArcData // Сохраняем все рассчитанные параметры с явно установленным isArc!
             };
             console.log("Adding to history:", { 
                 zone: clickArcZone, 
                 isArc: finalArcData.isArc, 
                 startXY: [this.car.x.toFixed(1), this.car.y.toFixed(1)],
                 targetXY: [moveData.targetX.toFixed(1), moveData.targetY.toFixed(1)]
             });

             this.clearVisuals(); // Очищаем ГУИ и траекторию перед началом движения
             return { moveData: historyEntry }; // Возвращаем данные для GameScene
        }
        return null;
    }

    initiateForwardMove(arcData, clickArcZone) {
        if (!this.car?.body || !arcData) return null;

        // --- Начало: Логика скольжения ---
        const isSnowBiome = this.scene.currentBiome === BIOME_SNOW;
        let finalTargetX = arcData.targetX;
        let finalTargetY = arcData.targetY;
        // Рассчитываем "прямое" расстояние от старта до предсказанной точки финиша
        const originalMoveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, arcData.targetX, arcData.targetY);

        if (isSnowBiome && originalMoveDistance > 0) {
            const skidDistance = originalMoveDistance * SNOW_SKID_FACTOR;
            // Находим единичный вектор направления от старта к предсказанному финишу
            const dirX = (arcData.targetX - this.car.x) / originalMoveDistance;
            const dirY = (arcData.targetY - this.car.y) / originalMoveDistance;
            // Смещаем финальную точку вдоль этого вектора на skidDistance
            finalTargetX = arcData.targetX + dirX * skidDistance;
            finalTargetY = arcData.targetY + dirY * skidDistance;
            console.log(`Snow Skid: Original Target (${arcData.targetX.toFixed(1)}, ${arcData.targetY.toFixed(1)}), Final Target (${finalTargetX.toFixed(1)}, ${finalTargetY.toFixed(1)}), Skid Dist: ${skidDistance.toFixed(1)}`);
        }
        // --- Конец: Логика скольжения ---

        const currentSpeed = this.car.getData('speed') ?? MIN_SPEED;
        let speedForNextTurn = currentSpeed;
        let nextNitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;

        // Проверяем, находится ли машина на болоте
        const isOnSwamp = this.scene.swampGroup.getChildren().some(swamp => 
            Phaser.Math.Distance.Between(this.car.x, this.car.y, swamp.x, swamp.y) < GRID_CELL_SIZE
        );

        // Расчет скорости для следующего хода с учетом болота
        if (clickArcZone === 'accelerate' || clickArcZone === 'brake') {
            const speedFactor = (arcData.relativeClickDistInWorkingZone < 0) ? 0.75 : 1.0;
            const baseSpeedChange = arcData.relativeClickDistInWorkingZone * SPEED_INCREMENT * speedFactor;
            // Применяем штраф к изменению скорости, если машина на болоте
            const speedChange = isOnSwamp ? baseSpeedChange * SWAMP_SPEED_INCREMENT_PENALTY : baseSpeedChange;
            speedForNextTurn = currentSpeed + speedChange;
            // Важно: для зон кроме red всегда сохраняем текущее значение nitroAvailable
            nextNitroAvailable = this.car.getData('nitroAvailable') ?? NITRO_AVAILABLE_BY_DEFAULT;
        } else if (clickArcZone === 'red') {
            const baseSpeedBoost = RED_ZONE_SPEED_BOOST;
            // Применяем штраф к бусту скорости, если машина на болоте
            const speedBoost = isOnSwamp ? baseSpeedBoost * SWAMP_SPEED_INCREMENT_PENALTY : baseSpeedBoost;
            speedForNextTurn = currentSpeed + speedBoost;
            nextNitroAvailable = false; // Использовали нитро, удаляем его из инвентаря
        }
        speedForNextTurn = Phaser.Math.Clamp(speedForNextTurn, MIN_SPEED, MAX_SPEED);

        // Устанавливаем будущие параметры машины
        this.car.setData('nextSpeed', speedForNextTurn);
        this.car.setData('nextNitroAvailable', nextNitroAvailable);

        // --- Анимация движения ---
        const moveDistance = arcData.moveDistance;
        const initialCarAngleDeg = this.car.angle; // Начальный угол (градусы)
        // ВЫЧИСЛЯЕМ КОНЕЧНЫЙ УГОЛ ЗДЕСЬ, чтобы он был доступен везде
        const targetCarAngleRad = arcData.targetAngleRad; // Конечный угол (радианы)
        const targetCarAngleDeg = Phaser.Math.RadToDeg(targetCarAngleRad); // Конечный угол (градусы)

        // Проверка на валидность arcData перед созданием твина
        if (!isFinite(moveDistance) || !isFinite(initialCarAngleDeg) || !isFinite(targetCarAngleRad)) {
             console.error("Invalid arcData for tween creation:", arcData);
             // Попытка мягкого завершения хода без анимации?
             this.car.setPosition(arcData.targetX ?? this.car.x, arcData.targetY ?? this.car.y);
             this.car.setAngle(isFinite(targetCarAngleDeg) ? targetCarAngleDeg : initialCarAngleDeg);
             this.scene.finishMove();
             return null; // Не можем создать твин
        }

        // Рассчитываем скорость и время анимации
        const normCurrentSpeed = Phaser.Math.Clamp((currentSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);
        const animationSpeedMultiplier = Phaser.Math.Linear(MIN_ANIM_SPEED_MULTIPLIER, MAX_ANIM_SPEED_MULTIPLIER, normCurrentSpeed);
        const baseAnimSpeed = moveDistance * BASE_PHYSICS_MOVE_SPEED_FACTOR;
        const clickPosBonus = (1 + arcData.relativeClickDistOverallArc * CLICK_POS_ANIM_SPEED_FACTOR);
        const visualMoveSpeed = baseAnimSpeed * clickPosBonus * animationSpeedMultiplier;
        const finalAnimSpeed = Math.max(visualMoveSpeed, MIN_VISUAL_ANIM_SPEED);
        const moveTime = (finalAnimSpeed > 0 && moveDistance > 0) ? (moveDistance / finalAnimSpeed) * 1000 : 50;

        // --- Создаем Tween ---
        if (arcData.isArc === false) {
            // --- Tween для прямого движения ---
            this.scene.tweens.add({
                targets: this.car,
                x: finalTargetX,
                y: finalTargetY,
                duration: moveTime,
                ease: 'Linear',
                onComplete: () => {
                    if (this.car && this.car.active) {
                        this.car.setPosition(finalTargetX, finalTargetY);
                        this.car.setAngle(targetCarAngleDeg); // Используем конечный угол
                    }
                    this.scene.finishMove();
                },
                onUpdate: () => {
                    // Обновляем тень
                    if (this.car && this.scene.carShadow && this.scene.carShadow.active) {
                        this.scene.carShadow.setPosition(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y);
                        this.scene.carShadow.setAngle(this.car.angle);
                    }
                }
            });
        } else {
            // --- Tween для движения по дуге ---
            // Вычисляем кратчайший угол поворота до твина
            const shortestAngleDiff = Phaser.Math.Angle.ShortestBetween(initialCarAngleDeg, targetCarAngleDeg);

            // === Рассчитываем параметры скольжения (если нужно) ===
            const totalSkidVectorX = isSnowBiome ? finalTargetX - arcData.targetX : 0;
            const totalSkidVectorY = isSnowBiome ? finalTargetY - arcData.targetY : 0;

            let finalAngleForTween = targetCarAngleDeg; // Угол для конца анимации
            let shortestAngleDiffForTween = shortestAngleDiff; // Угол для интерполяции в onUpdate

            if (isSnowBiome && shortestAngleDiff !== 0) {
                const extraRotationFactor = SNOW_SKID_FACTOR * SNOW_SKID_EXTRA_ROTATION_MULTIPLIER;
                const extraRotation = shortestAngleDiff * extraRotationFactor;
                finalAngleForTween = targetCarAngleDeg + extraRotation;
                shortestAngleDiffForTween = shortestAngleDiff * (1 + extraRotationFactor);
                console.log(`Snow Skid Rotation: Original Diff: ${shortestAngleDiff.toFixed(1)}°, Extra: ${extraRotation.toFixed(1)}°, Final Tween Angle: ${Phaser.Math.Angle.WrapDegrees(finalAngleForTween).toFixed(1)}°`);
            }
            // ===

            this.scene.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: moveTime,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    if (!this.car || !this.car.active) return;

                    // --- Шаг 1: Рассчитать точку на ОРИГИНАЛЬНОЙ дуге ---
                    const currentAngleInArc = Phaser.Math.Interpolation.Linear([arcData.startAngleInArc, arcData.endAngleInArc], target.progress);
                    if (!isFinite(currentAngleInArc) || !isFinite(arcData.arcCenterX) || !isFinite(arcData.arcCenterY) || !isFinite(arcData.turnRadius)) {
                        console.warn("Invalid arc data during main tween update (base calc)");
                        return;
                    }
                    const originalArcX = arcData.arcCenterX + Math.cos(currentAngleInArc) * arcData.turnRadius;
                    const originalArcY = arcData.arcCenterY + Math.sin(currentAngleInArc) * arcData.turnRadius;

                    let currentCarX, currentCarY;

                    // --- Шаг 2: Применить смещение скольжения, если нужно ---
                    if (isSnowBiome) {
                        const currentSkidOffsetX = totalSkidVectorX * target.progress;
                        const currentSkidOffsetY = totalSkidVectorY * target.progress;
                        currentCarX = originalArcX + currentSkidOffsetX;
                        currentCarY = originalArcY + currentSkidOffsetY;
                    } else {
                        // Не снег: используем точку на оригинальной дуге
                        currentCarX = originalArcX;
                        currentCarY = originalArcY;
                    }

                    // --- Интерполяция угла (остается прежней для обоих случаев) ---
                    // shortestAngleDiff теперь рассчитан до твина
                    // Используем shortestAngleDiffForTween для интерполяции
                    const interpolatedAngleDeg = initialCarAngleDeg + shortestAngleDiffForTween * target.progress;
                    const wrappedAngleDeg = Phaser.Math.Angle.WrapDegrees(interpolatedAngleDeg);

                    // Проверяем валидность рассчитанных координат и угла перед установкой
                    if (!isFinite(currentCarX) || !isFinite(currentCarY) || !isFinite(wrappedAngleDeg)) {
                         console.warn("Invalid calculated values during main tween update (final check)", {x: currentCarX, y: currentCarY, angle: wrappedAngleDeg});
                         return;
                    }
                    this.car.setPosition(currentCarX, currentCarY);
                    this.car.setAngle(wrappedAngleDeg);
                    if (this.scene.carShadow && this.scene.carShadow.active) {
                        this.scene.carShadow.setPosition(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y);
                        this.scene.carShadow.setAngle(this.car.angle);
                    }
                },
                onComplete: () => {
                   if (this.car && this.car.active) {
                        // Используем finalTargetX/Y для конечной позиции
                        this.car.setPosition(finalTargetX, finalTargetY);
                        // Используем finalAngleForTween для конечного угла
                        this.car.setAngle(Phaser.Math.Angle.WrapDegrees(finalAngleForTween));
                        if (this.scene.carShadow && this.scene.carShadow.active) {
                           this.scene.carShadow.setPosition(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y);
                           this.scene.carShadow.setAngle(this.car.angle);
                       }
                   }
                   this.scene.finishMove();
               }
            });
        }

        // Возвращаем данные для истории (с оригинальными координатами и углом цели)
        return {
            targetX: arcData.targetX, // Оригинальная цель X
            targetY: arcData.targetY, // Оригинальная цель Y
            finalAngleDeg: targetCarAngleDeg, // Оригинальный конечный угол
            moveTime: moveTime,
            turnDuration: 0 // Устаревший параметр
        };
    }

    initiateReverseMove(targetX, targetY) {
        if (!this.car?.body) return null;


        // Сбрасываем параметры машины для заднего хода
        this.car.setData('nextSpeed', MIN_SPEED);
        this.car.setData('nextNitroAvailable', this.car.getData('nitroAvailable'));

        // Анимация заднего хода (прямолинейная)
        // Используем оригинальные targetX, targetY
        const originalMoveDistance = Phaser.Math.Distance.Between(this.car.x, this.car.y, targetX, targetY); // Расстояние нужно для расчета времени
        const moveTime = (REVERSE_SPEED_ANIMATION > 0 && originalMoveDistance > 0) ? (originalMoveDistance / REVERSE_SPEED_ANIMATION) * 1000 : 50;
        const currentAngleDeg = this.car.angle;

        this.scene.tweens.add({
            targets: this.car,
            x: targetX, // Цель - оригинальная точка
            y: targetY, // Цель - оригинальная точка
            // Угол не меняется
            duration: moveTime,
            ease: 'Linear',
            onComplete: () => {
                 if (this.car && this.car.active) {
                     // Устанавливаем конечную позицию в оригинальную точку
                     this.car.setPosition(targetX, targetY);
                 }
                 this.scene.finishMove();
             },
             onUpdate: () => {
                 // Обновляем тень
                  if (this.car && this.scene.carShadow && this.scene.carShadow.active) {
                     this.scene.carShadow.setPosition(this.car.x + 2, this.car.y + SHADOW_OFFSET_Y);
                     this.scene.carShadow.setAngle(this.car.angle);
                 }
             }
        });

        // Возвращаем данные для истории (с оригинальными координатами цели)
        return {
            targetX: targetX, // Оригинальная цель X
            targetY: targetY, // Оригинальная цель Y
            finalAngleDeg: currentAngleDeg, // Угол не меняется
            moveTime: moveTime,
            turnDuration: 0
        };
    }
}

