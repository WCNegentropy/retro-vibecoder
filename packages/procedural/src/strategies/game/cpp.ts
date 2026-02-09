/**
 * C++ Game Strategies
 *
 * Generates game projects using SDL2 and SFML.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * SDL2 game strategy
 */
export const SDL2Strategy: GenerationStrategy = {
  id: 'game-sdl2',
  name: 'SDL2 Game',
  priority: 10,

  matches: stack => stack.archetype === 'game' && stack.framework === 'sdl2',

  apply: async ({ files, projectName }) => {
    const cleanName = projectName.replace(/-/g, '_');

    // CMakeLists.txt
    files['CMakeLists.txt'] = `cmake_minimum_required(VERSION 3.20)
project(${cleanName} VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(SDL2 REQUIRED)

add_executable(${cleanName}
    src/main.cpp
    src/game.cpp
)

target_include_directories(${cleanName} PRIVATE
    \${CMAKE_CURRENT_SOURCE_DIR}/src
    \${SDL2_INCLUDE_DIRS}
)

target_link_libraries(${cleanName} PRIVATE \${SDL2_LIBRARIES})

# Copy assets to build directory
add_custom_command(TARGET ${cleanName} POST_BUILD
    COMMAND \${CMAKE_COMMAND} -E copy_directory
    \${CMAKE_SOURCE_DIR}/assets
    $<TARGET_FILE_DIR:${cleanName}>/assets
)
`;

    // main.cpp
    files['src/main.cpp'] = `#include "game.h"
#include <iostream>

int main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;

    Game game;
    if (!game.init("${projectName}", 800, 600)) {
        std::cerr << "Failed to initialize game" << std::endl;
        return 1;
    }

    game.run();
    game.cleanup();

    return 0;
}
`;

    // game.h
    files['src/game.h'] = `#ifndef GAME_H
#define GAME_H

#include <SDL2/SDL.h>
#include <string>

class Game {
public:
    Game() = default;
    ~Game() = default;

    bool init(const std::string& title, int width, int height);
    void run();
    void cleanup();

private:
    void handleEvents();
    void update(float deltaTime);
    void render();

    SDL_Window* m_window = nullptr;
    SDL_Renderer* m_renderer = nullptr;
    bool m_running = false;
    int m_width = 800;
    int m_height = 600;

    // Player position
    float m_playerX = 400.0f;
    float m_playerY = 300.0f;
    float m_playerSpeed = 200.0f;

    // Input state
    bool m_moveUp = false;
    bool m_moveDown = false;
    bool m_moveLeft = false;
    bool m_moveRight = false;
};

#endif // GAME_H
`;

    // game.cpp
    files['src/game.cpp'] = `#include "game.h"
#include <iostream>

bool Game::init(const std::string& title, int width, int height) {
    m_width = width;
    m_height = height;

    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL init failed: " << SDL_GetError() << std::endl;
        return false;
    }

    m_window = SDL_CreateWindow(
        title.c_str(),
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        m_width, m_height,
        SDL_WINDOW_SHOWN
    );
    if (!m_window) {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        return false;
    }

    m_renderer = SDL_CreateRenderer(m_window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!m_renderer) {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        return false;
    }

    m_running = true;
    return true;
}

void Game::run() {
    Uint64 lastTick = SDL_GetPerformanceCounter();

    while (m_running) {
        Uint64 now = SDL_GetPerformanceCounter();
        float deltaTime = static_cast<float>(now - lastTick) / static_cast<float>(SDL_GetPerformanceFrequency());
        lastTick = now;

        handleEvents();
        update(deltaTime);
        render();
    }
}

void Game::handleEvents() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        if (event.type == SDL_QUIT) {
            m_running = false;
        }
        if (event.type == SDL_KEYDOWN || event.type == SDL_KEYUP) {
            bool pressed = (event.type == SDL_KEYDOWN);
            switch (event.key.keysym.sym) {
                case SDLK_w: case SDLK_UP:    m_moveUp = pressed; break;
                case SDLK_s: case SDLK_DOWN:  m_moveDown = pressed; break;
                case SDLK_a: case SDLK_LEFT:  m_moveLeft = pressed; break;
                case SDLK_d: case SDLK_RIGHT: m_moveRight = pressed; break;
                case SDLK_ESCAPE: m_running = false; break;
                default: break;
            }
        }
    }
}

void Game::update(float deltaTime) {
    if (m_moveUp)    m_playerY -= m_playerSpeed * deltaTime;
    if (m_moveDown)  m_playerY += m_playerSpeed * deltaTime;
    if (m_moveLeft)  m_playerX -= m_playerSpeed * deltaTime;
    if (m_moveRight) m_playerX += m_playerSpeed * deltaTime;

    // Keep player in bounds
    if (m_playerX < 0) m_playerX = 0;
    if (m_playerY < 0) m_playerY = 0;
    if (m_playerX > m_width - 32) m_playerX = static_cast<float>(m_width - 32);
    if (m_playerY > m_height - 32) m_playerY = static_cast<float>(m_height - 32);
}

void Game::render() {
    // Clear screen
    SDL_SetRenderDrawColor(m_renderer, 26, 26, 46, 255);
    SDL_RenderClear(m_renderer);

    // Draw player rectangle
    SDL_SetRenderDrawColor(m_renderer, 0, 255, 136, 255);
    SDL_Rect playerRect = {
        static_cast<int>(m_playerX),
        static_cast<int>(m_playerY),
        32, 32
    };
    SDL_RenderFillRect(m_renderer, &playerRect);

    SDL_RenderPresent(m_renderer);
}

void Game::cleanup() {
    if (m_renderer) SDL_DestroyRenderer(m_renderer);
    if (m_window) SDL_DestroyWindow(m_window);
    SDL_Quit();
}
`;

    // assets placeholder
    files['assets/.gitkeep'] = '';

    // .gitignore
    files['.gitignore'] = `build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt
*.o
*.exe
.idea/
.vscode/
`;

    // Makefile
    files['Makefile'] = `BUILD_DIR := build

.PHONY: configure build run clean

configure:
\tcmake -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=Debug

build: configure
\tcmake --build $(BUILD_DIR)

run: build
\t./$(BUILD_DIR)/${cleanName}

clean:
\trm -rf $(BUILD_DIR)
`;
  },
};

