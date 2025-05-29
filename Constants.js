const GAME_VERSION = '0.5.26'; // Версия игры для кэширования ресурсов
const GAME_WIDTH = 1536;
const GAME_HEIGHT = 1536;
const GRID_CELL_SIZE = 32;

// Соотношения сторон
const MIN_ASPECT_RATIO = 1/2;  // Минимальное соотношение (вертикальный режим)
const MAX_ASPECT_RATIO = 2/1;  // Максимальное соотношение (горизонтальный режим)

const SHADOW_COLOR = 0x000000; // Цвет тени (белый) - используем числовой формат для tint
const SHADOW_ALPHA = 0.3;      // Прозрачность тени (50%)
const SHADOW_OFFSET_Y = 3;     // Вертикальное смещение тени (в пикселях)
const SHADOW_DEPTH_OFFSET = -1; // Насколько "ниже" основного спрайта рисовать тень


const VIRTUAL_JOYSTICK_BLOCK_RADIUS = 40;
const VIRTUAL_JOYSTICK_ACTIVATION_DELAY = 100; // Задержка активации в миллисекундах

// --- Цвета и прозрачность ---
const COLOR_BRAKE       = 0xddb0ad;
const COLOR_ACCELERATE  = 0x7fb1b3;
const COLOR_NITRO       = 0x3dc9b0;
const COLOR_REVERSE     = 0xffa500;

// Ключи для текстур арок
const ARC_SLOW_KEY      = 'arc_slow';
const ARC_GO_KEY        = 'arc_go';

const ZONE_ALPHA_DEFAULT     = 0.3;
const ZONE_ALPHA_HOVER       = 1.0;
const GHOST_ALPHA            = 0.4;
const TRAJECTORY_COLOR       = 0xffffff;
const TRAJECTORY_ALPHA       = 0.7;
const TRAJECTORY_DASH_LENGTH = 10;
const TRAJECTORY_GAP_LENGTH  = 5;
const CUBE_ALPHA             = 1.0;

// --- Константы для следов от колес ---
const TIRE_TRACK_COLOR = 0x333333;  // Цвет следов от колес (темно-серый)
const TIRE_TRACK_ALPHA = 0.1;       // Прозрачность следов
const TIRE_TRACK_RADIUS = 3;        // Радиус следа колеса в пикселях
const TIRE_COLOR_NITRO  = 0x00b8be; // Новый цвет для следов NITRO



// --- Параметры машины ---  
const carRadius            = 11;
const MIN_SPEED            = 0.1;
const MAX_SPEED            = 5.0;
const SPEED_INCREMENT      = 1;
const RED_ZONE_SPEED_BOOST = 2.5;
const BRAKE_SPEED_FACTOR   = 0.85; // Коэффициент для уменьшения скорости при торможении

// --- Параметры арки (GUI) ---
const BASE_INNER_RADIUS_GUI           = 35;
const ARC_THICKNESS_GUI               = 75;
const GREEN_ZONE_RATIO                = 0.6;
const BASE_ANGLE_DEG                  = 120;
const SNAP_THRESHOLD = 5; // порог магнитного эффекта в пикселях
const ENHANCED_SNAP_THRESHOLD = 15; // усиленный порог магнитного эффекта (в 3 раза больше)
const ANGLE_SNAP_THRESHOLD = Phaser.Math.DegToRad(15);
const GAP_SNAP_THRESHOLD = 15; 

// --- Факторы влияния скорости на ВИД арки (GUI) ---
const SPEED_TO_GUI_RADIUS_FACTOR      = 0;
const GUI_THICKNESS_REDUCTION_FACTOR  = 0.1;
const MAX_GUI_ANGLE_REDUCTION_FACTOR  = 3.7;
const MIN_ARC_ANGLE_DEG               = 25;
const MIN_ARC_THICKNESS               = 20;

