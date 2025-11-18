import ExpoBackgroundServiceModule from './src/ExpoBackgroundServiceModule';

export function startService(): void {
  ExpoBackgroundServiceModule.startService();
}

export function stopService(): void {
  ExpoBackgroundServiceModule.stopService();
}

export {ExpoBackgroundServiceModule};
