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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`w-full max-w-md mx-auto bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700/50">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="font-bold text-lg">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700/50">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, index) => <div key={`pad-${index}`} className="w-full pt-[100%] relative" />)}
        {days.map(day => {
          const dayDate = new Date(year, month, day);
          const dateStr = dayDate.toISOString().split('T')[0];
          const isToday = dayDate.getTime() === today.getTime();
          const colors = markedDateColors[dateStr] || [];

          return (
            <div key={day} className={`w-full pt-[100%] relative rounded-full flex items-center justify-center text-sm ${isToday ? 'bg-violet-600' : ''}`}>
              <span className="absolute inset-0 flex items-center justify-center">{day}</span>
              {colors.length > 0 && (
                <div className="absolute bottom-1.5 flex gap-1">
                  {colors.map((color, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full`} style={{ backgroundColor: color }}></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
