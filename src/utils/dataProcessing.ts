// Función para procesar transacciones y crear daily_results
export const processTransactionsToDaily = (historyData: any) => {
  // Objeto para almacenar resultados por día
  const dailyResults: {
    [date: string]: {
      profit: number;
      trades: number;
      status: 'win' | 'loss' | 'break_even';
    }
  } = {};

  // CAMBIO CRÍTICO: Verificar estructura de datos y acceder al array correcto
  let tradesToProcess = [];
  
  if (Array.isArray(historyData)) {
    // Si es un array plano de transacciones
    tradesToProcess = historyData;
  } else if (historyData && Array.isArray(historyData[0])) {
    // Si es el formato que mostraste: acceder específicamente al primer array [0-99]
    console.log("Detectado formato de array anidado, usando el primer array");
    tradesToProcess = historyData[0];
  } else if (historyData && historyData.history && Array.isArray(historyData.history[0])) {
    // Si los datos están dentro de una propiedad history
    console.log("Detectado formato con propiedad history, usando el primer array");
    tradesToProcess = historyData.history[0];
  }
  
  console.log(`Procesando ${tradesToProcess.length} transacciones del array correcto`);
  
  // Procesar cada transacción
  let procesadas = 0;
  
  tradesToProcess.forEach((trade, index) => {
    try {
      // Verificar si tiene tiempo
      const tradeTime = trade.time;
      if (!tradeTime) {
        console.warn(`Trade #${index} sin tiempo:`, trade);
        return;
      }
      
      // Intentar parsear la fecha (20XX-XX-XXTXX:XX:XX)
      let dateObj;
      try {
        dateObj = new Date(tradeTime);
        if (isNaN(dateObj.getTime())) {
          throw new Error("Fecha inválida");
        }
      } catch (dateError) {
        console.warn(`Error de formato en fecha '${tradeTime}' para trade #${index}:`, dateError);
        return;
      }
      
      // Formatear como yyyy-MM-dd
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Inicializar el día si no existe
      if (!dailyResults[dateStr]) {
        dailyResults[dateStr] = {
          profit: 0,
          trades: 0,
          status: 'break_even'
        };
      }
      
      // Asegurarse de que profit sea número
      const profit = typeof trade.profit === 'number' 
        ? trade.profit 
        : Number(trade.profit) || 0;
      
      // Actualizar profit y contador de trades
      dailyResults[dateStr].profit += profit;
      dailyResults[dateStr].trades += 1;
      procesadas++;
      
      // Log de depuración para ver qué estamos procesando
      if (index < 5 || index % 20 === 0) {
        console.log(`Trade #${index}: ${dateStr}, profit=${profit}, ticket=${trade.ticket}`);
      }
    } catch (error) {
      console.error(`Error procesando trade #${index}:`, error, trade);
    }
  });
  
  console.log(`Procesamiento completado: ${procesadas} transacciones procesadas`);
  console.log(`Días totales procesados: ${Object.keys(dailyResults).length}`);
  console.log("Días procesados:", Object.keys(dailyResults));
  
  // Determinar el status (win/loss) para cada día
  Object.keys(dailyResults).forEach(date => {
    const dayResult = dailyResults[date];
    if (dayResult.profit > 0) {
      dayResult.status = 'win';
    } else if (dayResult.profit < 0) {
      dayResult.status = 'loss';
    } else {
      dayResult.status = 'break_even';
    }
  });
  
  // Eliminar datos de ejemplo si estamos procesando datos reales
  if (Object.keys(dailyResults).length > 0) {
    // Eliminar ejemplos que podrían estar hardcodeados
    delete dailyResults["2023-12-01"];
    delete dailyResults["2023-12-02"];
    delete dailyResults["2023-12-15"];
  }
  
  return dailyResults;
};

// Función de diagnóstico para revisar todas las transacciones
export const diagnoseDailyResults = (transactions: any[]) => {
  if (!transactions || !Array.isArray(transactions)) {
    console.log("No hay transacciones para diagnosticar");
    return;
  }
  
  console.log(`Diagnóstico de ${transactions.length} transacciones`);
  
  // Verificar fechas
  const fechasUnicas = new Set<string>();
  const fechasInvalidas: any[] = [];
  const fechasFaltantes: any[] = [];
  
  transactions.forEach((trans, index) => {
    if (!trans.time) {
      fechasFaltantes.push({ index, transaction: trans });
      return;
    }
    
    try {
      const date = new Date(trans.time);
      if (isNaN(date.getTime())) {
        fechasInvalidas.push({ index, fecha: trans.time, transaction: trans });
        return;
      }
      
      const dateStr = date.toISOString().split('T')[0];
      fechasUnicas.add(dateStr);
    } catch (e) {
      fechasInvalidas.push({ index, fecha: trans.time, error: e.message, transaction: trans });
    }
  });
  
  console.log("Diagnóstico completado:");
  console.log(`- Fechas únicas: ${fechasUnicas.size}`);
  console.log(`- Transacciones sin fecha: ${fechasFaltantes.length}`);
  console.log(`- Transacciones con fecha inválida: ${fechasInvalidas.length}`);
  
  if (fechasFaltantes.length > 0) {
    console.log("Ejemplo de transacción sin fecha:", fechasFaltantes[0]);
  }
  
  if (fechasInvalidas.length > 0) {
    console.log("Ejemplo de transacción con fecha inválida:", fechasInvalidas[0]);
  }
  
  return {
    fechasUnicas: Array.from(fechasUnicas),
    fechasFaltantes,
    fechasInvalidas
  };
}; 