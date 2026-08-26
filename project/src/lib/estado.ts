import { Cuenta, Estado, Movimiento, TipoMovimiento } from '../types';

export const CUENTA_PRINCIPAL = 'Principal';

export function crearId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function obtenerFechaActual(): string {
  return new Date().toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function crearCuenta(): Cuenta {
  return {
    saldo: 0,
    saldoInicialGuardado: false,
    movimientos: [],
  };
}

export function crearEstadoInicial(): Estado {
  return {
    version: 2,
    cuentaActual: CUENTA_PRINCIPAL,
    settings: { theme: 'light' },
    cuentas: { [CUENTA_PRINCIPAL]: crearCuenta() },
  };
}

export function recalcularCuenta(cuenta: Cuenta): Cuenta {
  const saldo = cuenta.movimientos.reduce((total, movimiento) => {
    return movimiento.tipo === 'retiro' ? total - movimiento.monto : total + movimiento.monto;
  }, 0);
  const saldoInicialGuardado = cuenta.movimientos.some(m => m.tipo === 'inicial');
  return { ...cuenta, saldo, saldoInicialGuardado };
}

export function obtenerTipoTexto(tipo: TipoMovimiento): string {
  if (tipo === 'deposito') return 'Depósito';
  if (tipo === 'retiro') return 'Retiro';
  return 'Saldo inicial';
}

/**
 * Valida y normaliza un respaldo importado (propio, de una version vieja,
 * o reenviado por WhatsApp/otro medio) al esquema actual. Nunca confía en
 * la forma exacta del JSON recibido.
 */
export function normalizarEstadoImportado(datos: any): Estado {
  if (!datos || !datos.cuentas || Object.keys(datos.cuentas).length === 0) {
    throw new Error('Respaldo sin cuentas');
  }

  const cuentas: Record<string, Cuenta> = {};
  let contador = 0;

  Object.entries(datos.cuentas).forEach(([nombre, cuentaRaw]) => {
    if (!nombre || typeof cuentaRaw !== 'object' || cuentaRaw === null) {
      return;
    }
    const cuenta = cuentaRaw as any;
    const movimientosRaw = Array.isArray(cuenta.movimientos) ? cuenta.movimientos : [];

    const movimientos: Movimiento[] = movimientosRaw
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any) => {
        contador += 1;
        const fechaStr = String(m.fecha || '');
        let timestamp = Number(m.timestamp) || 0;

        if (!timestamp && fechaStr) {
          const parseado = Date.parse(fechaStr);
          timestamp = Number.isFinite(parseado) ? parseado : Date.now() - contador * 1000;
        }
        if (!timestamp) {
          timestamp = Date.now() - contador * 1000;
        }

        const tipo: TipoMovimiento = ['inicial', 'deposito', 'retiro'].includes(m.tipo)
          ? m.tipo
          : 'deposito';

        return {
          id: m.id || crearId(),
          tipo,
          monto: Number(m.monto) || 0,
          motivo: String(m.motivo || 'Sin motivo'),
          fecha: fechaStr,
          timestamp,
          editadoEn: m.editadoEn ? String(m.editadoEn) : '',
        };
      });

    cuentas[nombre] = recalcularCuenta({
      saldo: Number(cuenta.saldo) || 0,
      saldoInicialGuardado: Boolean(cuenta.saldoInicialGuardado),
      movimientos,
    });
  });

  const nombres = Object.keys(cuentas);
  if (nombres.length === 0) {
    throw new Error('Respaldo sin cuentas válidas');
  }

  return {
    version: 2,
    cuentaActual: cuentas[datos.cuentaActual] ? datos.cuentaActual : nombres[0],
    settings: { theme: datos.settings?.theme === 'dark' ? 'dark' : 'light' },
    cuentas,
  };
}