// --- Константы для управления поворотом ---
// Максимальное угловое отклонение курсора от оси машины, влияющее на радиус поворота (в градусах)
const MAX_ANGLE_DEVIATION_DEG = 70;
// Минимальный радиус поворота при клике БЛИЗКО (соответствует макс. отклонению)
const MIN_TURN_RADIUS_CLOSE = 35;
// Минимальный радиус поворота при клике ДАЛЕКО (соответствует макс. отклонению)
const MIN_TURN_RADIUS_FAR = 70;
// Радиус при нулевом отклонении (для имитации прямой)
const MAX_POSSIBLE_RADIUS = 3000;
// Коэффициент влияния ТЕКУЩЕЙ скорости на МИНИМАЛЬНЫЙ радиус (0 = нет влияния, 1 = на макс. скорости мин.радиус всегда MIN_TURN_RADIUS_CLOSE)
const SPEED_INFLUENCE_ON_MIN_RADIUS = 0.5;
// Показатель степени для нелинейной интерполяции радиуса при НИЗКОЙ скорости (больше = плавнее руль)
const RADIUS_SENSITIVITY_EXPONENT_LOW_SPEED = 5;
// Показатель степени для нелинейной интерполяции радиуса при ВЫСОКОЙ скорости (меньше = резче руль)
const RADIUS_SENSITIVITY_EXPONENT_HIGH_SPEED = 7;

// --- Параметры арки ЗАДНЕГО ХОДА (GUI) ---
const REVERSE_ARC_INNER_RADIUS  = 25;
const REVERSE_ARC_THICKNESS     = 35;
const REVERSE_ARC_ANGLE_DEG     = 20;

// --- Параметры расчета ДИСТАНЦИИ хода ---
const MIN_MOVE_DISTANCE_FACTOR  = 0.5;
const MAX_MOVE_DISTANCE_FACTOR  = 2.5;
const SPEED_TO_DISTANCE_MULTIPLIER = 10;

// --- Параметры движения и скорости ---
const BASE_PHYSICS_MOVE_SPEED_FACTOR = 1.0;
const CLICK_POS_ANIM_SPEED_FACTOR    = 0.8;
const MIN_ANIM_SPEED_MULTIPLIER      = 0.7;
const MAX_ANIM_SPEED_MULTIPLIER      = 1.8;
const MIN_VISUAL_ANIM_SPEED          = 50;
const TURN_DURATION                  = 300;
const STOP_DISTANCE_THRESHOLD        = 5;
const MIN_STOP_SPEED                 = 0;

// --- Параметры движения ЗАДНИМ ХОДОМ ---
const REVERSE_MOVE_DISTANCE     = GRID_CELL_SIZE * 1.5;
const REVERSE_SPEED_ANIMATION   = 50;

// --- Параметры генерации уровня ---
const NOISE_SCALE                = 150;
const START_AREA_CLEAR_RADIUS_FACTOR = 3;

// Портал
const PORTAL_KEY                 = 'portal';


// --- КЛЮЧИ для загруженных ассетов ---
// Пустынный биом (Desert)
const GROUND_TEXTURE_D_KEY   = 'groundTextureD';
const BLOCK_D_KEY            = 'blockD';
// Травянистый биом (Grass)
const GROUND_TEXTURE_G_KEY   = 'groundTextureG';
const BLOCK_G_KEY            = 'blockG';
// Снежный биом (Snow)
const GROUND_TEXTURE_S_KEY   = 'groundTextureS';
const BLOCK_S_KEY            = 'blockS';

// Старые ключи (оставим для совместимости или как дефолт)
const SAND_TEXTURE_KEY       = GROUND_TEXTURE_D_KEY; // 'sandTexture'; - Заменяем на новый ключ
const OBSTACLE_IMAGE_KEY     = BLOCK_D_KEY; // 'obstacleBlock'; - Заменяем на новый ключ

const MAIN_BG_KEY            = 'mainBg';
const START_BUTTON_KEY       = 'startButton';
const CAR_PLAYER_KEY         = 'car_player';
const RESTART_BUTTON_KEY     = 'restartButton';
const NEXT_LEVEL_BUTTON_KEY  = 'nextLevelButton';
const FUEL_PICKUP_KEY        = 'fuelPickup';
const NITRO_PICKUP_KEY       = 'nitroPickup';
const SWAMP_KEY              = 'swamp';

// --- Параметры SWAMP ---
const SWAMP_SPEED_MULTIPLIER = 0.1;
const SWAMP_SPEED_INCREMENT_PENALTY = 0.25; // Штраф к изменению скорости на болоте
const SWAMP_THRESHOLD_OFFSET = 0.13; // Базовое значение, будет заменено в зависимости от уровня

// --- Параметры дронов ---
const DRONE_KEY               = 'drone';
// DRONE_MAX_PER_LEVEL определяется в настройках уровней
const DRONE_RANGE_CELLS       = 2.5;        // дальность рывка за ход
const DRONE_KILL_RADIUS_CELLS = 1.5;        // радиус перехвата

