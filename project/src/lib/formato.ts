const moneda = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

export function formatearMonto(valor: number): string {
  return moneda.format(valor);
}
