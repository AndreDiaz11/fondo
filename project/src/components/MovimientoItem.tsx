import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Movimiento } from '../types';
import { obtenerTipoTexto } from '../lib/estado';
import { formatearMonto } from '../lib/formato';
import { useFondoStore } from '../store/fondoStore';
import { Paleta } from '../theme/colors';

interface Props {
  movimiento: Movimiento;
  paleta: Paleta;
  onEditar: (movimiento: Movimiento) => void;
}

export function MovimientoItem({ movimiento, paleta: p, onEditar }: Props) {
  const eliminarMovimiento = useFondoStore(s => s.eliminarMovimiento);
  const signo = movimiento.tipo === 'retiro' ? '-' : '+';
  const color = movimiento.tipo === 'retiro' ? p.retiro : movimiento.tipo === 'inicial' ? p.accent : p.deposito;

  function eliminar() {
    Alert.alert('¿Eliminar este movimiento?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const resultado = eliminarMovimiento(movimiento.id);
          if (!resultado.ok) Alert.alert('No se pudo eliminar', resultado.error);
        },
      },
    ]);
  }

  return (
    <View style={[estilos.item, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
      <View style={estilos.top}>
        <Text style={[estilos.tipo, { color: p.textMuted }]}>{obtenerTipoTexto(movimiento.tipo)}</Text>
        <Text style={[estilos.monto, { color }]}>
          {signo} {formatearMonto(movimiento.monto)}
        </Text>
      </View>
      <Text style={[estilos.motivo, { color: p.text }]}>{movimiento.motivo}</Text>
      <Text style={[estilos.fecha, { color: p.textMuted }]}>{movimiento.fecha}</Text>
      {movimiento.editadoEn ? (
        <Text style={[estilos.fecha, { color: p.textMuted }]}>Editado: {movimiento.editadoEn}</Text>
      ) : null}

      {movimiento.tipo !== 'inicial' && (
        <View style={estilos.acciones}>
          <Pressable onPress={() => onEditar(movimiento)}>
            <Text style={[estilos.accion, { color: p.accent }]}>Editar</Text>
          </Pressable>
          <Pressable onPress={eliminar}>
            <Text style={[estilos.accion, { color: p.peligroText }]}>Eliminar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  item: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipo: { fontSize: 12, textTransform: 'uppercase', fontWeight: '600' },
  monto: { fontSize: 16, fontWeight: '800' },
  motivo: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  fecha: { fontSize: 12, marginTop: 2 },
  acciones: { flexDirection: 'row', gap: 16, marginTop: 8 },
  accion: { fontSize: 13, fontWeight: '700' },
});