// --- Параметры прогрессии ---
const FUEL_COUNT_PER_LEVEL = 10;  // Количество топлива на уровне
const INITIAL_FUEL = 7;
const MAX_FUEL = 15;
const FUEL_CONSUMPTION_PER_MOVE = 1;
const FUEL_GAIN_ON_PICKUP = 7;
const FUEL_LOW_THRESHOLD = 3;
const FUEL_COLOR_NORMAL = '#ffffff';
const FUEL_COLOR_LOW = '#df2a06';

// --- Параметры NITRO ---
const NITRO_COUNT_PER_LEVEL = 5;   // Количество нитро на уровне
const NITRO_AVAILABLE_BY_DEFAULT = false; // Нитро недоступно по умолчанию

// --- Параметры эффектов ---
const FLASH_DURATION         = 300;
const FLASH_COLOR            = 0x00ffff;
const WIN_FLASH_COLOR        = 0x00ff00;
const FUEL_FLASH_COLOR       = 0xffa200; // Оранжевый цвет для вспышки при закончившемся топливе
const SHAKE_DURATION         = 300;
const SHAKE_INTENSITY        = 0.01;
const RESTART_DELAY          = 1000; 

// --- Параметры камеры ---
const CAMERA_BASE_ZOOM = 1.8; // Было 2
const CAMERA_BASE_ZOOM_MOBILE = 1; //  Базовый зум для мобильных устройств
const CAMERA_MAX_ZOOM = 1.5; // Было 1.5
const CAMERA_ZOOM_SPEED_THRESHOLD = 1; // Скорость, при которой начинается отдаление
const CAMERA_ZOOM_SPEED_MAX = 5; // Скорость, при которой достигается максимальное отдаление

// --- Параметры скольжения на льду ---
const SNOW_SKID_FACTOR = 0.40; // 50% сноса
const SNOW_SKID_EXTRA_ROTATION_MULTIPLIER = 1.75; // Насколько сильно доп. вращение зависит от фактора сноса (1.0 = линейно)

// --- Параметры препятствий и уровней ---
const CUBE_SIZE_FACTOR           = 0.8;
const OBSTACLE_THRESHOLD_DECREMENT = 0.05;
const MIN_OBSTACLE_THRESHOLD     = 0.3;
const INITIAL_OBSTACLE_THRESHOLD = 0.7;

const TOTAL_LEVELS               = 27;

// --- Цвета биомов ---
const BIOME_DESERT_COLOR = 0x422a13; // Темно-коричневый для следов и тенейпустыни
const BIOME_SNOW_COLOR = 0x0a4772;   // Темно-синий для следов и теней снега
const BIOME_GRASS_COLOR = 0x2f4d17;  // Темно-зеленый для следов и теней травы

// --- Конфигурации биомов ---
const BIOME_DESERT = {
    ground: GROUND_TEXTURE_D_KEY,
    obstacle: BLOCK_D_KEY
};
const BIOME_GRASS = {
    ground: GROUND_TEXTURE_G_KEY,
    obstacle: BLOCK_G_KEY
};
const BIOME_SNOW = {
    ground: GROUND_TEXTURE_S_KEY,
    obstacle: BLOCK_S_KEY
};

