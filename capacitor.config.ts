import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.areamujer.app',
  appName: 'Área Mujer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
