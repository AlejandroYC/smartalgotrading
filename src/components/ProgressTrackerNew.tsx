'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, addMonths, subMonths, isSameDay, parseISO, startOfMonth, endOfMonth, isEqual } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useTradingData } from '@/contexts/TradingDataContext';
import { Trade } from '@/types/Trade';
import toast from 'react-hot-toast';

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-500 hover:text-gray-700 flex-shrink-0"
    style={{
      display: 'block',
      overflow: 'visible',
      transform: 'scale(1.0)',
      transformOrigin: 'center'
    }}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

interface ProgressTrackerProps {
  onDayClick?: (date: string) => void;
  handleDateRangeChange?: (fromDate: Date, toDate: Date) => void;
}

const ACTIVITY_COLORS = [
  '#FFFFFF', // No trades
  '#F3F4F8', 
  '#E6E9F5', 
  '#D5DCF5', 
  '#A5B4E8', 
  '#7B96E5', 
];

interface CalendarDay {
  date: Date;
  dayOfWeek: number;
  trades: number;
  month: string;
  active: boolean;
  profit: number;
}

const isActiveDay = (dayOfWeek: number): boolean => {
  return dayOfWeek > 0 && dayOfWeek < 6;
};

const getActivityLevel = (trades: number): number => {
  if (trades <= 0) return 0;
  if (trades <= 2) return 1;
  if (trades <= 5) return 2;
  if (trades <= 8) return 3;
  if (trades <= 12) return 4;
  return 5;
};

