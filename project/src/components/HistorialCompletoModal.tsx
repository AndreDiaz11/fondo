import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Movimiento } from '../types';
import { MovimientoItem } from './MovimientoItem';
import { Paleta } from '../theme/colors';

interface Props {
  visible: boolean;
  movimientos: Movimiento[];
  paleta: Paleta;
  onCerrar: () => void;
  onEditar: (movimiento: Movimiento) => void;
}

export function HistorialCompletoModal({ visible, movimientos, paleta: p, onCerrar, onEditar }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={[estilos.contenedor, { backgroundColor: p.background }]} edges={['top', 'bottom']}>
        <View style={estilos.header}>
          <View>
            <Text style={[estilos.titulo, { color: p.text }]}>Historial completo</Text>
            <Text style={[estilos.contador, { color: p.textMuted }]}>
              {movimientos.length} movimiento{movimientos.length === 1 ? '' : 's'}
            </Text>
          </View>
          <Pressable onPress={onCerrar} hitSlop={12}>
            <Text style={[estilos.cerrar, { color: p.textMuted }]}>×</Text>
          </Pressable>
        </View>

        <FlatList
          data={movimientos}
          keyExtractor={item => item.id}
          contentContainerStyle={estilos.lista}
          ListEmptyComponent={
            <Text style={[estilos.vacio, { color: p.textMuted }]}>No hay movimientos para mostrar.</Text>
          }
          renderItem={({ item }) => <MovimientoItem movimiento={item} paleta={p} onEditar={onEditar} />}
        />
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  titulo: { fontSize: 20, fontWeight: '800' },
  contador: { fontSize: 13, marginTop: 2 },
  cerrar: { fontSize: 28, lineHeight: 28 },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  vacio: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
