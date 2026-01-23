/**
 * Java/Kotlin Backend Strategies
 *
 * Generates Java or Kotlin Spring Boot backend projects.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Spring Boot backend strategy
 * Supports both Java and Kotlin
 */
export const JavaSpringStrategy: GenerationStrategy = {
  id: 'java-spring',
  name: 'Spring Boot Backend',
  priority: 10,

  matches: stack =>
    (stack.language === 'java' || stack.language === 'kotlin') &&
    stack.archetype === 'backend' &&
    stack.framework === 'spring-boot',

  apply: async ({ files, projectName, stack }) => {
    const isKotlin = stack.language === 'kotlin';
    const group = 'com.example';
    const artifact = projectName.replace(/-/g, '').toLowerCase();
    const langDir = isKotlin ? 'kotlin' : 'java';
    const pkgPath = `src/main/${langDir}/${group.replace(/\./g, '/')}/${artifact}`;
    const testPkgPath = `src/test/${langDir}/${group.replace(/\./g, '/')}/${artifact}`;

    // 1. build.gradle.kts (Kotlin DSL)
    const dependencies = [
      'implementation("org.springframework.boot:spring-boot-starter-web")',
      'testImplementation("org.springframework.boot:spring-boot-starter-test")',
    ];

    if (isKotlin) {
      dependencies.push('implementation("com.fasterxml.jackson.module:jackson-module-kotlin")');
      dependencies.push('implementation("org.jetbrains.kotlin:kotlin-reflect")');
    }

    if (stack.database === 'postgres') {
      dependencies.push('implementation("org.springframework.boot:spring-boot-starter-data-jpa")');
      dependencies.push('runtimeOnly("org.postgresql:postgresql")');
    } else if (stack.database === 'mysql') {
      dependencies.push('implementation("org.springframework.boot:spring-boot-starter-data-jpa")');
      dependencies.push('runtimeOnly("com.mysql:mysql-connector-j")');
    } else if (stack.database === 'mongodb') {
      dependencies.push(
        'implementation("org.springframework.boot:spring-boot-starter-data-mongodb")'
      );
    }

    if (isKotlin) {
      files['build.gradle.kts'] = `plugins {
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.spring") version "1.9.22"
}

group = "${group}"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
${dependencies.map(d => `    ${d}`).join('\n')}
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
`;
    } else {
      files['build.gradle.kts'] = `plugins {
    java
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "${group}"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
${dependencies.map(d => `    ${d}`).join('\n')}
}

tasks.withType<Test> {
    useJUnitPlatform()
}
`;
    }

    // 2. Settings
    files['settings.gradle.kts'] = `rootProject.name = "${projectName}"
`;

    // 3. gradle.properties
    files['gradle.properties'] = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
`;

    // 4. Gradle wrapper properties
    files['gradle/wrapper/gradle-wrapper.properties'] = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

    // 5. Application Class
    if (isKotlin) {
      files[`${pkgPath}/Application.kt`] = `package ${group}.${artifact}

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}
`;

      // 6. Health Controller (Kotlin)
      files[`${pkgPath}/controller/HealthController.kt`] = `package ${group}.${artifact}.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
class HealthController {

    @GetMapping("/health")
    fun health() = mapOf(
        "status" to "ok",
        "timestamp" to Instant.now().toString()
    )

    @GetMapping("/api")
    fun api() = mapOf("message" to "Welcome to ${projectName} API")
}
`;
    } else {
      files[`${pkgPath}/Application.java`] = `package ${group}.${artifact};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
`;

      // 6. Health Controller (Java)
      files[`${pkgPath}/controller/HealthController.java`] =
        `package ${group}.${artifact}.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "ok",
            "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/api")
    public Map<String, String> api() {
        return Map.of("message", "Welcome to ${projectName} API");
    }
}
`;
    }

    // 7. Application properties
    let appProps = `server.port=8080
spring.application.name=${projectName}
`;

    if (stack.database === 'postgres') {
      appProps += `
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/${artifact}
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
`;
    } else if (stack.database === 'mysql') {
      appProps += `
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/${artifact}
spring.datasource.username=root
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
`;
    } else if (stack.database === 'mongodb') {
      appProps += `
# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/${artifact}
`;
    }

    files['src/main/resources/application.properties'] = appProps;

    // 8. Test class
    if (isKotlin) {
      files[`${testPkgPath}/ApplicationTests.kt`] = `package ${group}.${artifact}

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class ApplicationTests {

    @Test
    fun contextLoads() {
    }
}
`;
    } else {
      files[`${testPkgPath}/ApplicationTests.java`] = `package ${group}.${artifact};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {

    @Test
    void contextLoads() {
    }
}
`;
    }

    // 9. .gitignore
    files['.gitignore'] = `# Compiled class files
*.class

# Log files
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# Build directories
build/
target/
out/

# Gradle
.gradle/
!gradle/wrapper/gradle-wrapper.jar

# IDE
.idea/
*.iml
*.ipr
*.iws
.vscode/
.settings/
.classpath
.project

# Environment
.env
`;

    // 10. Makefile
    files['Makefile'] = `GRADLE := ./gradlew

.PHONY: build run test clean

build:
\t$(GRADLE) build

run:
\t$(GRADLE) bootRun

test:
\t$(GRADLE) test

clean:
\t$(GRADLE) clean

jar:
\t$(GRADLE) bootJar
`;
  },
};
