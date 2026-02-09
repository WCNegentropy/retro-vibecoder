/**
 * JVM Library Strategies
 *
 * Generates Java and Kotlin library packages for Maven Central.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Java library strategy
 */
export const JavaLibraryStrategy: GenerationStrategy = {
  id: 'library-java',
  name: 'Java Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'java',

  apply: async ({ files, projectName }) => {
    const artifactId = projectName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const pkgPath = `com/example/${artifactId.replace(/-/g, '')}`;
    const pkg = `com.example.${artifactId.replace(/-/g, '')}`;
    const className = artifactId
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    // build.gradle.kts
    files['build.gradle.kts'] = `plugins {
    \`java-library\`
    \`maven-publish\`
}

group = "${pkg}"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
    withSourcesJar()
    withJavadocJar()
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
        }
    }
}
`;

    // settings.gradle.kts
    files['settings.gradle.kts'] = `rootProject.name = "${artifactId}"
`;

    // Source
    files[`src/main/java/${pkgPath}/${className}.java`] = `package ${pkg};

/**
 * ${className} library.
 */
public class ${className} {

    /**
     * Generate a greeting message.
     *
     * @param name the name to greet
     * @return the greeting string
     */
    public static String greet(String name) {
        return greet(name, "Hello");
    }

    /**
     * Generate a greeting message with a custom prefix.
     *
     * @param name     the name to greet
     * @param greeting the greeting prefix
     * @return the greeting string
     */
    public static String greet(String name, String greeting) {
        return greeting + ", " + name + "!";
    }

    /**
     * Add two numbers.
     *
     * @param a first number
     * @param b second number
     * @return the sum
     */
    public static int add(int a, int b) {
        return a + b;
    }
}
`;

    // Test
    files[`src/test/java/${pkgPath}/${className}Test.java`] = `package ${pkg};

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ${className}Test {

    @Test
    void testGreetDefault() {
        assertEquals("Hello, World!", ${className}.greet("World"));
    }

    @Test
    void testGreetCustom() {
        assertEquals("Hi, World!", ${className}.greet("World", "Hi"));
    }

    @Test
    void testAdd() {
        assertEquals(3, ${className}.add(1, 2));
    }
}
`;

    // .gitignore
    files['.gitignore'] = `.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
*.class
*.jar
*.war
.idea/
*.iml
`;

    // Makefile
    files['Makefile'] = `GRADLE := ./gradlew

.PHONY: build test clean publish

build:
\t$(GRADLE) build

test:
\t$(GRADLE) test

clean:
\t$(GRADLE) clean

publish:
\t$(GRADLE) publish
`;
  },
};

/**
 * Kotlin library strategy
 */
export const KotlinLibraryStrategy: GenerationStrategy = {
  id: 'library-kotlin',
  name: 'Kotlin Library',
  priority: 10,

  matches: stack => stack.archetype === 'library' && stack.language === 'kotlin',

  apply: async ({ files, projectName }) => {
    const artifactId = projectName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const pkgPath = `com/example/${artifactId.replace(/-/g, '')}`;
    const pkg = `com.example.${artifactId.replace(/-/g, '')}`;
    const className = artifactId
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    // build.gradle.kts
    files['build.gradle.kts'] = `plugins {
    kotlin("jvm") version "1.9.22"
    \`maven-publish\`
}

group = "${pkg}"
version = "0.1.0"

kotlin {
    jvmToolchain(17)
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
}

tasks.test {
    useJUnitPlatform()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
        }
    }
}
`;

    // settings.gradle.kts
    files['settings.gradle.kts'] = `rootProject.name = "${artifactId}"
`;

    // Source
    files[`src/main/kotlin/${pkgPath}/${className}.kt`] = `package ${pkg}

/**
 * ${className} library.
 */
object ${className} {

    /**
     * Generate a greeting message.
     */
    fun greet(name: String, greeting: String = "Hello"): String {
        return "$greeting, $name!"
    }

    /**
     * Add two numbers.
     */
    fun add(a: Int, b: Int): Int {
        return a + b
    }
}
`;

    // Test
    files[`src/test/kotlin/${pkgPath}/${className}Test.kt`] = `package ${pkg}

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class ${className}Test {

    @Test
    fun testGreetDefault() {
        assertEquals("Hello, World!", ${className}.greet("World"))
    }

    @Test
    fun testGreetCustom() {
        assertEquals("Hi, World!", ${className}.greet("World", "Hi"))
    }

    @Test
    fun testAdd() {
        assertEquals(3, ${className}.add(1, 2))
    }
}
`;

    // .gitignore
    files['.gitignore'] = `.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
*.class
*.jar
.idea/
*.iml
`;

    // Makefile
    files['Makefile'] = `GRADLE := ./gradlew

.PHONY: build test clean publish

build:
\t$(GRADLE) build

test:
\t$(GRADLE) test

clean:
\t$(GRADLE) clean

publish:
\t$(GRADLE) publish
`;
  },
};
