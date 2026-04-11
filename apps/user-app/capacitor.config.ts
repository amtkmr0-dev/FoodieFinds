import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.foodiefinds.userapp',
    appName: 'FoodieFinds User',
    webDir: 'dist/public',
    server: {
        androidScheme: 'https',
        cleartext: true
    },
    android: {
        flavor: 'user',
        buildOptions: {
            keystorePath: 'release.keystore',
            keystorePassword: '',
            keystoreAlias: '',
            keystoreAliasPassword: ''
        }
    },
    plugins: {
        CapacitorHttp: {
            enabled: true
        }
    }
};

export default config;