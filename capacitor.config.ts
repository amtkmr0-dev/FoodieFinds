import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodiefinds.userapp',
  appName: 'FoodieFinds User',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
