
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarProps {
  markedDates?: { date: string; color: string }[];
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ markedDates = [], className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth });

  const markedDateColors: { [key: string]: string[] } = {};
  markedDates.forEach(md => {
    const dateKey = new Date(md.date).toISOString().split('T')[0];
    if (!markedDateColors[dateKey]) {
      markedDateColors[dateKey] = [];
    }
    if (!markedDateColors[dateKey].includes(md.color)) {
        markedDateColors[dateKey].push(md.color);
    }
  });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={`w-full max-w-md mx-auto bg-slate-800/20 p-4 rounded-2xl border border-slate-700/30 backdrop-blur-sm ${className}`}>
      <div className="flex justify-between items-center mb-4 px-1">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h2 className="font-bold text-base tracking-wide">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(day => <div key={day} className="text-xs font-medium text-gray-500">{day}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, index) => <div key={`pad-${index}`} className="w-full pt-[100%] relative" />)}
        {days.map(day => {
          const dayDate = new Date(year, month, day);
          const dateStr = dayDate.toISOString().split('T')[0];
          const isToday = dayDate.getTime() === today.getTime();
          const colors = markedDateColors[dateStr] || [];

          return (
            <div key={day} className="relative w-full pt-[100%] group">
                <div className={`absolute inset-1 rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm transition-all duration-200
                    ${isToday ? 'bg-white text-black font-bold shadow-lg' : 'text-gray-300 hover:bg-white/5'}
                    ${colors.length > 0 && !isToday ? 'bg-white/5' : ''}
                `}>
                  <span>{day}</span>
                  {colors.length > 0 && (
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {colors.map((color, i) => (
                        <div key={i} className={`h-1 w-1 rounded-full shadow-sm`} style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
