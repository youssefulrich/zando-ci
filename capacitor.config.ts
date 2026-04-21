import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ci.zando.app',
  appName: 'Zando CI',
  webDir: 'out',
  server: {
    url: 'https://zando-ci.vercel.app',
    cleartext: true,
  },
}

export default config