// --- Сопоставление уровней, биомов и сложности ---
const LEVEL_SETTINGS = {
    1: { biome: BIOME_DESERT, threshold: 0.7, drones: 0 },
    2: { biome: BIOME_DESERT, threshold: 0.65, drones: 0 },
    3: { biome: BIOME_DESERT, threshold: 0.6, drones: 1 },
    4: { biome: BIOME_GRASS, threshold: 0.6, drones: 1 },
    5: { biome: BIOME_GRASS, threshold: 0.55, drones: 1 },
    6: { biome: BIOME_GRASS, threshold: 0.5, drones: 1 },
    7: { biome: BIOME_SNOW, threshold: 0.7, drones: 1 },
    8: { biome: BIOME_SNOW, threshold: 0.65, drones: 1 },
    9: { biome: BIOME_SNOW, threshold: 0.6, drones: 1 },
    10: { biome: BIOME_DESERT, threshold: 0.6, drones: 2 },
    11: { biome: BIOME_DESERT, threshold: 0.55, drones: 2 },
    12: { biome: BIOME_DESERT, threshold: 0.5, drones: 2},
    13: { biome: BIOME_GRASS, threshold: 0.6, drones: 2 },
    14: { biome: BIOME_GRASS, threshold: 0.55, drones: 2 },
    15: { biome: BIOME_GRASS, threshold: 0.5, drones: 2 },
    16: { biome: BIOME_SNOW, threshold: 0.6, drones: 2 },
    17: { biome: BIOME_SNOW, threshold: 0.55, drones: 2 },
    18: { biome: BIOME_DESERT, threshold: 0.5, drones: 2 },
    19: { biome: BIOME_DESERT, threshold: 0.45, drones: 2 },
    20: { biome: BIOME_DESERT, threshold: 0.4, drones: 2},
    21: { biome: BIOME_GRASS, threshold: 0.5, drones: 2 },
    22: { biome: BIOME_GRASS, threshold: 0.45, drones: 2 },
    23: { biome: BIOME_GRASS, threshold: 0.4, drones: 2 },
    24: { biome: BIOME_SNOW, threshold: 0.5, drones: 2 },
    25: { biome: BIOME_DESERT, threshold: 0.4, drones: 3 },
    26: { biome: BIOME_GRASS, threshold: 0.4, drones: 3 },
    27: { biome: BIOME_SNOW, threshold: 0.4, drones: 3},
};

// Для обратной совместимости старый формат
const LEVEL_BIOMES = {};
for (const level in LEVEL_SETTINGS) {
    LEVEL_BIOMES[level] = LEVEL_SETTINGS[level].biome;
}

// Функция для получения настроек уровня (с фоллбэком на пустынный биом и стандартный порог)
const getLevelSettings = (level) => {
    return LEVEL_SETTINGS[level] || { biome: BIOME_DESERT, threshold: INITIAL_OBSTACLE_THRESHOLD };
};

// Функция для получения биома уровня (для обратной совместимости)
const getBiomeForLevel = (level) => {
    return LEVEL_SETTINGS[level]?.biome || BIOME_DESERT;
};

// --- Параметры звука двигателя ---
const ENGINE_SOUND_MIN_RATE = 1;  // Минимальная скорость воспроизведения (при MIN_SPEED)
const ENGINE_SOUND_MAX_RATE = 1.7;  // Максимальная скорость воспроизведения (при MAX_SPEED)
const ENGINE_SOUND_BASE_VOLUME = 0.4; // Базовая громкость звука двигателя

// --- Параметры звука двигателя в реплее ---
const REPLAY_ENGINE_SOUND_MIN_RATE = 1.1;  // Минимальная скорость воспроизведения в реплее
const REPLAY_ENGINE_SOUND_MAX_RATE = 1.7;  // Максимальная скорость воспроизведения в реплее
const REPLAY_ENGINE_SOUND_BASE_VOLUME = 0.2; // Базовая громкость звука двигателя в реплее

// Константы для частиц пыли
const DUST_PARTICLE_START_RADIUS = 5;
const DUST_PARTICLE_END_RADIUS = 30;
// const DUST_PARTICLE_DURATION_FRAMES = 180; // Старая константа, заменена на DUST_PARTICLE_LIFE_FRAMES
const DUST_PARTICLE_TEXTURE_KEY = 'dust_particle'; // Ключ для текстуры частицы пыли
const DUST_SPAWN_INTERVAL_FRAMES = 1; // Создавать частицы каждые N игровых кадров
const DUST_PARTICLE_NITRO_COLOR = 0x24c2c9; // Цвет частиц пыли при использовании нитро

// Новые константы для управления частицами пыли
const DUST_PARTICLE_LIFE_FRAMES = 60;       // Время жизни частицы в игровых кадрах (было DUST_PARTICLE_DURATION_FRAMES)
const DUST_PARTICLE_START_ALPHA = 0.1;      // Начальная прозрачность
const DUST_PARTICLE_END_ALPHA = 0.0;        // Конечная прозрачность
const DUST_PARTICLE_WIGGLE_MAX_OFFSET = 20; // Максимальное смещение для "покачивания" частицы по X и Y (в пикселях)
const DUST_PARTICLE_WIGGLE_UPDATE_INTERVAL_FRAMES = 15; // Как часто выбирается новая цель для покачивания (в кадрах)
const DUST_PARTICLE_WIGGLE_TRANSITION_FRAMES = 30;    // За сколько кадров частица достигнет новой цели покачивания

