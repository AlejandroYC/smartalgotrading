export const inspectHistoryData = (accountData: any) => {
  console.log("INSPECCIÓN DE DATOS:");
  
  // Verificar estructura de accountData
  const hasHistory = accountData && accountData.history;
  const historyIsArray = hasHistory && Array.isArray(accountData.history);
  const historyLength = historyIsArray ? accountData.history.length : 0;
  
  console.log("Estructura básica:", {
    hasAccountData: !!accountData,
    hasHistory,
    historyIsArray,
    historyLength
  });
  
  // Si no hay datos, no seguir
  if (!historyIsArray || historyLength === 0) {
    console.log("No hay datos de history para procesar");
    return null;
  }
  
  // Analizar cada subarray de history
  accountData.history.forEach((subArray, index) => {
    const isArray = Array.isArray(subArray);
    const length = isArray ? subArray.length : 0;
    
    console.log(`Subarray ${index}:`, {
      isArray,
      length,
      sample: isArray && length > 0 ? subArray[0] : null
    });
  });
  
  // Procesar primer subarray (que tiene los trades detallados)
  if (historyLength > 0 && Array.isArray(accountData.history[0])) {
    const trades = accountData.history[0];
    
    // Ver si tienen fechas
    const hasDates = trades.some(t => t.time);
    console.log("Los trades tienen fechas:", hasDates);
    
    if (hasDates) {
      // Extraer fechas únicas
      const uniqueDates = new Set();
      trades.forEach(trade => {
        if (trade.time) {
          try {
            const date = new Date(trade.time);
            const dateStr = date.toISOString().split('T')[0]; // yyyy-MM-dd
            uniqueDates.add(dateStr);
          } catch (e) {}
        }
      });
      
      console.log("Fechas únicas encontradas:", Array.from(uniqueDates));
      
      // Generar daily_results manualmente
      const dailyResults = {};
      Array.from(uniqueDates).forEach(dateStr => {
        // Por defecto marcar todos como ganadores para debugging
        dailyResults[dateStr] = {
          profit: 100, // Valor arbitrario
          trades: 1,
          status: 'win'
        };
      });
      
      return dailyResults;
    }
  }
  
  return null;
}; 