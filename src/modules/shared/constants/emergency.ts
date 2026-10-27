/**
 * Línea de emergencias que se marca desde la app.
 *
 * `123` es la línea única nacional de Colombia. PENDIENTE: si RespondeYa se
 * pública en otro país este número debe venir de configuración o detectarse,
 * no quedar fijo en el código.
 */
export const EMERGENCY_PHONE = {
  number: '123',
  country: 'Colombia',
  label: 'Línea única de emergencias',
} as const;
