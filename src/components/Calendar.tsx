import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [locale, setLocale] = useState<string>("en-US");

  // Establecer el locale solo una vez
  useEffect(() => {
    const userLocale = navigator.language || "en-US";
    setLocale(userLocale);
  }, []); // Se ejecuta solo una vez al montar el componente

  // Función para manejar el cambio de mes
  const handlePrevMonth = () => {
    setCurrentMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1));
  };

  // Funciones para obtener los días de la semana y la información de la fecha
  const getDaysOfWeek = () => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getTotalDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  // Variables de cálculo de días
  const firstDay = getFirstDayOfMonth(currentMonth);
  const totalDays = getTotalDaysInMonth(currentMonth);

  // Crear los días vacíos para completar la primera fila del calendario
  const createEmptyDays = (firstDay: number) => {
    const emptyDays: React.ReactNode[] = [];  // Cambié 'let' por 'const'
    for (let i = 0; i < firstDay; i++) {
      emptyDays.push(<div key={`empty-${i}`} className="text-gray-400"></div>);
    }
    return emptyDays;
  };

  // Crear los días del mes
  const createDays = (totalDays: number) => {
    const days: React.ReactNode[] = [];  // Cambié 'let' por 'const'
    for (let day = 1; day <= totalDays; day++) {
      days.push(
        <div
          key={day}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-200 cursor-pointer"
        >
          {day}
        </div>
      );
    }
    return days;
  };

  // Generar los días vacíos y los días del mes
  const emptyDays = createEmptyDays(firstDay);
  const monthDays = createDays(totalDays);

  return (
    <div className=" pd-6 bg-white rounded-md shadow-md ">
      <div className="flex justify-between items-center mb-2">
        <button onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleString(locale, { month: "long" })} {currentMonth.getFullYear()}
        </h3>
        <button onClick={handleNextMonth}>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500">
        {getDaysOfWeek().map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center">
        {emptyDays}
        {monthDays}
      </div>
    </div>
  );
};

export default Calendar;
