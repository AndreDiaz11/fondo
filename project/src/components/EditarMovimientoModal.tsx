import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Movimiento } from '../types';
import { useFondoStore } from '../store/fondoStore';
import { Paleta } from '../theme/colors';

interface Props {
  movimiento: Movimiento | null;
  paleta: Paleta;
  onCerrar: () => void;
}

export function EditarMovimientoModal({ movimiento, paleta: p, onCerrar }: Props) {
  const editarMovimiento = useFondoStore(s => s.editarMovimiento);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (movimiento) {
      setMonto(String(movimiento.monto));
      setMotivo(movimiento.motivo);
    }
  }, [movimiento]);

  if (!movimiento) return null;

  function guardar(tipo: 'deposito' | 'retiro') {
    const resultado = editarMovimiento(movimiento!.id, tipo, Number(monto), motivo);
    if (!resultado.ok) {
      Alert.alert('No se pudo guardar', resultado.error);
      return;
    }
    onCerrar();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.fondo}>
        <View style={[estilos.tarjeta, { backgroundColor: p.card }]}>
          <View style={estilos.header}>
            <Text style={[estilos.titulo, { color: p.text }]}>Editar movimiento</Text>
            <Pressable onPress={onCerrar} hitSlop={12}>
              <Text style={[estilos.cerrar, { color: p.textMuted }]}>×</Text>
            </Pressable>
          </View>

          <Text style={[estilos.label, { color: p.textMuted }]}>Monto</Text>
          <TextInput
            style={[estilos.input, { borderColor: p.cardBorder, color: p.text }]}
            keyboardType="decimal-pad"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={[estilos.label, { color: p.textMuted }]}>Motivo</Text>
          <TextInput
            style={[estilos.input, { borderColor: p.cardBorder, color: p.text }]}
            value={motivo}
            onChangeText={setMotivo}
          />

          <View style={estilos.botones}>
            <Pressable
              style={[estilos.boton, { backgroundColor: p.deposito }]}
              onPress={() => guardar('deposito')}>
              <Text style={estilos.botonTexto}>Guardar depósito</Text>
            </Pressable>
            <Pressable
              style={[estilos.boton, { backgroundColor: p.retiro }]}
              onPress={() => guardar('retiro')}>
              <Text style={estilos.botonTexto}>Guardar retiro</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  tarjeta: { borderRadius: 16, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: '700' },
  cerrar: { fontSize: 26, lineHeight: 26 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
  botones: { flexDirection: 'row', gap: 10, marginTop: 20 },
  boton: { flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700' },
});
