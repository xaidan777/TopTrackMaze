const GAME_VERSION = 'a1b2c3d'
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 1024;
const GRID_CELL_SIZE = 32;

// Соотношения сторон
const MIN_ASPECT_RATIO = 3/4;  // Минимальное соотношение (вертикальный режим)
const MAX_ASPECT_RATIO = 4/3;  // Максимальное соотношение (горизонтальный режим)

// Добавляем коэффициент, чтобы "мир" (уровень), объекты и машина
// были в 2 раза больше, чем раньше:
const WORLD_SCALE = 2;
const REAL_GAME_WIDTH = GAME_WIDTH * WORLD_SCALE; 
const REAL_GAME_HEIGHT = GAME_HEIGHT * WORLD_SCALE;

const SHADOW_COLOR = 0x000000; // Цвет тени (белый) - используем числовой формат для tint
const SHADOW_ALPHA = 0.1;      // Прозрачность тени (50%)
const SHADOW_OFFSET_Y = 5;     // Вертикальное смещение тени (в пикселях)
const SHADOW_DEPTH_OFFSET = -1; // Насколько "ниже" основного спрайта рисовать тень

const VIRTUAL_JOYSTICK_BLOCK_RADIUS = 20;

// --- Цвета и прозрачность ---
const COLOR_BRAKE       = 0xaaaaaa;
const COLOR_ACCELERATE  = 0xadd6dd;
const COLOR_RED         = 0x3dc9b0;
const COLOR_REVERSE     = 0xffa500;

const ZONE_ALPHA_DEFAULT     = 0.3;
const ZONE_ALPHA_HOVER       = 1.0;
const GHOST_ALPHA            = 0.4;
const TRAJECTORY_COLOR       = 0xffffff;
const TRAJECTORY_ALPHA       = 0.7;
const TRAJECTORY_DASH_LENGTH = 10;
const TRAJECTORY_GAP_LENGTH  = 5;
const CUBE_ALPHA             = 1.0;

// --- Параметры машины ---  
const carRadius            = 32;
const MIN_SPEED            = 0.1;
const MAX_SPEED            = 5.0;
const SPEED_INCREMENT      = 1;
const RED_ZONE_SPEED_BOOST = 2;
const RED_ZONE_COOLDOWN_TURNS = 2;

// --- Параметры арки (GUI) ---
const BASE_INNER_RADIUS_GUI           = 30;
const ARC_THICKNESS_GUI               = 50;
const GREEN_ZONE_RATIO                = 0.6;
const BASE_ANGLE_DEG                  = 120;
const SNAP_THRESHOLD = 5; // порог магнитного эффекта в пикселях
const ENHANCED_SNAP_THRESHOLD = 15; // усиленный порог магнитного эффекта (в 3 раза больше)
const ANGLE_SNAP_THRESHOLD = Phaser.Math.DegToRad(15);
const GAP_SNAP_THRESHOLD = 15; 

// --- Факторы влияния скорости на ВИД арки (GUI) ---
const SPEED_TO_GUI_RADIUS_FACTOR      = 40;
const GUI_THICKNESS_REDUCTION_FACTOR  = 0.1;
const MAX_GUI_ANGLE_REDUCTION_FACTOR  = 5;
const MIN_ARC_ANGLE_DEG               = 25;
const MIN_ARC_THICKNESS               = 20;

// --- Параметры арки ЗАДНЕГО ХОДА (GUI) ---
const REVERSE_ARC_INNER_RADIUS  = 25;
const REVERSE_ARC_THICKNESS     = 35;
const REVERSE_ARC_ANGLE_DEG     = 20;

// --- Параметры расчета ДИСТАНЦИИ хода ---
const MIN_MOVE_DISTANCE_FACTOR  = 0.5;
const MAX_MOVE_DISTANCE_FACTOR  = 2.5;
const SPEED_TO_DISTANCE_MULTIPLIER = 15;

// --- Параметры движения и скорости ---
const BASE_PHYSICS_MOVE_SPEED_FACTOR = 1.0;
const CLICK_POS_ANIM_SPEED_FACTOR    = 0.8;
const MIN_ANIM_SPEED_MULTIPLIER      = 0.8;
const MAX_ANIM_SPEED_MULTIPLIER      = 3.5;
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

// --- Параметры препятствий и другие ---
const CUBE_SIZE_FACTOR           = 0.8;
const OBSTACLE_THRESHOLD_DECREMENT = 0.05;
const MIN_OBSTACLE_THRESHOLD     = 0.2;
const TOTAL_LEVELS               = 10;
const INITIAL_OBSTACLE_THRESHOLD = 0.7;

// --- КЛЮЧИ для загруженных ассетов ---
const SAND_TEXTURE_KEY       = 'sandTexture';
const OBSTACLE_IMAGE_KEY     = 'obstacleBlock';
const MAIN_BG_KEY            = 'mainBg';
const START_BUTTON_KEY       = 'startButton';
const CAR_PLAYER_KEY         = 'car_player';
const RESTART_BUTTON_KEY     = 'restartButton';
const NEXT_LEVEL_BUTTON_KEY  = 'nextLevelButton';
const FUEL_PICKUP_KEY        = 'fuelPickup';

// --- Параметры прогрессии ---
const INITIAL_FUEL           = 10;
const FUEL_CONSUMPTION_PER_MOVE = 1;
const FUEL_GAIN_ON_PICKUP    = 5;
const FUEL_LOW_THRESHOLD     = 3;
const FUEL_COLOR_NORMAL      = '#ffffff';
const FUEL_COLOR_LOW         = '#ff0000';

// --- Параметры эффектов ---
const FLASH_DURATION         = 300;
const FLASH_COLOR            = 0xff0000;
const WIN_FLASH_COLOR        = 0x00ff00;
const SHAKE_DURATION         = 300;
const SHAKE_INTENSITY        = 0.01;
const RESTART_DELAY          = 1000; 

const CAMERA_BASE_ZOOM = 2;
const CAMERA_BASE_ZOOM_MOBILE = 1; // Базовый зум для мобильных устройств
const CAMERA_MAX_ZOOM = 1.5;
const CAMERA_ZOOM_SPEED_THRESHOLD = 1; // Скорость, при которой начинается отдаление
const CAMERA_ZOOM_SPEED_MAX = 5; // Скорость, при которой достигается максимальное отдаление

