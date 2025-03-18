'use client';
import SecondSidebar from '@/components/SecondSidebar';
import ActionButton from "@/components/ActionButton";  
import Calendar from "@/components/Calendar";


const JournalPage = () => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* SecondSidebar - Versión desktop */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 z-10">
        <SecondSidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1">
        <main className="flex-1 p-4 md:p-8">
          {/* Header responsivo mejorado */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-3">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 leading-tight">
              Daily Journal
            </h1>
            <div className="flex gap-2 w-full md:w-auto">
              <ActionButton 
                className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md hover:bg-blue-700 
                          text-sm md:text-base transition-colors w-full md:w-auto"
              >
                Start my day
              </ActionButton>
              <ActionButton 
                className="border border-gray-300 text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-md 
                          hover:bg-gray-50 text-sm md:text-base transition-colors w-full md:w-auto"
              >
                Add Note
              </ActionButton>
            </div>
          </div>

          {/* Contenedor principal ajustado */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Sección izquierda con mejoras de espaciado */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-4 md:p-6">
              {/* Encabezado de fecha mejorado */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                  Mon, Feb 24, 2025
                </h2>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <span className="text-sm md:text-base text-gray-600 whitespace-nowrap">
                    Net P&L -$0.68
                  </span>
                  <button className="text-xs md:text-sm text-blue-600 hover:underline whitespace-nowrap">
                    View Note
                  </button>
                </div>
              </div>

              {/* Sección de métricas optimizada */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Gráfico de progresión mejorado */}
                <div className="w-full md:w-24 flex flex-row md:flex-col justify-between md:items-end 
                              pr-0 md:pr-3 border-b md:border-r border-gray-200 pb-2 md:pb-0 gap-x-2">
                  {['$0.00', '-$0.20', '-$0.40', '-$0.60', '-$0.80'].map((value, index) => (
                    <div key={index} className="text-xs text-gray-500 py-[1px] md:py-[2px]">
                      {value}
                    </div>
                  ))}
                </div>

                {/* Grid de métricas optimizado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 flex-1">
                  {[
                    ['Total Trades', '2'],
                    ['Win Rate', '0%'],
                    ['Losers', '1'],
                    ['Winners', '1'],
                    ['Gross P&L', '-$0.68'],
                    ['Commissions', '$0.00'],
                    ['Volume', '0.03'],
                    ['Profit Factor', '0.00']
                  ].map(([title, value], index) => (
                    <div 
                      key={index}
                      className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-xs md:text-sm text-gray-500 mb-1 truncate">
                        {title}
                      </div>
                      <div className={`text-base md:text-lg font-semibold truncate ${
                        title === 'Gross P&L' ? 'text-red-600' : 'text-gray-800'
                      }`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla optimizada para móviles */}
              <div className="border rounded-lg overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Open Time', 'Ticker', 'Side', 'Instrument', 'Net P&L', 'Net ROI', 
                        'Realized R-Multiple', 'Playbook', 'Tags'].map((header, index) => (
                        <th 
                          key={index}
                          className="text-left text-xs md:text-sm font-medium text-gray-500 px-3 md:px-4 py-2"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['12:14:40', 'FX', 'SHORT', 'FX', '-$0.68', '(0.05%)', '-', '-', '⬜️'],
                      ['11:58:20', 'FLIPX', 'SHORT', 'FLIPX', '(open) $0.00', '0.00%', '-', '-', '⬜️']
                    ].map((row, rowIndex) => (
                      <tr 
                        key={rowIndex}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className={`px-3 md:px-4 py-2 text-xs md:text-sm ${
                              cellIndex === 4 && rowIndex === 0 ? 'text-red-600' : 'text-gray-800'
                            } truncate`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            

            {/* Sección de calendario mejorada */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 h-fit sticky top-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">
                February 2025
              </h2>
              <Calendar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JournalPage;