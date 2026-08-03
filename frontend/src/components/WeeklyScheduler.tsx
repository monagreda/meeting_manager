import { useState, useEffect, useRef } from 'react';

export interface IAvailabilitySlot {
  day: number; // 0 = Lunes, 6 = Domingo
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

interface WeeklySchedulerProps {
  initialAvailability?: IAvailabilitySlot[];
  initialSleepStart?: string;
  initialSleepEnd?: string;
  onChange?: (availability: IAvailabilitySlot[], sleepStart: string, sleepEnd: string) => void;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function WeeklyScheduler({
  initialAvailability = [],
  initialSleepStart = '23:00',
  initialSleepEnd = '07:00',
  onChange,
}: WeeklySchedulerProps) {
  // Sleep window state
  const [sleepStart, setSleepStart] = useState(initialSleepStart);
  const [sleepEnd, setSleepEnd] = useState(initialSleepEnd);

  // Active day for mobile view (0 = Lunes, 6 = Domingo)
  const [activeDayMobile, setActiveDayMobile] = useState(0);

  // Grid state: 7 days x 24 hours (true = free, false = busy/sleep)
  const [grid, setGrid] = useState<boolean[][]>(() => {
    const initialGrid = Array.from({ length: 7 }, () => Array(24).fill(false));
    
    // Populate grid from initialAvailability
    initialAvailability.forEach((slot) => {
      const startH = parseInt(slot.start.split(':')[0], 10);
      const endH = parseInt(slot.end.split(':')[0], 10);
      const d = slot.day;

      if (endH < startH) {
        // Spans midnight
        for (let h = startH; h < 24; h++) {
          initialGrid[d][h] = true;
        }
        const nextDay = (d + 1) % 7;
        for (let h = 0; h < endH; h++) {
          initialGrid[nextDay][h] = true;
        }
      } else {
        for (let h = startH; h < endH; h++) {
          if (h >= 0 && h < 24 && d >= 0 && d < 7) {
            initialGrid[d][h] = true;
          }
        }
      }
    });

    return initialGrid;
  });

  // Dragging states for multi-cell selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(true); // true = painting free, false = painting busy
  const lastTarget = useRef<{ d: number; h: number } | null>(null);

  // Parse sleep bounds
  const sleepStartHour = parseInt(sleepStart.split(':')[0], 10);
  const sleepEndHour = parseInt(sleepEnd.split(':')[0], 10);

  // Helper to check if a specific hour is in the sleep window
  const isSleepTime = (hour: number): boolean => {
    if (sleepStartHour === sleepEndHour) return false;
    if (sleepStartHour > sleepEndHour) {
      // Spans midnight, e.g. 23:00 to 07:00
      return hour >= sleepStartHour || hour < sleepEndHour;
    } else {
      // Same day, e.g. 01:00 to 07:00
      return hour >= sleepStartHour && hour < sleepEndHour;
    }
  };

  // Convert grid back to IAvailabilitySlot[]
  const computeAvailabilitySlots = (currentGrid: boolean[][]): IAvailabilitySlot[] => {
    const slots: IAvailabilitySlot[] = [];

    for (let d = 0; d < 7; d++) {
      let startH: number | null = null;

      for (let h = 0; h < 24; h++) {
        const isFree = currentGrid[d][h] && !isSleepTime(h);

        if (isFree && startH === null) {
          // Start of a new free interval
          startH = h;
        } else if (!isFree && startH !== null) {
          // End of a free interval
          slots.push({
            day: d,
            start: `${startH.toString().padStart(2, '0')}:00`,
            end: `${h.toString().padStart(2, '0')}:00`,
          });
          startH = null;
        }
      }

      // Check if interval extends to midnight
      if (startH !== null) {
        slots.push({
          day: d,
          start: `${startH.toString().padStart(2, '0')}:00`,
          end: '24:00', // Express representation for midnight end
        });
      }
    }

    return slots;
  };

  // Notify parent on change
  useEffect(() => {
    if (onChange) {
      const slots = computeAvailabilitySlots(grid);
      onChange(slots, sleepStart, sleepEnd);
    }
  }, [grid, sleepStart, sleepEnd]);

  // Handle cell click/drag start
  const handleCellMouseDown = (d: number, h: number) => {
    if (isSleepTime(h)) return; // Locked sleep hours
    
    const newValue = !grid[d][h];
    setIsDragging(true);
    setDragValue(newValue);
    lastTarget.current = { d, h };

    const newGrid = grid.map((dayArr, dayIdx) =>
      dayArr.map((val, hourIdx) => (dayIdx === d && hourIdx === h ? newValue : val))
    );
    setGrid(newGrid);
  };

  // Handle drag enter
  const handleCellMouseEnter = (d: number, h: number) => {
    if (!isDragging || isSleepTime(h)) return;
    if (lastTarget.current?.d === d && lastTarget.current?.h === h) return;
    
    lastTarget.current = { d, h };
    const newGrid = grid.map((dayArr, dayIdx) =>
      dayArr.map((val, hourIdx) => (dayIdx === d && hourIdx === h ? dragValue : val))
    );
    setGrid(newGrid);
  };

  // Stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    lastTarget.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Quick actions: clear availability, set full business hours (9-17)
  const clearAll = () => {
    setGrid(Array.from({ length: 7 }, () => Array(24).fill(false)));
  };

  const setBusinessHours = () => {
    const newGrid = Array.from({ length: 7 }, (_, dayIdx) =>
      Array.from({ length: 24 }, (_, hourIdx) => {
        // Set Mon-Fri 9:00 - 17:00 as free, unless it falls inside sleep window
        const isWeekday = dayIdx >= 0 && dayIdx < 5;
        const isWorkHour = hourIdx >= 9 && hourIdx < 17;
        return isWeekday && isWorkHour && !isSleepTime(hourIdx);
      })
    );
    setGrid(newGrid);
  };

  // Helper to format hours display (e.g. 09:00)
  const formatHourLabel = (h: number) => `${h.toString().padStart(2, '0')}:00`;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 backdrop-blur-md">
      {/* Header & Sleep Settings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            📅 Horario y Disponibilidad Semanal
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Haz clic y arrastra para marcar las horas en las que estás libre para reunirte.
          </p>
        </div>

        {/* Sleep Window Selectors */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>🛌 Ventana de Sueño:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Inicio</label>
              <select
                value={sleepStart}
                onChange={(e) => setSleepStart(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-sm text-white rounded-lg p-1.5 focus:ring-2 focus:ring-violet-500 outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const label = `${i.toString().padStart(2, '0')}:00`;
                  return <option key={label} value={label}>{label}</option>;
                })}
              </select>
            </div>
            <span className="text-slate-500 mt-4">a</span>
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Fin</label>
              <select
                value={sleepEnd}
                onChange={(e) => setSleepEnd(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-sm text-white rounded-lg p-1.5 focus:ring-2 focus:ring-violet-500 outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const label = `${i.toString().padStart(2, '0')}:00`;
                  return <option key={label} value={label}>{label}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/50 rounded" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-slate-950/70 border border-slate-800 rounded" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-indigo-950/40 border border-indigo-500/30 rounded flex items-center justify-center">
              <span className="text-[9px]">💤</span>
            </div>
            <span>Sueño (Bloqueado)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={setBusinessHours}
            type="button"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700/50"
          >
            💼 Horas Laborales (Lun-Vie 9-17)
          </button>
          <button
            onClick={clearAll}
            type="button"
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/50 hover:text-red-400 rounded-lg transition-colors border border-slate-700/50"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>

      {/* GRID LAYOUT */}
      
      {/* 1. Desktop View (Grid) */}
      <div className="hidden md:block overflow-x-auto select-none">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 p-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hora</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="p-2 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }).map((_, h) => (
              <tr key={h} className="border-t border-slate-800/60 hover:bg-slate-800/10">
                <td className="p-2 text-xs font-mono text-slate-500">{formatHourLabel(h)}</td>
                {DAYS_OF_WEEK.map((_, d) => {
                  const sleep = isSleepTime(h);
                  const free = grid[d][h] && !sleep;
                  
                  return (
                    <td
                      key={d}
                      onMouseDown={() => handleCellMouseDown(d, h)}
                      onMouseEnter={() => handleCellMouseEnter(d, h)}
                      className={`p-1.5 transition-all duration-150 cursor-pointer text-center relative border border-slate-800/40
                        ${sleep 
                          ? 'bg-indigo-950/20 text-indigo-400/30 cursor-not-allowed border-indigo-950/30' 
                          : free 
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30' 
                            : 'bg-slate-950/50 hover:bg-slate-800/40'
                        }
                      `}
                    >
                      <div className="h-6 rounded-md flex items-center justify-center text-[10px]">
                        {sleep ? '💤' : free ? '✓' : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile View (Day Tabs + Vertical Timeline) */}
      <div className="block md:hidden select-none">
        {/* Day Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-none snap-x">
          {DAYS_OF_WEEK.map((day, d) => (
            <button
              key={day}
              onClick={() => setActiveDayMobile(d)}
              type="button"
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors snap-start
                ${activeDayMobile === d 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }
              `}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Selected Day Timeline */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {Array.from({ length: 24 }).map((_, h) => {
            const sleep = isSleepTime(h);
            const free = grid[activeDayMobile][h] && !sleep;
            
            return (
              <div
                key={h}
                onMouseDown={() => handleCellMouseDown(activeDayMobile, h)}
                onTouchStart={() => handleCellMouseDown(activeDayMobile, h)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer
                  ${sleep 
                    ? 'bg-indigo-950/20 border-indigo-950/30 text-indigo-400/50 cursor-not-allowed' 
                    : free 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/20' 
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono tracking-tight font-semibold">
                    {formatHourLabel(h)} - {formatHourLabel((h + 1) % 24)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sleep ? (
                    <span className="text-xs bg-indigo-950 border border-indigo-500/30 text-indigo-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      💤 Sueño
                    </span>
                  ) : free ? (
                    <span className="text-xs bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      ✓ Libre
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-0.5 rounded-full font-semibold">
                      Ocupado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
