import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFondoStore } from '../store/fondoStore';
import { elegirYLeerRespaldo } from '../lib/respaldo';
import { crearEstadoInicial } from '../lib/estado';
import { paletaClara as p } from '../theme/colors';

export function ImportarScreen() {
  const reemplazarEstado = useFondoStore(s => s.reemplazarEstado);
  const [cargando, setCargando] = useState(false);

  async function importar() {
    setCargando(true);
    try {
      const previa = await elegirYLeerRespaldo();
      if (!previa) return;

      Alert.alert(
        '¿Importar este respaldo?',
        `${previa.numCuentas} cuenta${previa.numCuentas === 1 ? '' : 's'} · ${previa.numMovimientos} movimiento${previa.numMovimientos === 1 ? '' : 's'}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: () => {
              reemplazarEstado(previa.estado);
              Alert.alert('Listo', 'Tus datos se importaron correctamente');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'No se pudo importar',
        'Revisa que el archivo sea un respaldo válido de Fondo (el que ya generabas con "Exportar JSON" en la versión anterior).',
      );
    } finally {
      setCargando(false);
    }
  }

  function empezarDeCero() {
    Alert.alert('Empezar de cero', '¿Seguro? Esto crea una cuenta nueva vacía, sin importar nada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Empezar de cero', onPress: () => reemplazarEstado(crearEstadoInicial()) },
    ]);
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={['top', 'bottom']}>
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>Bienvenido a la nueva Fondo</Text>
        <Text style={estilos.texto}>
          No encontramos datos guardados en este dispositivo. Si ya usabas Fondo antes, tu saldo e
          historial no se perdieron — solo hay que traerlos.
        </Text>

        <View style={estilos.pasos}>
          <Text style={estilos.paso}>1. Abre tu Fondo anterior</Text>
          <Text style={estilos.paso}>2. Entra a Respaldo → "Exportar JSON"</Text>
          <Text style={estilos.paso}>3. Vuelve aquí y toca "Importar mi respaldo"</Text>
        </View>

        <Pressable style={estilos.botonPrincipal} onPress={importar} disabled={cargando}>
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.botonPrincipalTexto}>Importar mi respaldo</Text>
          )}
        </Pressable>

        <Pressable style={estilos.botonSecundario} onPress={empezarDeCero} disabled={cargando}>
          <Text style={estilos.botonSecundarioTexto}>No tengo respaldo, empezar de cero</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: p.background },
  contenido: { flex: 1, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '800', color: p.text, marginBottom: 12, textAlign: 'center' },
  texto: { fontSize: 15, color: p.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  pasos: { backgroundColor: p.card, borderRadius: 14, padding: 16, marginBottom: 28, gap: 10 },
  paso: { fontSize: 14, color: p.text },
  botonPrincipal: {
    backgroundColor: p.accent,
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  botonPrincipalTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  botonSecundario: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  botonSecundarioTexto: { color: p.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});
