/**
 * Utilidades para el procesamiento y visualización de operaciones de trading
 */

/**
 * Convierte un tipo de operación numérico de MT5 a su representación textual
 * @param type Tipo numérico de operación de MT5 o string
 * @returns Representación textual del tipo de operación
 */
export function formatTradeType(type: number | string | undefined): string {
  if (type === undefined || type === null) {
    return 'DESCONOCIDO';
  }

  // Si ya es string y es una de las representaciones conocidas, devolver en mayúsculas
  if (typeof type === 'string') {
    const upperType = type.toUpperCase();
    if (['BUY', 'SELL', 'COMPRA', 'VENTA'].includes(upperType)) {
      return upperType === 'BUY' ? 'VENTA' : upperType === 'SELL' ? 'COMPRA' : upperType;
    }
    // Intenta convertir a número si es posible
    const numType = parseInt(type, 10);
    if (!isNaN(numType)) {
      type = numType;
    } else {
      return upperType; // Devolver el string en mayúsculas si no se puede convertir
    }
  }

  // Manejar tipos numéricos según documentación de MT5
  switch (Number(type)) {
    case 0:
      return 'VENTA';  // BUY -> Invertido
    case 1:
      return 'COMPRA';   // SELL -> Invertido
    case 2:
      return 'VENTA LIMITADA';  // BUY_LIMIT -> Invertido
    case 3:
      return 'COMPRA LIMITADA';   // SELL_LIMIT -> Invertido
    case 4:
      return 'VENTA STOP';      // BUY_STOP -> Invertido
    case 5:
      return 'COMPRA STOP';       // SELL_STOP -> Invertido
    case 6:
      return 'BALANCE';          // BALANCE operation
    case 7:
      return 'CRÉDITO';          // CREDIT operation
    case 8:
      return 'COMISIÓN';         // COMMISSION
    case 9:
      return 'CARGO FINANCIERO'; // FEE
    case 10:
      return 'DIVIDENDO';        // DIVIDEND
    case 11:
      return 'INTERÉS';          // INTEREST
    default:
      return `TIPO ${type}`;     // Tipo desconocido con su valor numérico
  }
}

/**
 * Determina si un tipo de operación es una compra (BUY)
 * @param type Tipo de operación
 * @returns true si es una compra, false en caso contrario
 */
export function isBuyOperation(type: number | string | undefined): boolean {
  if (type === undefined || type === null) {
    return false;
  }

  if (typeof type === 'string') {
    const upperType = type.toUpperCase();
    if (upperType === 'BUY' || upperType === 'COMPRA') {
      return false; // Invertido: BUY/COMPRA ahora es VENTA
    }
    if (upperType === 'SELL' || upperType === 'VENTA') {
      return true; // Invertido: SELL/VENTA ahora es COMPRA
    }
    // Convertir a número si es posible
    const numType = parseInt(type, 10);
    if (!isNaN(numType)) {
      type = numType;
    } else {
      return false;
    }
  }

  // Los tipos 1, 3, 5 son ahora operaciones de compra (invertidos de SELL, SELL_LIMIT, SELL_STOP)
  return [1, 3, 5].includes(Number(type));
}

/**
 * Determina si un tipo de operación es una venta (SELL)
 * @param type Tipo de operación
 * @returns true si es una venta, false en caso contrario
 */
export function isSellOperation(type: number | string | undefined): boolean {
  if (type === undefined || type === null) {
    return false;
  }

  if (typeof type === 'string') {
    const upperType = type.toUpperCase();
    if (upperType === 'SELL' || upperType === 'VENTA') {
      return false; // Invertido: SELL/VENTA ahora es COMPRA
    }
    if (upperType === 'BUY' || upperType === 'COMPRA') {
      return true; // Invertido: BUY/COMPRA ahora es VENTA
    }
    // Convertir a número si es posible
    const numType = parseInt(type, 10);
    if (!isNaN(numType)) {
      type = numType;
    } else {
      return false;
    }
  }

  // Los tipos 0, 2, 4 son ahora operaciones de venta (invertidos de BUY, BUY_LIMIT, BUY_STOP)
  return [0, 2, 4].includes(Number(type));
} 