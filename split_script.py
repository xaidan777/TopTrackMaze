import os
import re

# --- Настройки ---
input_filename = 'game.js'
output_filenames = {
    'constants': 'Constants.js',
    'main_menu': 'MainMenuScene.js',
    'game_scene': 'GameScene.js'
}

# --- Маркеры для разделения кода (исправленные) ---
# Используем только содержательную строку комментария
markers = {
    'constants_start': "// --- КОНСТАНТЫ И НАСТРОЙКИ (Обновленные) ---",
    'main_menu_start': "// --- КЛАСС СЦЕНЫ ГЛАВНОГО МЕНЮ ---",
    'game_scene_start': "// --- КЛАСС СЦЕНЫ ИГРЫ ---",
    'config_start': "// --- КОНФИГ ФЕЙЗЕРА И СТАРТ ---",
}

# --- Основная логика ---
def split_game_js():
    """
    Читает game.js, находит маркеры и разделяет код на три файла:
    Constants.js (константы + конфиг Phaser), MainMenuScene.js, GameScene.js.
    """
    print(f"Запуск скрипта для разделения '{input_filename}'...")

    # Проверяем, существует ли входной файл
    if not os.path.exists(input_filename):
        print(f"Ошибка: Входной файл '{input_filename}' не найден.")
        print(f"Пожалуйста, убедитесь, что '{input_filename}' существует в текущей директории ({os.getcwd()})")
        print("и скрипт запускается из этой директории.")
        return

    print(f"Чтение файла '{input_filename}'...")
    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Файл '{input_filename}' успешно прочитан.")
    except Exception as e:
        print(f"Ошибка при чтении файла '{input_filename}': {e}")
        return

    # Находим индексы начала каждого блока
    indices = {}
    all_markers_found = True
    print("Поиск маркеров для разделения...")
    for key, marker_text in markers.items():
        index = content.find(marker_text)
        if index == -1:
            print(f"Ошибка: Маркер '{marker_text}' не найден в '{input_filename}'. Невозможно корректно разделить файл.")
            all_markers_found = False
            # Не прерываем сразу, чтобы сообщить обо всех отсутствующих маркерах
        else:
            # Находим НАЧАЛО СТРОКИ, где находится маркер
            line_start_index = content.rfind('\n', 0, index) + 1
            # НО! Нам нужно начало ПРЕДЫДУЩЕЙ строки (чтобы захватить декоративный коммент)
            # Найдем начало строки маркера, а потом еще раз найдем предыдущий \n
            marker_line_start = content.rfind('\n', 0, index) + 1
            block_start_index = content.rfind('\n', 0, marker_line_start - 1) + 1 # Индекс начала блока (с верхней ===)
            # Если это самый первый маркер, block_start_index может быть 0
            if key == 'constants_start' and block_start_index == 1 : # rfind вернет -1 -> +1 = 0, но если маркер не в первой строке, будет > 0
                 block_start_index = 0 # Самый первый блок начинается с индекса 0

            indices[key] = block_start_index # Сохраняем индекс НАЧАЛА БЛОКА (===)

            # Вычисляем номер строки ПЕРЕД f-строкой (для информативности)
            line_num = content[:index].count('\n') + 1 # Считаем до найденного маркера
            print(f"Найден маркер '{marker_text}' (на строке {line_num}). Блок начинается с индекса {indices[key]}.")


    if not all_markers_found:
         print("Разделение отменено из-за отсутствия необходимых маркеров.")
         return

    # Извлекаем секции кода
    print("Извлечение секций кода...")
    try:
        # Константы: от начала блока констант до начала блока главного меню
        constants_section = content[indices['constants_start'] : indices['main_menu_start']]

        # Главное меню: от начала блока меню до начала блока игры
        main_menu_section = content[indices['main_menu_start'] : indices['game_scene_start']]

        # Игровая сцена: от начала блока игры до начала блока конфига
        game_scene_section = content[indices['game_scene_start'] : indices['config_start']]

        # Конфиг/Старт: от начала блока конфига до конца файла
        config_section = content[indices['config_start'] : ]

        print("Секции кода успешно извлечены.")

    except KeyError as e:
         print(f"Ошибка: Отсутствует ожидаемый индекс маркера для '{e}'. Это не должно произойти, если все маркеры были найдены.")
         return
    except Exception as e:
        print(f"Ошибка во время извлечения секций: {e}")
        return

    # Записываем секции в файлы
    print("Запись секций в выходные файлы...")
    try:
        # Файл констант: содержит блок констант И блок конфига/старта ("все остальное")
        with open(output_filenames['constants'], 'w', encoding='utf-8') as f:
            # Записываем блок констант, убирая лишние пробелы/переносы по краям
            f.write(constants_section.strip() + '\n\n')
            # Записываем блок конфига
            f.write(config_section.strip() + '\n')
        print(f" -> Успешно записано в '{output_filenames['constants']}' (Константы + Конфиг/Старт).")

        # Файл сцены главного меню
        with open(output_filenames['main_menu'], 'w', encoding='utf-8') as f:
             # Записываем блок
            f.write(main_menu_section.strip() + '\n')
        print(f" -> Успешно записано в '{output_filenames['main_menu']}' (Сцена главного меню).")

        # Файл игровой сцены
        with open(output_filenames['game_scene'], 'w', encoding='utf-8') as f:
             # Записываем блок
            f.write(game_scene_section.strip() + '\n')
        print(f" -> Успешно записано в '{output_filenames['game_scene']}' (Сцена игры).")

        print("\nРазделение кода завершено!")
        print("="*40)
        print("ВАЖНОЕ ЗАМЕЧАНИЕ:")
        print("Не забудьте обновить ваш HTML файл (обычно index.html), чтобы он загружал новые JS файлы.")
        print("Замените строку `<script src=\"game.js\"></script>` на следующие строки В ЭТОМ ПОРЯДКЕ:")
        print(f"1. <script src=\"{output_filenames['constants']}\"></script>")
        print(f"2. <script src=\"{output_filenames['main_menu']}\"></script>")
        print(f"3. <script src=\"{output_filenames['game_scene']}\"></script>")
        print("(Убедитесь, что библиотеки Phaser и SimplexNoise загружаются *до* этих файлов).")
        print("Код конфигурации Phaser и инициализации игры теперь находится в конце файла Constants.js.")
        print("="*40)

    except IOError as e:
        print(f"Ошибка при записи в выходной файл: {e}")
    except Exception as e:
        print(f"Произошла непредвиденная ошибка при записи файлов: {e}")

# --- Запуск скрипта ---
if __name__ == "__main__":
    split_game_js()