const ProgressTrackerNew: React.FC<ProgressTrackerProps> = ({ onDayClick, handleDateRangeChange }) => {
  const tradingData = useTradingData();
  const processedData = tradingData.processedData || {};
  const dailyResults = processedData.daily_results || {};
  const lastDataTimestamp = tradingData.lastDataTimestamp || 0;
  const refreshIfStale = tradingData.refreshIfStale;

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tooltipInfo, setTooltipInfo] = useState<{date: Date, info: string} | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[][]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [todayScore, setTodayScore] = useState({
    current: 0,
    total: 5,
    percentage: 0
  });

  // Refs for drag implementation
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });
  const animationId = useRef<number>();

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contentRef.current) return;
    
    isDragging.current = true;
    cancelAnimationFrame(animationId.current!);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x: clientX, y: clientY };
    scrollPos.current = {
      left: contentRef.current.scrollLeft,
      top: contentRef.current.scrollTop
    };

    // Add protection classes
    document.documentElement.classList.add('no-scroll-drag');
    document.body.classList.add('no-scroll-drag');
    if (containerRef.current) {
      containerRef.current.classList.add('dragging-active');
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !contentRef.current) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    
    contentRef.current.scrollLeft = scrollPos.current.left - dx;
    contentRef.current.scrollTop = scrollPos.current.top - dy;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    // Remove protection classes
    document.documentElement.classList.remove('no-scroll-drag');
    document.body.classList.remove('no-scroll-drag');
    if (containerRef.current) {
      containerRef.current.classList.remove('dragging-active');
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationId.current!);
      // Cleanup classes if component unmounts during drag
      document.documentElement.classList.remove('no-scroll-drag');
      document.body.classList.remove('no-scroll-drag');
    };
  }, []);

  useEffect(() => {
    refreshIfStale();
  }, [refreshIfStale]);

  const tradesByDate = useMemo(() => {
    const byDate: Record<string, {trades: number, profit: number}> = {};
    const rawTrades = processedData.rawTrades || [];
    
    if (rawTrades.length > 0) {
      const tradesByDateMap = new Map<string, { trades: number, profit: number }>();
      
      rawTrades.forEach((trade: any) => {
        try {
          let dateStr = trade.dateStr || 
            (typeof trade.time === 'number' 
              ? new Date(trade.time * 1000).toISOString().split('T')[0]
              : new Date(trade.time).toISOString().split('T')[0]);
          
          if (!tradesByDateMap.has(dateStr)) {
            tradesByDateMap.set(dateStr, { trades: 0, profit: 0 });
          }
          
          const dayData = tradesByDateMap.get(dateStr)!;
          dayData.trades += 0.5;
          dayData.profit += trade.profit;
        } catch (err) {
          console.error('Error processing trade:', err);
        }
      });
      
      tradesByDateMap.forEach((value, key) => {
        byDate[key] = {
          trades: Math.ceil(value.trades),
          profit: value.profit
        };
      });
    } else {
      Object.entries(dailyResults).forEach(([dateStr, dayData]) => {
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return;
          
          byDate[dateStr] = {
            trades: (dayData as any)?.trades || 0,
            profit: (dayData as any)?.profit || 0
          };
        } catch (err) {
          console.error('Error processing day:', dateStr, err);
        }
      });
    }
    
    return byDate;
  }, [dailyResults, processedData]);

  const generateCalendarData = useCallback(() => {
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const months = [
      format(subMonths(currentMonth, 1), 'MMM', { locale: es }).toLowerCase(),
      format(currentMonth, 'MMM', { locale: es }).toLowerCase(),
      format(addMonths(currentMonth, 1), 'MMM', { locale: es }).toLowerCase()
    ];
    
    const data: CalendarDay[][] = Array(7).fill(0).map(() => []);
    
    for (let monthIndex = 0; monthIndex < 3; monthIndex++) {
      const firstDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, 1);
      const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex + 1, 0);
      
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, day);
        const dayOfWeek = date.getDay();
        const active = isActiveDay(dayOfWeek);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dailyData = tradesByDate[dateStr] || { trades: 0, profit: 0 };
        
        data[dayOfWeek].push({
          date,
          dayOfWeek,
          trades: dailyData.trades,
          profit: dailyData.profit,
          month: months[monthIndex],
          active
        });
      }
    }
    
    return data;
  }, [currentMonth, tradesByDate]);

  useEffect(() => {
    const data = generateCalendarData();
    setCalendarData(data);
  }, [currentMonth, tradesByDate, processedData, generateCalendarData]);

  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayData = dailyResults[todayStr];
    
    if (todayData && (todayData as any)?.trades > 0) {
      const tradesAdjusted = Math.ceil((todayData as any)?.trades / 2);
      const winningTradesEstimate = (todayData as any)?.profit > 0 ? Math.ceil(tradesAdjusted / 2) : 0;
      
      setTodayScore({
        current: winningTradesEstimate,
        total: 5,
        percentage: Math.min(100, (winningTradesEstimate / 5) * 100)
      });
    } else {
      setTodayScore({
        current: 0,
        total: 5,
        percentage: 0
      });
    }
  }, [dailyResults]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    refreshIfStale();
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    
    if (handleDateRangeChange) {
      const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
      handleDateRangeChange(startOfMonth(newMonth), endOfMonth(newMonth));
    }
  };

  const handleDayClick = (day: CalendarDay) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    const dailyData = tradesByDate[dateStr];
    
    if (dailyData && dailyData.trades > 0) {
      const formattedDate = format(day.date, 'dd/MM/yyyy');
      const profitText = day.profit >= 0 
        ? `+$${day.profit.toFixed(2)}` 
        : `-$${Math.abs(day.profit).toFixed(2)}`;
      
      setTooltipInfo({
        date: day.date,
        info: `${formattedDate} - ${day.trades} operaciones - ${profitText}`
      });
      
      if (onDayClick) onDayClick(dateStr);
    } else {
      setTooltipInfo(null);
      toast('No hay operaciones para este día');
    }
  };

  useEffect(() => {
    const now = Date.now();
    if (now - lastRefreshTime > 30000 || lastDataTimestamp > lastRefreshTime) {
      const data = generateCalendarData();
      setCalendarData(data);
      setLastRefreshTime(now);
    }
  }, [lastDataTimestamp, processedData, dailyResults, tradesByDate, lastRefreshTime, generateCalendarData]);

  if (!dailyResults || Object.keys(dailyResults).length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 w-full min-h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No hay datos de trading disponibles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-[392px] relative isolate prevent-layout-shift">
      <div className="flex justify-between items-center px-[16px] py-[12px] border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[#2D3748] text-[16px] font-semibold">Seguimiento de progreso</h2>
          <InfoIcon />
          <span className="ml-0.5 bg-[#FFD740] text-[#ffffff] text-[10px] px-[10px] py-[5px] rounded-full font-medium">
            BETA
          </span>
        </div>
        <div className="text-white bg-[#6457A6] h-8 px-3 py-1.5 text-sm font-medium rounded hover:bg-[#352E77] transition-colors duration-200">
          Explorar
        </div>
      </div>

      <div className="p-[16px]">
        <div className="flex mb-2">
          <div className="w-[40px]"></div>
          <div className="flex-1 flex">
            <div className="text-[#6366F1] text-sm font-medium w-[120px]">feb</div>
            <div className="text-[#6366F1] text-sm font-medium ml-[120px]">mar</div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative overflow-hidden w-full h-[150px] touch-none select-none drag-container"
          style={{
            willChange: 'transform',
            contain: 'strict',
            transform: 'translateZ(0)'
          }}
        >
          <div
            ref={contentRef}
            className={`h-full w-full overflow-auto ${
              isDragging.current ? 'cursor-grabbing' : 'cursor-grab'
            } touch-pan-y drag-content`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overscrollBehavior: 'contain',
              backfaceVisibility: 'hidden',
              perspective: '1000px'
            }}
            onMouseDown={handleDragStart}
            onMouseLeave={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseMove={handleDragMove}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="min-w-fit">
              {calendarData.map((row, rowIndex) => {
                const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return (
                  <div key={rowIndex} className="flex mb-1">
                    <div className="w-[40px] shrink-0 text-[#4A5568] font-medium text-xs">
                      {dayNames[rowIndex]}
                    </div>
                    <div className="flex gap-[6px] sm:gap-[8px] md:gap-[10px] lg:gap-[12px]">
                      {row.map((day, dayIndex) => {
                        const bgColor = day.active
                          ? day.trades > 0
                            ? ACTIVITY_COLORS[getActivityLevel(day.trades)]
                            : ACTIVITY_COLORS[1]
                          : 'white';
                        const borderClass = !day.active ? 'border border-[#E2E8F0]' : '';

                        return (
                          <div
                            key={`${rowIndex}-${dayIndex}`}
                            className={`w-[24px] h-[24px] ${borderClass} rounded-[2px] cursor-pointer 
                              hover:ring-1 hover:ring-[#6366F1] transition-all relative shrink-0`}
                            style={{ backgroundColor: bgColor }}
                            onClick={() => handleDayClick(day)}
                          >
                            {tooltipInfo && isSameDay(day.date, tooltipInfo.date) && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                                bg-[#1A202C] text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-10">
                                {tooltipInfo.info}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-[4px] gap-1">
          <span className="text-[#4A5568] text-xs">Menos</span>
          {ACTIVITY_COLORS.slice(1).map((color, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[#4A5568] text-xs">Más</span>
        </div>
      </div>

      <div className="border-t border-gray-200 px-[8px] pb-[8px] pt-[8px]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[#2D3748] font-bold uppercase text-xs">PUNTUACIÓN HOY</h3>
            <InfoIcon />
          </div>
          <button className="bg-white border border-gray-300 rounded-md px-[10px] py-[4px] text-[#2D3748] text-[14px] font-semibold hover:bg-gray-100 transition-colors">
            Lista diaria
          </button>
        </div>

        <div className="flex items-center gap-2 mt-[8px]">
          <div className="text-[#2D3748] text-xl font-bold">
            {todayScore.current}/{todayScore.total}
          </div>
          <div className="flex-1 bg-[#EDF2F7] rounded-full h-2">
            <div
              className="bg-[#6366F1] h-full rounded-full transition-all duration-300"
              style={{ width: `${todayScore.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackerNew;