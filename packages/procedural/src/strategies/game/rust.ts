/**
 * Rust Game Strategies
 *
 * Generates game projects using Bevy and Macroquad.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Bevy game strategy
 */
export const BevyStrategy: GenerationStrategy = {
  id: 'game-bevy',
  name: 'Bevy Game',
  priority: 10,

  matches: stack => stack.archetype === 'game' && stack.framework === 'bevy',

  apply: async ({ files, projectName }) => {
    const crateName = projectName.replace(/-/g, '_');

    // Cargo.toml
    files['Cargo.toml'] = `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"

[dependencies]
bevy = "0.13"

# Enable optimizations for dependencies in dev (faster compile for Bevy)
[profile.dev.package."*"]
opt-level = 1
`;

    // main.rs
    files['src/main.rs'] = `use bevy::prelude::*;

mod camera;
mod player;
mod state;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "${projectName}".to_string(),
                resolution: (800.0, 600.0).into(),
                ..default()
            }),
            ..default()
        }))
        .init_state::<state::GameState>()
        .add_systems(Startup, (camera::setup_camera, player::spawn_player))
        .add_systems(Update, player::player_movement)
        .run();
}
`;

    // camera.rs
    files['src/camera.rs'] = `use bevy::prelude::*;

pub fn setup_camera(mut commands: Commands) {
    commands.spawn(Camera2dBundle::default());
}
`;

    // player.rs
    files['src/player.rs'] = `use bevy::prelude::*;

#[derive(Component)]
pub struct Player {
    pub speed: f32,
}

pub fn spawn_player(mut commands: Commands) {
    commands.spawn((
        SpriteBundle {
            sprite: Sprite {
                color: Color::srgb(0.0, 1.0, 0.53),
                custom_size: Some(Vec2::new(32.0, 32.0)),
                ..default()
            },
            transform: Transform::from_translation(Vec3::ZERO),
            ..default()
        },
        Player { speed: 200.0 },
    ));
}

pub fn player_movement(
    keyboard: Res<ButtonInput<KeyCode>>,
    time: Res<Time>,
    mut query: Query<(&Player, &mut Transform)>,
) {
    for (player, mut transform) in &mut query {
        let mut direction = Vec3::ZERO;

        if keyboard.pressed(KeyCode::KeyW) || keyboard.pressed(KeyCode::ArrowUp) {
            direction.y += 1.0;
        }
        if keyboard.pressed(KeyCode::KeyS) || keyboard.pressed(KeyCode::ArrowDown) {
            direction.y -= 1.0;
        }
        if keyboard.pressed(KeyCode::KeyA) || keyboard.pressed(KeyCode::ArrowLeft) {
            direction.x -= 1.0;
        }
        if keyboard.pressed(KeyCode::KeyD) || keyboard.pressed(KeyCode::ArrowRight) {
            direction.x += 1.0;
        }

        if direction.length() > 0.0 {
            direction = direction.normalize();
        }

        transform.translation += direction * player.speed * time.delta_seconds();
    }
}
`;

    // state.rs
    files['src/state.rs'] = `use bevy::prelude::*;

#[derive(States, Debug, Clone, Copy, Eq, PartialEq, Hash, Default)]
pub enum GameState {
    #[default]
    Playing,
    Paused,
    GameOver,
}
`;

    // assets placeholder
    files['assets/.gitkeep'] = '';

    // .gitignore
    files['.gitignore'] = `target/
Cargo.lock
`;

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: run build test lint fmt clean

run:
\t$(CARGO) run

build:
\t$(CARGO) build --release

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

clean:
\t$(CARGO) clean
`;
  },
};

/**
 * Macroquad game strategy
 */
export const MacroquadStrategy: GenerationStrategy = {
  id: 'game-macroquad',
  name: 'Macroquad Game',
  priority: 10,

  matches: stack => stack.archetype === 'game' && stack.framework === 'macroquad',

  apply: async ({ files, projectName }) => {
    const crateName = projectName.replace(/-/g, '_');

    // Cargo.toml
    files['Cargo.toml'] = `[package]
name = "${crateName}"
version = "0.1.0"
edition = "2021"

[dependencies]
macroquad = "0.4"
`;

    // main.rs
    files['src/main.rs'] = `use macroquad::prelude::*;

mod player;

#[macroquad::main("${projectName}")]
async fn main() {
    let mut player = player::Player::new(
        screen_width() / 2.0,
        screen_height() / 2.0,
    );

    loop {
        // Update
        player.update(get_frame_time());

        // Draw
        clear_background(Color::new(0.1, 0.1, 0.18, 1.0));

        player.draw();

        // UI
        draw_text(
            "${projectName}",
            screen_width() / 2.0 - 100.0,
            40.0,
            32.0,
            Color::new(0.0, 1.0, 0.53, 1.0),
        );

        draw_text(
            "WASD or Arrow Keys to move",
            screen_width() / 2.0 - 140.0,
            screen_height() - 30.0,
            20.0,
            GRAY,
        );

        draw_text(
            &format!("FPS: {}", get_fps()),
            10.0,
            20.0,
            20.0,
            WHITE,
        );

        next_frame().await;
    }
}
`;

    // player.rs
    files['src/player.rs'] = `use macroquad::prelude::*;

pub struct Player {
    pub x: f32,
    pub y: f32,
    pub size: f32,
    pub speed: f32,
}

impl Player {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            size: 32.0,
            speed: 200.0,
        }
    }

    pub fn update(&mut self, delta: f32) {
        if is_key_down(KeyCode::W) || is_key_down(KeyCode::Up) {
            self.y -= self.speed * delta;
        }
        if is_key_down(KeyCode::S) || is_key_down(KeyCode::Down) {
            self.y += self.speed * delta;
        }
        if is_key_down(KeyCode::A) || is_key_down(KeyCode::Left) {
            self.x -= self.speed * delta;
        }
        if is_key_down(KeyCode::D) || is_key_down(KeyCode::Right) {
            self.x += self.speed * delta;
        }

        // Keep in bounds
        self.x = self.x.clamp(0.0, screen_width() - self.size);
        self.y = self.y.clamp(0.0, screen_height() - self.size);
    }

    pub fn draw(&self) {
        draw_rectangle(
            self.x,
            self.y,
            self.size,
            self.size,
            Color::new(0.0, 1.0, 0.53, 1.0),
        );
    }
}
`;

    // .gitignore
    files['.gitignore'] = `target/
Cargo.lock
`;

    // Makefile
    files['Makefile'] = `CARGO := cargo

.PHONY: run build test lint fmt clean

run:
\t$(CARGO) run

build:
\t$(CARGO) build --release

test:
\t$(CARGO) test

lint:
\t$(CARGO) clippy -- -D warnings

fmt:
\t$(CARGO) fmt

clean:
\t$(CARGO) clean
`;
  },
};
