"use client";

import React, { useState } from "react";

const tradeData = [
  {
    openDate: "02/25/2025",
    symbol: "FX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$142,186.77",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/24/2025",
    symbol: "FX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$56,232.31",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/24/2025",
    symbol: "SFX",
    status: "WIN",
    closeDate: "02/24/2025",
    entryPrice: "$107,562.79",
    exitPrice: "$107,554.21",
    netPnl: "$6.09",
    netRoi: "0.01%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/24/2025",
    symbol: "FLIPX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$77,574.00",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/24/2025",
    symbol: "FX",
    status: "LOGS",
    closeDate: "02/24/2025",
    entryPrice: "$144,781.13",
    exitPrice: "$144,849.12",
    netPnl: "-$0.68",
    netRoi: "-0.05%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/24/2025",
    symbol: "FLIPX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$77,822.00",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/23/2025",
    symbol: "FX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$51,532.82",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/22/2025",
    symbol: "FX",
    status: "OPEN",
    closeDate: "-",
    entryPrice: "-",
    exitPrice: "$49,628.30",
    netPnl: "(open) $0.00",
    netRoi: "-",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/21/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/21/2025",
    entryPrice: "$53,632.61",
    exitPrice: "$51,613.47",
    netPnl: "$91.65",
    netRoi: "3.85%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/20/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/21/2025",
    entryPrice: "$51,711.27",
    exitPrice: "$51,469.16",
    netPnl: "$11.36",
    netRoi: "0.44%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/20/2025",
    symbol: "FLIPX",
    status: "WIN",
    closeDate: "02/21/2025",
    entryPrice: "$78,820.00",
    exitPrice: "$77,220.80",
    netPnl: "$31.74",
    netRoi: "2.05%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/19/2025",
    symbol: "FX",
    status: "LOSS",
    closeDate: "02/19/2025",
    entryPrice: "$150,642.54",
    exitPrice: "$150,825.94",
    netPnl: "-$1.63",
    netRoi: "-0.12%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/18/2025",
    symbol: "FLIPX",
    status: "WIN",
    closeDate: "02/18/2025",
    entryPrice: "$100,065.00",
    exitPrice: "$100,064.00",
    netPnl: "-$90.10",
    netRoi: "-0.00%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/17/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/18/2025",
    entryPrice: "$53,371.89",
    exitPrice: "$52,440.38",
    netPnl: "$545.58",
    netRoi: "1.74%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/17/2025",
    symbol: "FLIPX",
    status: "WIN",
    closeDate: "02/18/2025",
    entryPrice: "$100,068.00",
    exitPrice: "$100,062.00",
    netPnl: "$557.40",
    netRoi: "0.57%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/16/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/18/2025",
    entryPrice: "$54,974.69",
    exitPrice: "$52,441.50",
    netPnl: "$1,121.21",
    netRoi: "4.42%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/16/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/17/2025",
    entryPrice: "$55,424.36",
    exitPrice: "$53,361.87",
    netPnl: "$1,102.66",
    netRoi: "3.88%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/16/2025",
    symbol: "FX",
    status: "WIN",
    closeDate: "02/17/2025",
    entryPrice: "$56,202.82",
    exitPrice: "$53,368.09",
    netPnl: "$1,141.28",
    netRoi: "5.29%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/15/2025",
    symbol: "FLIPX",
    status: "WIN",
    closeDate: "02/20/2025",
    entryPrice: "$78,223.00",
    exitPrice: "$77,188.50",
    netPnl: "$561.21",
    netRoi: "1.35%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/16/2025",
    symbol: "FX",
    status: "LOSS",
    closeDate: "02/15/2025",
    entryPrice: "$99,910.41",
    exitPrice: "$99,898.28",
    netPnl: "-$50.61",
    netRoi: "-0.01%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/15/2025",
    symbol: "FX",
    status: "LOSS",
    closeDate: "02/15/2025",
    entryPrice: "$99,922.51",
    exitPrice: "$99,898.28",
    netPnl: "-$51.37",
    netRoi: "-0.03%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  {
    openDate: "02/16/2025",
    symbol: "FX",
    status: "LOSS",
    closeDate: "02/15/2025",
    entryPrice: "$99,957.90",
    exitPrice: "$99,898.28",
    netPnl: "-$52.38",
    netRoi: "-0.06%",
    zellaInsights: "-",
    zellaScale: "-"
  },
  // ... (agrega más datos hasta completar 50)
];


const TradeTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage, setTradesPerPage] = useState(5);

  // Calcular los trades que se deben mostrar
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = tradeData.slice(indexOfFirstTrade, indexOfLastTrade);

  // Cambiar el número de trades por página
  const handleTradesPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTradesPerPage(Number(event.target.value));
    setCurrentPage(1); // Reiniciar a la primera página
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
      <h2 className="text-lg font-semibold text-gray-800 p-4">Trade History</h2>
      <div className="w-full max-h-[500px] overflow-y-auto">
        {/* Tabla para pantallas grandes */}
        <table className="w-full text-left text-sm hidden sm:table">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold sticky top-0">
            <tr>
              <th className="py-3 px-4">Open Date</th>
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Close Date</th>
              <th className="py-3 px-4">Entry Price</th>
              <th className="py-3 px-4">Exit Price</th>
              <th className="py-3 px-4">Net P&L</th>
              <th className="py-3 px-4">Net ROI</th>
              <th className="py-3 px-4">Zella Insights</th>
              <th className="py-3 px-4">Zella Scale</th>
            </tr>
          </thead>
          <tbody>
            {currentTrades.map((trade, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">{trade.openDate}</td>
                <td className="py-3 px-4 font-medium text-gray-800">{trade.symbol}</td>
                <td className={`py-3 px-4 font-medium ${trade.status === "WIN" ? "text-green-500" : "text-red-500"}`}>
                  {trade.status}
                </td>
                <td className="py-3 px-4 text-gray-700">{trade.closeDate}</td>
                <td className="py-3 px-4 text-gray-700">{trade.entryPrice}</td>
                <td className="py-3 px-4 text-gray-700">{trade.exitPrice}</td>
                <td className={`py-3 px-4 font-bold ${trade.netPnl.includes("+") || trade.netPnl.includes("(open)") ? "text-green-500" : "text-red-500"}`}>
                  {trade.netPnl}
                </td>
                <td className="py-3 px-4 text-gray-700">{trade.netRoi}</td>
                <td className="py-3 px-4 text-gray-700">{trade.zellaInsights}</td>
                <td className="py-3 px-4 text-gray-700">{trade.zellaScale}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Lista para pantallas pequeñas */}
        <div className="sm:hidden">
          {currentTrades.map((trade, index) => (
            <div key={index} className="border-b p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <span className="text-gray-500">Open Date:</span>
                <span className="text-gray-700">{trade.openDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Symbol:</span>
                <span className="text-gray-800 font-medium">{trade.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${trade.status === "WIN" ? "text-green-500" : "text-red-500"}`}>
                  {trade.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Close Date:</span>
                <span className="text-gray-700">{trade.closeDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Entry Price:</span>
                <span className="text-gray-700">{trade.entryPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Exit Price:</span>
                <span className="text-gray-700">{trade.exitPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net P&L:</span>
                <span className={`font-bold ${trade.netPnl.includes("+") || trade.netPnl.includes("(open)") ? "text-green-500" : "text-red-500"}`}>
                  {trade.netPnl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net ROI:</span>
                <span className="text-gray-700">{trade.netRoi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Zella Insights:</span>
                <span className="text-gray-700">{trade.zellaInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Zella Scale:</span>
                <span className="text-gray-700">{trade.zellaScale}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 p-4 text-sm text-gray-600 gap-2">
        <div className="flex items-center space-x-2">
          <span>Trades per page</span>
          <select
            className="border border-gray-300 rounded-md px-2 py-1"
            value={tradesPerPage}
            onChange={handleTradesPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span>
            {indexOfFirstTrade + 1}-{Math.min(indexOfLastTrade, tradeData.length)} of {tradeData.length} trades
          </span>
          <button
            className="px-2 py-1 border border-gray-300 rounded-md"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          <button
            className="px-2 py-1 border border-gray-300 rounded-md"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(tradeData.length / tradesPerPage)))}
            disabled={currentPage === Math.ceil(tradeData.length / tradesPerPage)}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeTable;