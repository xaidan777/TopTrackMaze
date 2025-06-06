# Архитектура игрового проекта "Arcfade: Maze"

Этот документ описывает структуру и назначение основных JavaScript файлов в проекте.

## `ArcController.js`

Отвечает за всю логику, связанную с **дугой управления** автомобилем. Ключевые функции:

*   Расчет параметров дуги (размер, углы, активные зоны) в зависимости от скорости машины и других факторов.
*   Обработка пользовательского ввода (движение мыши/пальца) для взаимодействия с дугой.
*   Определение активной зоны дуги (тормоз, ускорение, нитро, задний ход).
*   Отрисовка дуги управления, траектории предполагаемого движения и "призрака" машины.
*   Реализация "примагничивания" курсора к краям и центрам зон дуги.
*   Расчет конечных параметров движения (координаты, угол, дистанция) на основе взаимодействия с дугой.
*   Обработка особых состояний, например, блокировка ускорения при попадании в болото.

## `Constants.js`

Централизованное хранилище всех **глобальных констант**, используемых в игре. Включает:

*   Размеры игрового мира, ячеек сетки.
*   Цветовые палитры для UI, игровых объектов, биомов.
*   Ключи для загружаемых ассетов (текстуры, спрайты).
*   Физические параметры машины: диапазоны скоростей, ускорение, эффекты от зон (нитро, тормоз).
*   Параметры GUI дуги управления: базовые радиусы, толщина, углы, чувствительность "примагничивания".
*   Факторы, влияющие на внешний вид дуги (например, сужение при увеличении скорости).
*   Константы для расчета траектории движения: минимальные/максимальные дистанции, влияние скорости.
*   Параметры анимации движения машины.
*   Настройки генерации уровней: масштаб шума, радиус очистки стартовой зоны.
*   Характеристики игровых объектов: портал, топливо, нитро, болото, дроны (дальность, радиус атаки).
*   Параметры игровой прогрессии: количество топлива/нитро на уровне, начальное топливо, потребление.
*   Настройки визуальных эффектов: длительность и цвет вспышек, интенсивность тряски камеры.
*   Параметры камеры: базовый зум, максимальный зум, пороги скорости для изменения зума.
*   Настройки для различных биомов (пустыня, трава, снег): ключи ассетов, цвета для теней и следов.
*   Конфигурации уровней: тип биома, порог сложности генерации препятствий, количество дронов для каждого уровня.
*   Параметры звуков двигателя: диапазоны скорости воспроизведения, базовая громкость.

## `ConsoleCommands.js`

Реализует простой механизм **консольных команд** для отладки.

*   Перехватывает стандартный `console.log`.
*   Если первым аргументом передана строка 'debug', активирует отладочный режим в `GameScene`.
*   Создает глобальную функцию `debug()` для аналогичной активации отладочного режима.

## `drone.js`

Определяет класс `Drone`, представляющий **противников-дронов**.

*   Логика движения: планирование хода в направлении цели (машина игрока или точка между машиной и порталом).
*   Обработка столкновений между дронами, приводящая к изменению их траекторий.
*   Анимация движения дрона.
*   Механика "перехвата": проверка, находится ли дрон достаточно близко к машине игрока для ее "уничтожения".
*   Управление спрайтом тени дрона.

## `GameScene.js`

**Основная игровая сцена**, где происходит весь геймплей. Это наиболее крупный и многофункциональный класс.

*   **Инициализация и управление объектами**: машина игрока (создание, установка начальных параметров), тени, препятствия, коллекционные предметы (портал, топливо, нитро), зоны болот, дроны.
*   **Управление игровым циклом**: загрузка/сохранение прогресса, начало нового уровня, перезапуск уровня.
*   **Генерация уровня**: использует `LevelGenerator` для создания игрового поля.
*   **Состояние игры**: отслеживание и обработка состояний (игра активна, проигрыш, уровень пройден).
*   **Обработка ввода**: регистрация событий мыши/касаний, делегирование логики управления аркой классу `ArcController`.
*   **Физика и столкновения**: настройка и обработка столкновений между машиной и другими объектами (препятствия, коллекционные предметы, болота, дроны).
*   **Пользовательский интерфейс (UI)**: взаимодействие с классом `UI` для обновления информации (топливо, уровень) и отображения сообщений.
*   **Игровые механики**:
    *   Топливо: отслеживание расхода и пополнения.
    *   Нитро: активация, использование, пополнение.
    *   Болото: применение эффектов замедления и блокировки ускорения.
    *   Дроны: управление их ходами и взаимодействием с игроком.
*   **Визуальные эффекты**: отрисовка следов от колес (с учетом биома и использования нитро).
*   **Реплей**: запись ходов игрока и запуск плавного воспроизведения после завершения уровня.
*   **Камера**: следование за машиной, динамическое изменение зума в зависимости от скорости.
*   **Отладка**: активация отладочного режима, отображение отладочной информации.
*   **Звук**: взаимодействие с `SoundManager` для проигрывания звуковых эффектов.
*   Адаптация к изменению размера окна.

## `index.html`

**Главный HTML-файл** веб-страницы игры.

*   Определяет базовую структуру HTML-документа.
*   Подключает необходимые JavaScript-библиотеки (Phaser, Simplex Noise).
*   Подключает все кастомные скрипты игры.
*   Содержит CSS-стили для игрового контейнера, фона и экрана загрузки.
*   Включает HTML-разметку для экрана загрузки (текст, индикатор прогресса).
*   Инициирует запуск игры через `main.js`.
*   Добавляет версионирование к путям скриптов для управления кэшированием.
*   Обновляет язык текста на экране загрузки в соответствии с выбором пользователя.

## `Lang.js`

Определяет сцену `LangScene` для **выбора языка**.

*   Отображается при первом запуске или при вызове из меню настроек.
*   Позволяет пользователю выбрать язык интерфейса (английский или русский).
*   Сохраняет выбор языка в `localStorage`.
*   Адаптирует отображение кнопок под разные размеры экрана.

## `levels.js` (Класс `LevelGenerator`)

Отвечает за **процедурную генерацию игровых уровней**.

*   Создание карты препятствий с использованием алгоритма Simplex Noise и порога сложности.
*   Генерация непроходимых границ по периметру уровня.
*   Размещение портала (финишной точки) в свободной ячейке, удаленной от старта.
*   Размещение коллекционных предметов (топливо, нитро) в доступных местах.
*   Для определенных биомов (например, травянистого) генерирует участки болот.
*   Гарантирует, что объекты не размещаются друг на друге.
*   Использует разные ассеты и параметры для разных биомов.

## `UI.js`

Управляет всеми **элементами пользовательского интерфейса** в `GameScene`.

*   **Отображение информации**: текущее количество топлива, номер уровня, отладочные данные.
*   **Кнопки**: "Перезапуск уровня", "Следующий уровень", "Играть снова" (после прохождения всех уровней).
*   **Информационные окна**: окно с советами и подсказками по управлению, экраны "Уровень пройден" и "Игра окончена".
*   **Визуальные эффекты**: анимация и текст при подборе топлива/нитро, попадании в болото.
*   **Навигация**: стрелка, указывающая направление на портал.
*   **UI Камера**: использует отдельную камеру для элементов UI, чтобы они не масштабировались вместе с основной игровой камерой.
*   Адаптация расположения и размеров элементов UI при изменении размера окна.
*   Динамическое отображение/скрытие графических границ активной зоны арки управления.

## `main.js`

**Точка входа** приложения, инициализирует игру.

*   Создает экземпляр игры Phaser с глобальными настройками (размеры, тип рендеринга, настройки физики).
*   Регистрирует все игровые сцены (`LangScene`, `MainMenuScene`, `GameScene`).
*   Определяет начальную сцену при запуске (сцена выбора языка, если язык не сохранен, иначе главное меню).
*   Управляет экраном загрузки: обновляет индикатор прогресса во время загрузки ассетов и скрывает экран после полной инициализации игры.

## `MainMenuScene.js`

Реализует **главное меню** игры.

*   Предоставляет пользователю основные опции: "Начать игру", "Настройки", "О игре/Язык".
*   Обрабатывает взаимодействие с кнопками, перенаправляя на соответствующие сцены или открывая модальные окна.
*   **Окно "Настройки"**: позволяет регулировать громкость музыки и звуковых эффектов, а также изменить язык.
*   **Окно "О игре/Язык"**: отображает информацию об игре, авторах, управлении и позволяет перейти на сцену выбора языка.
*   Адаптирует верстку меню к различным размерам экрана.
*   Взаимодействует с `SoundManager` для применения настроек громкости.

## `soundManager.js`

Класс для **управления всеми звуковыми эффектами и музыкой** в игре.

*   Осуществляет предзагрузку всех необходимых аудиофайлов.
*   Создает и хранит экземпляры звуков Phaser.
*   Предоставляет методы для воспроизведения, остановки и управления параметрами звуков:
    *   Звук двигателя машины (для основного геймплея и реплея, с изменением высоты тона в зависимости от скорости).
    *   Звуки столкновений.
    *   Звуки подбора предметов (топливо, нитро).
    *   Звук победы при достижении портала.
    *   Звук окончания топлива.
    *   Звук атаки дрона.
*   Позволяет устанавливать общую громкость для всех звуков. 