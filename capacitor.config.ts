import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deoraplaza.app',
  appName: 'Deora Plaza',
  webDir: 'public',
  server: {
    // This points to your live Vercel deployment
    // Ensure this URL is correct and up-to-date!
    url: 'https://deora-plaza-master.vercel.app',
    cleartext: true
  }
};

export default config;
