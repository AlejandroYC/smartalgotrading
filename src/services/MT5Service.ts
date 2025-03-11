// Método para conectar cuenta MT5
async connectAccount(accountInfo: MT5AccountInfo): Promise<any> {
  try {
    const response = await fetch(`${this.apiUrl}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountInfo)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error connecting account');
    }

    const data = await response.json();
    
    // Importante: Guardar la respuesta completa en localStorage
    if (data.success && accountInfo.user_id) {
      // Usar el nuevo método para guardar toda la respuesta
      LocalStorageService.saveBackendResponse(accountInfo.user_id, data);
    }

    return data;
  } catch (error) {
    console.error('Error in connectAccount:', error);
    throw error;
  }
} 