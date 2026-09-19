plugins {
    id("com.android.application")
}

android {
    namespace = "com.betterxcloudplus.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.betterxcloudplus.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 9
        versionName = "0.1.8-beta"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.17.0")
}
