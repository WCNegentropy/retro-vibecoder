/**
 * C++ Systems Strategy
 *
 * Generates C++ projects with CMake and Conan package management.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * C++ CMake project strategy
 */
export const CppStrategy: GenerationStrategy = {
  id: 'cpp-cmake',
  name: 'C++ CMake Project',
  priority: 10,

  matches: stack => stack.language === 'cpp',

  apply: async ({ files, projectName, stack }) => {
    const std = '20'; // Default to C++20
    const cleanName = projectName.replace(/-/g, '_');

    // 1. CMakeLists.txt
    files['CMakeLists.txt'] = `cmake_minimum_required(VERSION 3.20)
project(${cleanName} VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD ${std})
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Source files
add_executable(${cleanName} src/main.cpp)

# Include directories
target_include_directories(${cleanName} PRIVATE src)

# Conan integration (when using conan install)
if(EXISTS "\${CMAKE_BINARY_DIR}/conan_toolchain.cmake")
  include(\${CMAKE_BINARY_DIR}/conan_toolchain.cmake)
endif()

# Find packages installed by Conan
find_package(fmt QUIET)
if(fmt_FOUND)
  target_link_libraries(${cleanName} PRIVATE fmt::fmt)
  target_compile_definitions(${cleanName} PRIVATE HAS_FMT)
endif()
`;

    // 2. Conan configuration (conanfile.txt)
    files['conanfile.txt'] = `[requires]
fmt/10.1.1

[generators]
CMakeDeps
CMakeToolchain

[layout]
cmake_layout
`;

    // 3. Source Code
    files['src/main.cpp'] = `#include <iostream>
#include <string>

#ifdef HAS_FMT
#include <fmt/core.h>
#endif

int main() {
    std::string name = "${projectName}";

#ifdef HAS_FMT
    fmt::println("Hello from {} (C++${std})!", name);
#else
    std::cout << "Hello from " << name << " (C++${std})!" << std::endl;
#endif

    return 0;
}
`;

    // 4. Build Scripts
    files['build.sh'] = `#!/bin/bash
set -e

# Check if conan is available
if command -v conan &> /dev/null; then
    echo "Installing dependencies with Conan..."
    conan install . --output-folder=build --build=missing
fi

echo "Building project..."
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build .

echo "Build complete! Binary at build/${cleanName}"
`;

    // 5. .gitignore
    files['.gitignore'] = `# Build directories
build/
cmake-build-*/
out/

# Conan
CMakeUserPresets.json
conan.lock

# IDE
.idea/
.vscode/
*.swp
*.swo

# Compiled files
*.o
*.obj
*.exe
`;

    // 6. CMakePresets.json for modern CMake workflow
    files['CMakePresets.json'] = JSON.stringify(
      {
        version: 3,
        configurePresets: [
          {
            name: 'default',
            binaryDir: '${sourceDir}/build',
            generator: 'Ninja',
            cacheVariables: {
              CMAKE_BUILD_TYPE: 'Release',
            },
          },
          {
            name: 'debug',
            inherits: 'default',
            cacheVariables: {
              CMAKE_BUILD_TYPE: 'Debug',
            },
          },
        ],
        buildPresets: [
          {
            name: 'default',
            configurePreset: 'default',
          },
          {
            name: 'debug',
            configurePreset: 'debug',
          },
        ],
      },
      null,
      2
    );

    // 7. Makefile for convenience
    files['Makefile'] = `CMAKE := cmake
BUILD_DIR := build

.PHONY: all build clean rebuild test

all: build

build:
\tmkdir -p $(BUILD_DIR)
\tcd $(BUILD_DIR) && $(CMAKE) .. -DCMAKE_BUILD_TYPE=Release && $(CMAKE) --build .

debug:
\tmkdir -p $(BUILD_DIR)
\tcd $(BUILD_DIR) && $(CMAKE) .. -DCMAKE_BUILD_TYPE=Debug && $(CMAKE) --build .

clean:
\trm -rf $(BUILD_DIR)

rebuild: clean build

run: build
\t./$(BUILD_DIR)/${cleanName}

conan:
\tconan install . --output-folder=$(BUILD_DIR) --build=missing
`;

    // Add database support if configured
    if (stack.database === 'postgres' || stack.database === 'sqlite') {
      addCppDatabaseSupport(files, stack.database, cleanName);
    }
  },
};

/**
 * Add database support for C++ projects
 */
function addCppDatabaseSupport(
  files: Record<string, string>,
  database: string,
  _projectName: string
): void {
  // Update conanfile to include database library
  const dbDep = database === 'postgres' ? 'libpqxx/7.8.1' : 'sqlite3/3.44.2';

  files['conanfile.txt'] = `[requires]
fmt/10.1.1
${dbDep}

[generators]
CMakeDeps
CMakeToolchain

[layout]
cmake_layout
`;

  // Add database header
  if (database === 'postgres') {
    files['src/db.hpp'] = `#pragma once

#include <pqxx/pqxx>
#include <string>
#include <memory>

class Database {
public:
    explicit Database(const std::string& connection_string);
    bool is_connected() const;

private:
    std::unique_ptr<pqxx::connection> conn_;
};
`;
  } else {
    files['src/db.hpp'] = `#pragma once

#include <sqlite3.h>
#include <string>
#include <memory>

class Database {
public:
    explicit Database(const std::string& db_path);
    ~Database();
    bool is_connected() const;

private:
    sqlite3* db_ = nullptr;
};
`;
  }
}
