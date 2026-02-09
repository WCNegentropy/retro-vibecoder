/**
 * Android Mobile Strategies
 *
 * Generates Kotlin Jetpack Compose Android projects.
 */

import type { GenerationStrategy } from '../../types.js';

/**
 * Jetpack Compose mobile app strategy
 */
export const JetpackComposeStrategy: GenerationStrategy = {
  id: 'mobile-jetpack-compose',
  name: 'Jetpack Compose Mobile App',
  priority: 10,

  matches: stack =>
    stack.archetype === 'mobile' &&
    stack.language === 'kotlin' &&
    stack.framework === 'jetpack-compose',

  apply: async ({ files, projectName }) => {
    const cleanName = projectName.replace(/[^a-zA-Z0-9]/g, '');
    const pkgPath = `com/example/${cleanName.toLowerCase()}`;
    const pkg = `com.example.${cleanName.toLowerCase()}`;

    // 1. Root build.gradle.kts
    files['build.gradle.kts'] = `plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
`;

    // 2. settings.gradle.kts
    files['settings.gradle.kts'] = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolution {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${projectName}"
include(":app")
`;

    // 3. gradle.properties
    files['gradle.properties'] = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

    // 4. App build.gradle.kts
    files['app/build.gradle.kts'] = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${pkg}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.6")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.01.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
`;

    // 5. Proguard rules
    files['app/proguard-rules.pro'] = `# Add project specific ProGuard rules here.
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html
`;

    // 6. AndroidManifest.xml
    files['app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.${cleanName}"
        tools:targetApi="31">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.${cleanName}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

    // 7. MainActivity.kt
    files[`app/src/main/kotlin/${pkgPath}/MainActivity.kt`] = `package ${pkg}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import ${pkg}.ui.theme.${cleanName}Theme
import ${pkg}.ui.screens.HomeScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ${cleanName}Theme {
                HomeScreen()
            }
        }
    }
}
`;

    // 8. Theme.kt
    files[`app/src/main/kotlin/${pkgPath}/ui/theme/Theme.kt`] = `package ${pkg}.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    secondary = PurpleGrey80,
    tertiary = Pink80,
)

private val LightColorScheme = lightColorScheme(
    primary = Purple40,
    secondary = PurpleGrey40,
    tertiary = Pink40,
)

@Composable
fun ${cleanName}Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content,
    )
}
`;

    // 9. Color.kt
    files[`app/src/main/kotlin/${pkgPath}/ui/theme/Color.kt`] = `package ${pkg}.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)
`;

    // 10. Type.kt
    files[`app/src/main/kotlin/${pkgPath}/ui/theme/Type.kt`] = `package ${pkg}.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp,
    ),
)
`;

    // 11. HomeScreen.kt
    files[`app/src/main/kotlin/${pkgPath}/ui/screens/HomeScreen.kt`] = `package ${pkg}.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import ${pkg}.ui.theme.${cleanName}Theme

@Composable
fun HomeScreen(modifier: Modifier = Modifier) {
    var counter by remember { mutableIntStateOf(0) }

    Scaffold(modifier = modifier.fillMaxSize()) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Welcome to ${projectName}!",
                style = MaterialTheme.typography.headlineMedium,
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Generated by Retro Vibecoder UPG",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "Counter: $counter",
                style = MaterialTheme.typography.titleLarge,
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(onClick = { counter++ }) {
                Text("Increment")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    ${cleanName}Theme {
        HomeScreen()
    }
}
`;

    // 12. strings.xml
    files['app/src/main/res/values/strings.xml'] = `<resources>
    <string name="app_name">${projectName}</string>
</resources>
`;

    // 13. themes.xml
    files['app/src/main/res/values/themes.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.${cleanName}" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
`;

    // 14. Unit test
    files[`app/src/test/kotlin/${pkgPath}/ExampleUnitTest.kt`] = `package ${pkg}

import org.junit.Assert.assertEquals
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }
}
`;

    // 15. .gitignore
    files['.gitignore'] = `# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar

# Android Studio
*.iml
.idea/
local.properties
*.jks
*.keystore

# Build outputs
*.apk
*.aab
*.ap_
*.dex

# Kotlin
*.class

# OS
.DS_Store
Thumbs.db

# Environment
.env
`;

    // 16. Makefile
    files['Makefile'] = `GRADLE := ./gradlew

.PHONY: build run test clean lint

build:
\t$(GRADLE) assembleDebug

run:
\t$(GRADLE) installDebug

test:
\t$(GRADLE) test

clean:
\t$(GRADLE) clean

lint:
\t$(GRADLE) lint
`;
  },
};
