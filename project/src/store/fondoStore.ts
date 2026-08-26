import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Estado, Movimiento } from '../types';
import {
  crearCuenta,
  crearEstadoInicial,
  crearId,
  normalizarEstadoImportado,
  obtenerFechaActual,
  recalcularCuenta,
} from '../lib/estado';

const STORAGE_KEY = 'fondoData';
const LEGACY_STORAGE_KEYS = ['controlDineroData'];

export type Resultado = { ok: true } | { ok: false; error: string };

interface FondoState {
  loaded: boolean;
  /** true si no se encontro ningun dato guardado (ni actual ni legacy) al cargar */
  esInstalacionNueva: boolean;
  estado: Estado;

  load: () => Promise<void>;
  agregarCuenta: (nombre: string) => Resultado;
  renombrarCuenta: (nuevoNombre: string) => Resultado;
  cambiarCuenta: (nombre: string) => void;
  guardarSaldoInicial: (monto: number) => Resultado;
  agregarMovimiento: (tipo: 'deposito' | 'retiro', monto: number, motivo: string) => Resultado;
  editarMovimiento: (id: string, tipo: 'deposito' | 'retiro', monto: number, motivo: string) => Resultado;
  eliminarMovimiento: (id: string) => Resultado;
  borrarCuenta: () => Resultado;
  borrarTodo: () => void;
  alternarTema: () => void;
  /** Usado por la pantalla de importar (primera apertura) y por Ajustes > Importar */
  reemplazarEstado: (nuevoEstado: Estado) => void;
}

async function persistir(estado: Estado) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

