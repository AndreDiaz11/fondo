import RNFS from 'react-native-fs';
import { pick, keepLocalCopy, saveDocuments, types } from '@react-native-documents/picker';
import { Estado, Respaldo } from '../types';
import { normalizarEstadoImportado, obtenerTipoTexto } from './estado';

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Guarda un archivo temporal en cache y abre el dialogo nativo "Guardar
 * como" de Android (Storage Access Framework) para que el usuario elija
 * la carpeta real del celular donde guardarlo (Descargas, etc.) — sin
 * tener que pasar por WhatsApp/Gmail/Drive como intermediario.
 */
async function guardarEnDispositivo(contenido: string, nombre: string, mimeType: string): Promise<void> {
  const rutaTemporal = `${RNFS.CachesDirectoryPath}/${nombre}`;
  await RNFS.writeFile(rutaTemporal, contenido, 'utf8');

  try {
    await saveDocuments({
      sourceUris: [`file://${rutaTemporal}`],
      mimeType,
      fileName: nombre,
    });
  } finally {
    RNFS.unlink(rutaTemporal).catch(() => {});
  }
}

export async function exportarJson(estado: Estado): Promise<void> {
  const respaldo: Respaldo = {
    app: 'Fondo',
    version: 2,
    exportadoEn: new Date().toISOString(),
    datos: estado,
  };
  const contenido = JSON.stringify(respaldo, null, 2);
  const nombre = `fondo-${fechaArchivo()}.json`;

  await guardarEnDispositivo(contenido, nombre, 'application/json');
}

export async function exportarCsv(estado: Estado): Promise<void> {
  const filas: string[][] = [['Cuenta', 'Tipo', 'Monto', 'Motivo', 'Fecha', 'Editado']];

  Object.entries(estado.cuentas).forEach(([nombreCuenta, cuenta]) => {
    cuenta.movimientos.forEach(movimiento => {
      filas.push([
        nombreCuenta,
        obtenerTipoTexto(movimiento.tipo),
        String(movimiento.monto),
        movimiento.motivo,
        movimiento.fecha,
        movimiento.editadoEn || '',
      ]);
    });
  });

  const csv = filas
    .map(fila => fila.map(valor => `"${valor.replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const nombre = `fondo-${fechaArchivo()}.csv`;

  await guardarEnDispositivo('﻿' + csv, nombre, 'text/csv');
}

export interface PreviaImportacion {
  estado: Estado;
  numCuentas: number;
  numMovimientos: number;
}

/**
 * Abre el selector de archivos, lee y valida el respaldo elegido. No toca
 * el estado guardado todavia — eso lo hace el llamador recien despues de
 * que el usuario confirma la previa (numero de cuentas/movimientos).
 */
export async function elegirYLeerRespaldo(): Promise<PreviaImportacion | null> {
  const [archivo] = await pick({
    type: [types.json, types.allFiles],
  });
  if (!archivo) return null;

  const [copia] = await keepLocalCopy({
    files: [{ uri: archivo.uri, fileName: archivo.name ?? 'respaldo.json' }],
    destination: 'cachesDirectory',
  });
  if (copia.status !== 'success') {
    throw new Error('No se pudo leer el archivo elegido');
  }

  const contenido = await RNFS.readFile(copia.localUri, 'utf8');
  const parseado = JSON.parse(contenido);
  const datos = parseado.datos || parseado;
  const estado = normalizarEstadoImportado(datos);

  const numCuentas = Object.keys(estado.cuentas).length;
  const numMovimientos = Object.values(estado.cuentas).reduce(
    (total, cuenta) => total + cuenta.movimientos.length,
    0,
  );

  return { estado, numCuentas, numMovimientos };
}
