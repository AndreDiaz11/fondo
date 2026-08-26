import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useFondoStore } from '../store/fondoStore';
import { Movimiento } from '../types';
import { formatearMonto } from '../lib/formato';
import { obtenerPaleta } from '../theme/colors';
import { exportarCsv, exportarJson, elegirYLeerRespaldo } from '../lib/respaldo';
import { MovimientoItem } from '../components/MovimientoItem';
import { EditarMovimientoModal } from '../components/EditarMovimientoModal';
import { HistorialCompletoModal } from '../components/HistorialCompletoModal';

const HISTORIAL_RESUMEN_LIMITE = 3;

export function PrincipalScreen() {
  const estado = useFondoStore(s => s.estado);
  const agregarCuenta = useFondoStore(s => s.agregarCuenta);
  const renombrarCuenta = useFondoStore(s => s.renombrarCuenta);
  const cambiarCuenta = useFondoStore(s => s.cambiarCuenta);
  const guardarSaldoInicial = useFondoStore(s => s.guardarSaldoInicial);
  const agregarMovimiento = useFondoStore(s => s.agregarMovimiento);
  const borrarCuenta = useFondoStore(s => s.borrarCuenta);
  const borrarTodo = useFondoStore(s => s.borrarTodo);
  const alternarTema = useFondoStore(s => s.alternarTema);
  const reemplazarEstado = useFondoStore(s => s.reemplazarEstado);

  const p = obtenerPaleta(estado.settings.theme);
  const cuenta = estado.cuentas[estado.cuentaActual];

  const [nuevaCuentaTexto, setNuevaCuentaTexto] = useState('');
  const [saldoInicialTexto, setSaldoInicialTexto] = useState('');
  const [montoTexto, setMontoTexto] = useState('');
  const [motivoTexto, setMotivoTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'deposito' | 'retiro' | 'inicial'>('todos');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [editando, setEditando] = useState<Movimiento | null>(null);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [renombrando, setRenombrando] = useState(false);
  const [renombrarTexto, setRenombrarTexto] = useState('');

  const nombresCuentas = Object.keys(estado.cuentas);
  const total = nombresCuentas.reduce((suma, n) => suma + estado.cuentas[n].saldo, 0);

  const movimientosFiltrados = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();
    return cuenta.movimientos.filter(m => {
      const coincideTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      const coincideTexto = !texto || m.motivo.toLowerCase().includes(texto);
      return coincideTipo && coincideTexto;
    });
  }, [cuenta.movimientos, filtroTipo, filtroTexto]);

  const mesActual = new Date().toISOString().slice(0, 7);
  const movimientosMes = cuenta.movimientos.filter(
    m => new Date(m.timestamp).toISOString().slice(0, 7) === mesActual,
  );
  const ingresosMes = movimientosMes
    .filter(m => m.tipo === 'deposito')
    .reduce((t, m) => t + m.monto, 0);
  const gastosMes = movimientosMes
    .filter(m => m.tipo === 'retiro')
    .reduce((t, m) => t + m.monto, 0);

  function manejarAgregarCuenta() {
    const r = agregarCuenta(nuevaCuentaTexto);
    if (!r.ok) return Alert.alert('No se pudo agregar', r.error);
    setNuevaCuentaTexto('');
  }

  function abrirRenombrar() {
    setRenombrarTexto(estado.cuentaActual);
    setRenombrando(true);
  }

  function confirmarRenombrar() {
    const r = renombrarCuenta(renombrarTexto);
    if (!r.ok) return Alert.alert('No se pudo renombrar', r.error);
    setRenombrando(false);
  }

  function manejarGuardarSaldoInicial() {
    const r = guardarSaldoInicial(Number(saldoInicialTexto));
    if (!r.ok) return Alert.alert('No se pudo guardar', r.error);
    setSaldoInicialTexto('');
  }

  function manejarMovimiento(tipo: 'deposito' | 'retiro') {
    const r = agregarMovimiento(tipo, Number(montoTexto), motivoTexto);
    if (!r.ok) return Alert.alert('No se pudo guardar', r.error);
    setMontoTexto('');
    setMotivoTexto('');
  }

  function manejarBorrarCuenta() {
    Alert.alert('¿Borrar la cuenta actual?', estado.cuentaActual, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          const r = borrarCuenta();
          if (!r.ok) Alert.alert('No se pudo borrar', r.error);
        },
      },
    ]);
  }

  function manejarBorrarTodo() {
    Alert.alert(
      '¿Seguro que quieres borrar todas las cuentas?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: borrarTodo },
      ],
    );
  }

  async function manejarImportar() {
    try {
      const previa = await elegirYLeerRespaldo();
      if (!previa) return;
      Alert.alert(
        '¿Importar este respaldo?',
        `${previa.numCuentas} cuenta${previa.numCuentas === 1 ? '' : 's'} · ${previa.numMovimientos} movimiento${previa.numMovimientos === 1 ? '' : 's'}\n\nReemplazará los datos actuales de este dispositivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: () => {
              reemplazarEstado(previa.estado);
              Alert.alert('Listo', 'Datos importados correctamente');
            },
          },
        ],
      );
    } catch {
      Alert.alert('No se pudo importar', 'Revisa que el archivo sea un respaldo válido de Fondo.');
    }
  }

  return (
    <SafeAreaView style={[estilos.contenedor, { backgroundColor: p.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.header}>
          <View>
            <Text style={[estilos.etiqueta, { color: p.textMuted }]}>Finanzas personales</Text>
            <Text style={[estilos.h1, { color: p.text }]}>Fondo</Text>
          </View>
          <View style={estilos.headerDerecha}>
            <Pressable onPress={alternarTema} hitSlop={10}>
              <Text style={[estilos.iconoTema, { color: p.text }]}>◐</Text>
            </Pressable>
            <Text style={[estilos.totalLabel, { color: p.textMuted }]}>Total</Text>
            <Text style={[estilos.totalValor, { color: p.text }]}>{formatearMonto(total)}</Text>
          </View>
        </View>

        <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
          <Text style={[estilos.label, { color: p.textMuted }]}>Cuenta activa</Text>
          <View style={[estilos.pickerBorde, { borderColor: p.cardBorder }]}>
            <Picker
              selectedValue={estado.cuentaActual}
              onValueChange={cambiarCuenta}
              dropdownIconColor={p.text}
              style={{ color: p.text }}>
              {nombresCuentas.map(nombre => (
                <Picker.Item key={nombre} label={nombre} value={nombre} />
              ))}
            </Picker>
          </View>
          <Pressable style={[estilos.botonSecundario, { backgroundColor: p.secundarioBg }]} onPress={abrirRenombrar}>
            <Text style={[estilos.botonSecundarioTexto, { color: p.secundarioText }]}>Renombrar cuenta</Text>
          </Pressable>

          <View style={estilos.fila}>
            <TextInput
              style={[estilos.input, estilos.inputFlex, { borderColor: p.cardBorder, color: p.text }]}
              placeholder="Nueva cuenta: efectivo, banco, viaje..."
              placeholderTextColor={p.textMuted}
              value={nuevaCuentaTexto}
              onChangeText={setNuevaCuentaTexto}
            />
            <Pressable style={[estilos.boton, { backgroundColor: p.accent }]} onPress={manejarAgregarCuenta}>
              <Text style={estilos.botonTexto}>Agregar</Text>
            </Pressable>
          </View>
        </View>

        <View style={estilos.saldoSeccion}>
          <Text style={[estilos.etiqueta, { color: p.textMuted }]}>{estado.cuentaActual}</Text>
          <Text style={[estilos.saldo, { color: p.text }]}>{formatearMonto(cuenta.saldo)}</Text>
          <Text style={[estilos.estadoCuenta, { color: p.textMuted }]}>
            {cuenta.saldoInicialGuardado ? 'Saldo inicial guardado' : 'Falta guardar saldo inicial'}
          </Text>
        </View>

        <View style={estilos.resumen}>
          <View style={[estilos.resumenItem, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
            <Text style={[estilos.resumenLabel, { color: p.textMuted }]}>Ingresos del mes</Text>
            <Text style={[estilos.resumenValor, { color: p.deposito }]}>{formatearMonto(ingresosMes)}</Text>
          </View>
          <View style={[estilos.resumenItem, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
            <Text style={[estilos.resumenLabel, { color: p.textMuted }]}>Gastos del mes</Text>
            <Text style={[estilos.resumenValor, { color: p.retiro }]}>{formatearMonto(gastosMes)}</Text>
          </View>
          <View style={[estilos.resumenItem, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
            <Text style={[estilos.resumenLabel, { color: p.textMuted }]}>Balance del mes</Text>
            <Text style={[estilos.resumenValor, { color: p.text }]}>{formatearMonto(ingresosMes - gastosMes)}</Text>
          </View>
        </View>

        {!cuenta.saldoInicialGuardado && (
          <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
            <Text style={[estilos.label, { color: p.textMuted }]}>Saldo inicial</Text>
            <View style={estilos.fila}>
              <TextInput
                style={[estilos.input, estilos.inputFlex, { borderColor: p.cardBorder, color: p.text }]}
                placeholder="Monto inicial"
                placeholderTextColor={p.textMuted}
                keyboardType="decimal-pad"
                value={saldoInicialTexto}
                onChangeText={setSaldoInicialTexto}
              />
              <Pressable style={[estilos.boton, { backgroundColor: p.accent }]} onPress={manejarGuardarSaldoInicial}>
                <Text style={estilos.botonTexto}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
          <Text style={[estilos.label, { color: p.textMuted }]}>Movimiento</Text>
          <TextInput
            style={[estilos.input, { borderColor: p.cardBorder, color: p.text, marginBottom: 8 }]}
            placeholder="Monto"
            placeholderTextColor={p.textMuted}
            keyboardType="decimal-pad"
            value={montoTexto}
            onChangeText={setMontoTexto}
          />
          <TextInput
            style={[estilos.input, { borderColor: p.cardBorder, color: p.text, marginBottom: 8 }]}
            placeholder="Motivo"
            placeholderTextColor={p.textMuted}
            value={motivoTexto}
            onChangeText={setMotivoTexto}
          />
          <View style={estilos.fila}>
            <Pressable
              style={[estilos.boton, estilos.botonFlex, { backgroundColor: p.deposito }]}
              onPress={() => manejarMovimiento('deposito')}>
              <Text style={estilos.botonTexto}>Depósito</Text>
            </Pressable>
            <Pressable
              style={[estilos.boton, estilos.botonFlex, { backgroundColor: p.retiro }]}
              onPress={() => manejarMovimiento('retiro')}>
              <Text style={estilos.botonTexto}>Retiro</Text>
            </Pressable>
          </View>
        </View>

        <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
          <Text style={[estilos.label, { color: p.textMuted }]}>Filtros</Text>
          <View style={[estilos.pickerBorde, { borderColor: p.cardBorder }]}>
            <Picker selectedValue={filtroTipo} onValueChange={setFiltroTipo} style={{ color: p.text }}>
              <Picker.Item label="Todos" value="todos" />
              <Picker.Item label="Depósitos" value="deposito" />
              <Picker.Item label="Retiros" value="retiro" />
              <Picker.Item label="Saldo inicial" value="inicial" />
            </Picker>
          </View>
          <TextInput
            style={[estilos.input, { borderColor: p.cardBorder, color: p.text, marginTop: 8 }]}
            placeholder="Buscar por motivo..."
            placeholderTextColor={p.textMuted}
            value={filtroTexto}
            onChangeText={setFiltroTexto}
          />
        </View>

        <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder }]}>
          <Text style={[estilos.label, { color: p.textMuted }]}>Respaldo</Text>
          <Text style={[estilos.textoChico, { color: p.textMuted, marginBottom: 10 }]}>
            Pasa tus cuentas entre celular y PC con JSON o revisa movimientos en CSV.
          </Text>
          <View style={estilos.fila}>
            <Pressable
              style={[estilos.botonSecundario, estilos.botonFlex, { backgroundColor: p.secundarioBg }]}
              onPress={() => exportarJson(estado)}>
              <Text style={[estilos.botonSecundarioTexto, { color: p.secundarioText }]}>Exportar JSON</Text>
            </Pressable>
            <Pressable
              style={[estilos.botonSecundario, estilos.botonFlex, { backgroundColor: p.secundarioBg }]}
              onPress={() => exportarCsv(estado)}>
              <Text style={[estilos.botonSecundarioTexto, { color: p.secundarioText }]}>Exportar CSV</Text>
            </Pressable>
          </View>
          <Pressable
            style={[estilos.botonSecundario, { backgroundColor: p.secundarioBg, marginTop: 8 }]}
            onPress={manejarImportar}>
            <Text style={[estilos.botonSecundarioTexto, { color: p.secundarioText }]}>Importar</Text>
          </Pressable>
        </View>

        <View style={estilos.historialTitulo}>
          <View>
            <Text style={[estilos.h2, { color: p.text }]}>Historial</Text>
            <Text style={[estilos.textoChico, { color: p.textMuted }]}>
              {movimientosFiltrados.length} movimiento{movimientosFiltrados.length === 1 ? '' : 's'}
            </Text>
          </View>
          {movimientosFiltrados.length > HISTORIAL_RESUMEN_LIMITE && (
            <Pressable onPress={() => setHistorialVisible(true)}>
              <Text style={[estilos.verTodo, { color: p.accent }]}>Ver todo</Text>
            </Pressable>
          )}
        </View>

        {movimientosFiltrados.length === 0 ? (
          <Text style={[estilos.vacio, { color: p.textMuted }]}>No hay movimientos para mostrar.</Text>
        ) : (
          movimientosFiltrados
            .slice(0, HISTORIAL_RESUMEN_LIMITE)
            .map(m => <MovimientoItem key={m.id} movimiento={m} paleta={p} onEditar={setEditando} />)
        )}

        <View style={[estilos.panel, { backgroundColor: p.card, borderColor: p.cardBorder, marginTop: 24 }]}>
          <Text style={[estilos.label, { color: p.textMuted }]}>Configuración</Text>
          <Pressable style={[estilos.botonPeligro, { backgroundColor: p.secundarioBg }]} onPress={manejarBorrarCuenta}>
            <Text style={[estilos.botonPeligroTexto, { color: p.peligroText }]}>Borrar cuenta actual</Text>
          </Pressable>
          <Pressable
            style={[estilos.botonPeligro, { backgroundColor: p.secundarioBg, marginTop: 8 }]}
            onPress={manejarBorrarTodo}>
            <Text style={[estilos.botonPeligroTexto, { color: p.peligroText }]}>Borrar todo</Text>
          </Pressable>
        </View>
      </ScrollView>

      <EditarMovimientoModal movimiento={editando} paleta={p} onCerrar={() => setEditando(null)} />
      <HistorialCompletoModal
        visible={historialVisible}
        movimientos={movimientosFiltrados}
        paleta={p}
        onCerrar={() => setHistorialVisible(false)}
        onEditar={m => {
          setHistorialVisible(false);
          setEditando(m);
        }}
      />

      {renombrando && (
        <View style={estilos.renombrarFondo}>
          <View style={[estilos.renombrarTarjeta, { backgroundColor: p.card }]}>
            <Text style={[estilos.label, { color: p.textMuted }]}>Nuevo nombre de la cuenta</Text>
            <TextInput
              style={[estilos.input, { borderColor: p.cardBorder, color: p.text, marginTop: 8 }]}
              value={renombrarTexto}
              onChangeText={setRenombrarTexto}
              autoFocus
            />
            <View style={[estilos.fila, { marginTop: 14 }]}>
              <Pressable
                style={[estilos.botonSecundario, estilos.botonFlex, { backgroundColor: p.secundarioBg }]}
                onPress={() => setRenombrando(false)}>
                <Text style={[estilos.botonSecundarioTexto, { color: p.secundarioText }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[estilos.boton, estilos.botonFlex, { backgroundColor: p.accent }]}
                onPress={confirmarRenombrar}>
                <Text style={estilos.botonTexto}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { padding: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerDerecha: { alignItems: 'flex-end' },
  etiqueta: { fontSize: 12, textTransform: 'uppercase', fontWeight: '600' },
  h1: { fontSize: 26, fontWeight: '800' },
  h2: { fontSize: 18, fontWeight: '800' },
  iconoTema: { fontSize: 22, marginBottom: 6 },
  totalLabel: { fontSize: 11 },
  totalValor: { fontSize: 16, fontWeight: '700' },
  panel: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  textoChico: { fontSize: 13 },
  fila: { flexDirection: 'row', gap: 10 },
  inputFlex: { flex: 1 },
  botonFlex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 15 },
  pickerBorde: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  boton: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  botonTexto: { color: '#fff', fontWeight: '700' },
  botonSecundario: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  botonSecundarioTexto: { fontWeight: '700' },
  botonPeligro: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  botonPeligroTexto: { fontWeight: '700' },
  saldoSeccion: { alignItems: 'center', marginVertical: 16 },
  saldo: { fontSize: 36, fontWeight: '900', marginTop: 4 },
  estadoCuenta: { fontSize: 13, marginTop: 4 },
  resumen: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  resumenItem: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  resumenLabel: { fontSize: 11, textAlign: 'center' },
  resumenValor: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  historialTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  verTodo: { fontWeight: '700' },
  vacio: { textAlign: 'center', marginVertical: 20, fontSize: 14 },
  renombrarFondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  renombrarTarjeta: { borderRadius: 16, padding: 20 },
});
