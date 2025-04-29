"use client";

import React from "react";
import { FiDownload } from "react-icons/fi";

export default function TemplatesPlaybook() {
  const playbooks = [
    {
      id: 1,
      title: "Fake & Go",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    },
    {
      id: 2,
      title: "Absorption Reversal",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    },
    {
      id: 3,
      title: "ICT 10:00AM Silver Bullet",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    },
    {
      id: 4,
      title: "ICT Daily POS",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    },
    {
      id: 5,
      title: "Confirmed Reversal Pullback",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    },
    {
      id: 6,
      title: "Supply/Demand + Liquidity",
      trades: 0,
      totalNetPL: "$0.00",
      winRate: "0.00%",
      missedTrades: 0,
      expectancy: "$0.00",
      sharedBy: "TradeZella Templates"
    }
  ];

  return (
    <div className="bg-[#F8F9FC] rounded-lg overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto m-6 m-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F8F9FC]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Trades
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Total net P&L
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Win rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Missed trades
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Expectancy
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Playbook shared by
              </th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {playbooks.map((playbook) => (
              <tr key={playbook.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {playbook.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.trades}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.totalNetPL}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.winRate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.missedTrades}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.expectancy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {playbook.sharedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-gray-400 hover:text-gray-600">
                    <FiDownload className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pie de tabla */}
      <div className="px-6 py-3 bg-[#F8F9FC] border-t border-gray-200">
  <div className="flex flex-col items-center gap-3">
    {/* Resultado */}
    <div className="text-sm text-gray-500">
      Result: 1 - 6 of 6 playbooks
    </div>

    {/* Paginación */}
    <div className="flex items-center gap-2">
      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
        &lt;
      </button>
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <span className="text-sm text-purple-800 font-medium">1</span>
      </div>
      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
        &gt;
      </button>
    </div>
  </div>
</div>
    </div>
  );
}