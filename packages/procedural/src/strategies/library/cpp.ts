/**
 * C++ Library Strategy
 *
 * Generates C++ library projects with CMake.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * C++ library strategy
 */
export const CppLibraryStrategy: GenerationStrategy = {
  id: 'library-cpp',
  name: 'C++ Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'cpp',

  apply: async ({ files, projectName }) => {
    const cleanName = projectName.replace(/-/g, '_');
    const upperName = cleanName.toUpperCase();
    const guardName = `${upperName}_LIB_H`;

    // CMakeLists.txt
    files['CMakeLists.txt'] = `cmake_minimum_required(VERSION 3.20)
project(${cleanName} VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Library target
add_library(${cleanName}
    src/lib.cpp
)

target_include_directories(${cleanName} PUBLIC
    $<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# Tests
option(BUILD_TESTS "Build tests" ON)
if(BUILD_TESTS)
    enable_testing()
    add_executable(${cleanName}_test tests/test_lib.cpp)
    target_link_libraries(${cleanName}_test PRIVATE ${cleanName})
    add_test(NAME ${cleanName}_test COMMAND ${cleanName}_test)
endif()

# Install
install(TARGETS ${cleanName}
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
install(DIRECTORY include/ DESTINATION include)
`;

    // Public header
    files[`include/${cleanName}/lib.h`] = `#ifndef ${guardName}
#define ${guardName}

#include <string>

namespace ${cleanName} {

/**
 * Generate a greeting message.
 */
std::string greet(const std::string& name, const std::string& greeting = "Hello");

/**
 * Add two numbers.
 */
int add(int a, int b);

} // namespace ${cleanName}

#endif // ${guardName}
`;

    // Implementation
    files['src/lib.cpp'] = `#include "${cleanName}/lib.h"

namespace ${cleanName} {

std::string greet(const std::string& name, const std::string& greeting) {
    return greeting + ", " + name + "!";
}

int add(int a, int b) {
    return a + b;
}

} // namespace ${cleanName}
`;

    // Test
    files['tests/test_lib.cpp'] = `#include "${cleanName}/lib.h"
#include <cassert>
#include <iostream>

int main() {
    // Test greet
    assert(${cleanName}::greet("World") == "Hello, World!");
    assert(${cleanName}::greet("World", "Hi") == "Hi, World!");

    // Test add
    assert(${cleanName}::add(1, 2) == 3);

    std::cout << "All tests passed!" << std::endl;
    return 0;
}
`;

    // .gitignore
    files['.gitignore'] = `build/
cmake-build-*/
CMakeFiles/
CMakeCache.txt
*.o
*.a
*.so
*.dylib
.idea/
.vscode/
`;

    // Makefile
    files['Makefile'] = `BUILD_DIR := build

.PHONY: configure build test clean install

configure:
\tcmake -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=Debug

build: configure
\tcmake --build $(BUILD_DIR)

test: build
\tcd $(BUILD_DIR) && ctest --output-on-failure

clean:
\trm -rf $(BUILD_DIR)

install: build
\tcmake --install $(BUILD_DIR)
`;
  },
};
