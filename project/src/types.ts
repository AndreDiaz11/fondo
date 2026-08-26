export type TipoMovimiento = 'inicial' | 'deposito' | 'retiro';

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  monto: number;
  motivo: string;
  fecha: string;
  timestamp: number;
  editadoEn?: string;
}

export interface Cuenta {
  saldo: number;
  saldoInicialGuardado: boolean;
  movimientos: Movimiento[];
}

export interface Settings {
  theme: 'light' | 'dark';
}

export interface Estado {
  version: number;
  cuentaActual: string;
  settings: Settings;
  cuentas: Record<string, Cuenta>;
}

export interface Respaldo {
  app: string;
  version: number;
  exportadoEn: string;
  datos: Estado;
}
