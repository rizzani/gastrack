import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Workaround for EXPO_ROUTER_APP_ROOT: pass app directory explicitly to ExpoRoot.
// See: https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined
function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
