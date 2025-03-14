export const inspectHistoryData = (accountData: any) => {
  
  // Verificar estructura de accountData
  const hasHistory = accountData && accountData.history;
  const historyIsArray = hasHistory && Array.isArray(accountData.history);
  const historyLength = historyIsArray ? accountData.history.length : 0;
  
  // Si no hay datos, no seguir
  if (!historyIsArray || historyLength === 0) {
    return null;
  }
  
  // Analizar cada subarray de history
  accountData.history.forEach((subArray: any, index: number) => {
    const isArray = Array.isArray(subArray);
    const length = isArray ? subArray.length : 0;
  });
  
  // Procesar primer subarray (que tiene los trades detallados)
  if (historyLength > 0 && Array.isArray(accountData.history[0])) {
    const trades = accountData.history[0];
    
    // Ver si tienen fechas
    const hasDates = trades.some(t => t.time);
    
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
      
      
      // Generar daily_results manualmente
      const dailyResults: Record<string, { profit: number; trades: number; status: string }>   = {};
      Array.from(uniqueDates).forEach((dateStr: any) => {
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