export const useFondoStore = create<FondoState>((set, get) => ({
  loaded: false,
  esInstalacionNueva: false,
  estado: crearEstadoInicial(),

  load: async () => {
    const guardado = await AsyncStorage.getItem(STORAGE_KEY);

    if (guardado) {
      try {
        const estado = normalizarEstadoImportado(JSON.parse(guardado));
        set({ estado, loaded: true, esInstalacionNueva: false });
        return;
      } catch {
        // Respaldo local corrupto: se trata como instalacion nueva, nunca
        // se sobreescribe el archivo guardado (puede recuperarse a mano).
        set({ loaded: true, esInstalacionNueva: true });
        return;
      }
    }

    for (const claveVieja of LEGACY_STORAGE_KEYS) {
      const respaldoViejo = await AsyncStorage.getItem(claveVieja);
      if (!respaldoViejo) continue;

      try {
        const estado = normalizarEstadoImportado(JSON.parse(respaldoViejo));
        await persistir(estado);
        await AsyncStorage.removeItem(claveVieja);
        set({ estado, loaded: true, esInstalacionNueva: false });
        return;
      } catch {
        await AsyncStorage.removeItem(claveVieja);
      }
    }

    set({ loaded: true, esInstalacionNueva: true });
  },

  reemplazarEstado: nuevoEstado => {
    persistir(nuevoEstado);
    set({ estado: nuevoEstado, esInstalacionNueva: false });
  },

  agregarCuenta: nombre => {
    const limpio = nombre.trim();
    if (!limpio) return { ok: false, error: 'Escribe el nombre de la cuenta' };

    const { estado } = get();
    if (estado.cuentas[limpio]) {
      return { ok: false, error: 'Ya existe una cuenta con ese nombre' };
    }

    const nuevoEstado: Estado = {
      ...estado,
      cuentaActual: limpio,
      cuentas: { ...estado.cuentas, [limpio]: crearCuenta() },
    };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  renombrarCuenta: nuevoNombreRaw => {
    const { estado } = get();
    const anterior = estado.cuentaActual;
    const nombre = nuevoNombreRaw.trim();

    if (!nombre) return { ok: false, error: 'Escribe un nombre válido' };
    if (nombre !== anterior && estado.cuentas[nombre]) {
      return { ok: false, error: 'Ya existe una cuenta con ese nombre' };
    }
    if (nombre === anterior) return { ok: true };

    const cuentas = { ...estado.cuentas };
    cuentas[nombre] = cuentas[anterior];
    delete cuentas[anterior];

    const nuevoEstado: Estado = { ...estado, cuentaActual: nombre, cuentas };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  cambiarCuenta: nombre => {
    const { estado } = get();
    if (!estado.cuentas[nombre]) return;
    const nuevoEstado: Estado = { ...estado, cuentaActual: nombre };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
  },

  guardarSaldoInicial: monto => {
    const { estado } = get();
    const cuenta = estado.cuentas[estado.cuentaActual];

    if (cuenta.saldoInicialGuardado) {
      return { ok: false, error: 'El saldo inicial de esta cuenta ya fue establecido' };
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      return { ok: false, error: 'Ingresa un monto válido' };
    }

    const movimiento: Movimiento = {
      id: crearId(),
      tipo: 'inicial',
      monto,
      motivo: 'Saldo inicial',
      fecha: obtenerFechaActual(),
      timestamp: Date.now(),
    };

    const cuentaActualizada = recalcularCuenta({
      ...cuenta,
      movimientos: [movimiento, ...cuenta.movimientos],
    });

    const nuevoEstado: Estado = {
      ...estado,
      cuentas: { ...estado.cuentas, [estado.cuentaActual]: cuentaActualizada },
    };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  agregarMovimiento: (tipo, monto, motivoRaw) => {
    const { estado } = get();
    const cuenta = estado.cuentas[estado.cuentaActual];
    const motivo = motivoRaw.trim();

    if (!cuenta.saldoInicialGuardado) {
      return { ok: false, error: 'Primero guarda el saldo inicial de esta cuenta' };
    }
    if (!Number.isFinite(monto) || monto <= 0 || !motivo) {
      return { ok: false, error: 'Completa todos los campos correctamente' };
    }
    if (tipo === 'retiro' && cuenta.saldo - monto < 0) {
      return { ok: false, error: 'No tienes suficiente saldo en esta cuenta' };
    }

    const movimiento: Movimiento = {
      id: crearId(),
      tipo,
      monto,
      motivo,
      fecha: obtenerFechaActual(),
      timestamp: Date.now(),
    };

    const cuentaActualizada = recalcularCuenta({
      ...cuenta,
      movimientos: [movimiento, ...cuenta.movimientos],
    });

    const nuevoEstado: Estado = {
      ...estado,
      cuentas: { ...estado.cuentas, [estado.cuentaActual]: cuentaActualizada },
    };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  editarMovimiento: (id, tipo, monto, motivoRaw) => {
    const { estado } = get();
    const cuenta = estado.cuentas[estado.cuentaActual];
    const motivo = motivoRaw.trim();
    const movimiento = cuenta.movimientos.find(m => m.id === id);

    if (!movimiento || movimiento.tipo === 'inicial') {
      return { ok: false, error: 'Movimiento no editable' };
    }
    if (!Number.isFinite(monto) || monto <= 0 || !motivo) {
      return { ok: false, error: 'Completa todos los campos correctamente' };
    }

    const saldoSinEste = cuenta.movimientos.reduce((total, m) => {
      if (m.id === id) return total;
      return m.tipo === 'retiro' ? total - m.monto : total + m.monto;
    }, 0);
    const saldoProyectado = tipo === 'retiro' ? saldoSinEste - monto : saldoSinEste + monto;

    if (saldoProyectado < 0) {
      return { ok: false, error: 'Ese cambio dejaría la cuenta con saldo negativo' };
    }

    const movimientos = cuenta.movimientos.map(m =>
      m.id === id
        ? { ...m, tipo, monto, motivo, editadoEn: obtenerFechaActual() }
        : m,
    );
    const cuentaActualizada = recalcularCuenta({ ...cuenta, movimientos });

    const nuevoEstado: Estado = {
      ...estado,
      cuentas: { ...estado.cuentas, [estado.cuentaActual]: cuentaActualizada },
    };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  eliminarMovimiento: id => {
    const { estado } = get();
    const cuenta = estado.cuentas[estado.cuentaActual];
    const movimiento = cuenta.movimientos.find(m => m.id === id);

    if (!movimiento || movimiento.tipo === 'inicial') {
      return { ok: false, error: 'Movimiento no se puede eliminar' };
    }

    const saldoSinEste = cuenta.movimientos.reduce((total, m) => {
      if (m.id === id) return total;
      return m.tipo === 'retiro' ? total - m.monto : total + m.monto;
    }, 0);

    if (saldoSinEste < 0) {
      return { ok: false, error: 'No se puede eliminar porque la cuenta quedaría en negativo' };
    }

    const cuentaActualizada = recalcularCuenta({
      ...cuenta,
      movimientos: cuenta.movimientos.filter(m => m.id !== id),
    });

    const nuevoEstado: Estado = {
      ...estado,
      cuentas: { ...estado.cuentas, [estado.cuentaActual]: cuentaActualizada },
    };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  borrarCuenta: () => {
    const { estado } = get();
    const nombres = Object.keys(estado.cuentas);
    if (nombres.length === 1) {
      return { ok: false, error: 'Debe quedar al menos una cuenta' };
    }

    const cuentas = { ...estado.cuentas };
    delete cuentas[estado.cuentaActual];
    const cuentaActual = Object.keys(cuentas)[0];

    const nuevoEstado: Estado = { ...estado, cuentaActual, cuentas };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
    return { ok: true };
  },

  borrarTodo: () => {
    const nuevoEstado = crearEstadoInicial();
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
  },

  alternarTema: () => {
    const { estado } = get();
    const theme = estado.settings.theme === 'dark' ? 'light' : 'dark';
    const nuevoEstado: Estado = { ...estado, settings: { theme } };
    persistir(nuevoEstado);
    set({ estado: nuevoEstado });
  },
}));