/**
 * SFML game strategy
 */
export const SFMLStrategy: GenerationStrategy = {
  id: 'game-sfml',
  name: 'SFML Game',
  priority: 10,

  matches: stack => stack.archetype === 'game' && stack.framework === 'sfml',

  apply: async ({ files, projectName }) => {
    const cleanName = projectName.replace(/-/g, '_');

    // CMakeLists.txt
    files['CMakeLists.txt'] = `cmake_minimum_required(VERSION 3.20)
project(${cleanName} VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(SFML 2.6 COMPONENTS graphics window system REQUIRED)

add_executable(${cleanName}
    src/main.cpp
    src/game.cpp
)

target_include_directories(${cleanName} PRIVATE
    \${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(${cleanName} PRIVATE sfml-graphics sfml-window sfml-system)

# Copy assets to build directory
add_custom_command(TARGET ${cleanName} POST_BUILD
    COMMAND \${CMAKE_COMMAND} -E copy_directory
    \${CMAKE_SOURCE_DIR}/assets
    $<TARGET_FILE_DIR:${cleanName}>/assets
)
`;

    // main.cpp
    files['src/main.cpp'] = `#include "game.h"

int main() {
    Game game;
    if (!game.init("${projectName}", 800, 600)) {
        return 1;
    }

    game.run();
    return 0;
}
`;

    // game.h
    files['src/game.h'] = `#ifndef GAME_H
#define GAME_H

#include <SFML/Graphics.hpp>
#include <string>

class Game {
public:
    Game() = default;
    ~Game() = default;

    bool init(const std::string& title, int width, int height);
    void run();

private:
    void handleEvents();
    void update(float deltaTime);
    void render();

    sf::RenderWindow m_window;
    bool m_running = false;

    // Player
    sf::RectangleShape m_player;
    float m_playerSpeed = 200.0f;

    // Input
    bool m_moveUp = false;
    bool m_moveDown = false;
    bool m_moveLeft = false;
    bool m_moveRight = false;
};

#endif // GAME_H
`;

    // game.cpp
    files['src/game.cpp'] = `#include "game.h"

bool Game::init(const std::string& title, int width, int height) {
    m_window.create(sf::VideoMode(width, height), title);
    m_window.setFramerateLimit(60);

    m_player.setSize(sf::Vector2f(32.0f, 32.0f));
    m_player.setFillColor(sf::Color(0, 255, 136));
    m_player.setPosition(400.0f, 300.0f);

    m_running = true;
    return true;
}

void Game::run() {
    sf::Clock clock;

    while (m_running && m_window.isOpen()) {
        float deltaTime = clock.restart().asSeconds();
        handleEvents();
        update(deltaTime);
        render();
    }
}

void Game::handleEvents() {
    sf::Event event;
    while (m_window.pollEvent(event)) {
        if (event.type == sf::Event::Closed) {
            m_running = false;
            m_window.close();
        }
        if (event.type == sf::Event::KeyPressed || event.type == sf::Event::KeyReleased) {
            bool pressed = (event.type == sf::Event::KeyPressed);
            switch (event.key.code) {
                case sf::Keyboard::W: case sf::Keyboard::Up:    m_moveUp = pressed; break;
                case sf::Keyboard::S: case sf::Keyboard::Down:  m_moveDown = pressed; break;
                case sf::Keyboard::A: case sf::Keyboard::Left:  m_moveLeft = pressed; break;
                case sf::Keyboard::D: case sf::Keyboard::Right: m_moveRight = pressed; break;
                case sf::Keyboard::Escape: m_running = false; break;
                default: break;
            }
        }
    }
}

void Game::update(float deltaTime) {
    sf::Vector2f movement(0.0f, 0.0f);
    if (m_moveUp)    movement.y -= m_playerSpeed * deltaTime;
    if (m_moveDown)  movement.y += m_playerSpeed * deltaTime;
    if (m_moveLeft)  movement.x -= m_playerSpeed * deltaTime;
    if (m_moveRight) movement.x += m_playerSpeed * deltaTime;

    m_player.move(movement);
}

void Game::render() {
    m_window.clear(sf::Color(26, 26, 46));
    m_window.draw(m_player);
    m_window.display();
}
`;

    // Entity base
    files['src/entity.h'] = `#ifndef ENTITY_H
#define ENTITY_H

#include <SFML/Graphics.hpp>

class Entity {
public:
    virtual ~Entity() = default;
    virtual void update(float deltaTime) = 0;
    virtual void draw(sf::RenderWindow& window) = 0;

    sf::Vector2f getPosition() const { return m_sprite.getPosition(); }
    void setPosition(float x, float y) { m_sprite.setPosition(x, y); }

protected:
    sf::Sprite m_sprite;
};

#endif // ENTITY_H
`;

    // assets placeholder
    files['assets/.gitkeep'] = '';

    // .gitignore
    files['.gitignore'] = `build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt
*.o
*.exe
.idea/
.vscode/
`;

    // Makefile
    files['Makefile'] = `BUILD_DIR := build

.PHONY: configure build run clean

configure:
\tcmake -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=Debug

build: configure
\tcmake --build $(BUILD_DIR)

run: build
\t./$(BUILD_DIR)/${cleanName}

clean:
\trm -rf $(BUILD_DIR)
`;
  },
};
