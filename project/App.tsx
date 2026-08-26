import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFondoStore } from './src/store/fondoStore';
import { ImportarScreen } from './src/screens/ImportarScreen';
import { PrincipalScreen } from './src/screens/PrincipalScreen';
import { UpdateDialog } from './src/components/UpdateDialog';
import { checkForUpdate, UpdateInfo } from './src/services/updateChecker';
import { obtenerPaleta } from './src/theme/colors';
import packageJson from './package.json';

export default function App() {
  const loaded = useFondoStore(s => s.loaded);
  const esInstalacionNueva = useFondoStore(s => s.esInstalacionNueva);
  const theme = useFondoStore(s => s.estado.settings.theme);
  const load = useFondoStore(s => s.load);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    load();
    checkForUpdate(packageJson.version).then(setUpdate).catch(() => {});
  }, [load]);

  const p = obtenerPaleta(theme);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {!loaded ? (
        <View style={[estilos.cargando, { backgroundColor: p.background }]}>
          <ActivityIndicator color={p.accent} size="large" />
        </View>
      ) : esInstalacionNueva ? (
        <ImportarScreen />
      ) : (
        <PrincipalScreen />
      )}
      {update && !updateDismissed ? (
        <UpdateDialog update={update} paleta={p} onDismiss={() => setUpdateDismissed(true)} />
      ) : null}
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
