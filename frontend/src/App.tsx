import { useState, useEffect } from 'react';
import WeeklyScheduler from './components/WeeklyScheduler';
import AuthModal from './components/AuthModal';
import type { IAvailabilitySlot } from './components/WeeklyScheduler';
import GroupManager from './components/GroupManager';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [availability, setAvailability] = useState<IAvailabilitySlot[]>([]);
  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('07:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`, // Envía el token JWT desde el estado
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem('token');
            setToken(null);
          }
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
          if (data.availability) setAvailability(data.availability);
          if (data.sleepStart) setSleepStart(data.sleepStart);
          if (data.sleepEnd) setSleepEnd(data.sleepEnd);
        }
      } catch (error) {
        console.error('Error al cargar disponibilidad:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);


  // 2. Guardar disponibilidad pasando el TOKEN
  const handleSaveToBackend = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Header JWT
        },
        body: JSON.stringify({
          sleepStart,
          sleepEnd,
          weeklyAvailability: availability,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }

      alert('¡Disponibilidad guardada con éxito en la base de datos! 🚀');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Ocurrió un error al intentar guardar en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAvailability([]);
  };

  // Si no hay token, bloqueamos la app mostrando el Modal de Login
  if (!token) {
    return <AuthModal onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  const handleSchedulerChange = (
    newAvail: IAvailabilitySlot[],
    newSleepStart: string,
    newSleepEnd: string
  ) => {
    setAvailability(newAvail);
    setSleepStart(newSleepStart);
    setSleepEnd(newSleepEnd);
  };

  const getDayName = (dayIdx: number) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayIdx] || '';
  };

  // 1. Loader mientras se consulta al backend
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Cargando disponibilidad desde el servidor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">

        <div className="flex justify-between items-center py-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white">Meeting Manager</h1>
            <p className="text-slate-400 text-sm">Panel de Disponibilidad</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-red-400 text-xs font-semibold rounded-xl transition"
          >
            Cerrar Sesión 🚪
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center md:text-left py-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">
            ✨ Interfaz de Programador
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white m-0">
            Meeting Manager
          </h1>
          <p className="text-slate-400 mt-2 text-base md:text-lg max-w-2xl">
            Prueba interactiva del programador de disponibilidad semanal con detección de ventana de sueño y diseño responsivo móvil-first.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Main Scheduler grid */}
          <div className="lg:col-span-2 space-y-6">
            <WeeklyScheduler
              initialAvailability={availability}
              initialSleepStart={sleepStart}
              initialSleepEnd={sleepEnd}
              onChange={handleSchedulerChange}
            />
          </div>

          {/* Sidebar Info/Preview */}
          <div className="space-y-6">

            <GroupManager />

            {/* Preferences Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                ⚙️ Resumen de Preferencias
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventana de Sueño</span>
                  <span className="text-sm font-mono text-indigo-400 font-bold bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/20">
                    {sleepStart} a {sleepEnd}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Bloques Guardados ({availability.length})
                  </span>

                  {availability.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-2">
                      No has seleccionado disponibilidad. Estás marcado como ocupado toda la semana.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-thin">
                      {availability.map((slot, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 font-mono text-slate-300"
                        >
                          <span className="font-semibold text-slate-400">{getDayName(slot.day)}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                            {slot.start} - {slot.end}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Botón de Guardar en la Base de Datos */}
                <button
                  type="button"
                  onClick={handleSaveToBackend}
                  disabled={isSaving}
                  className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg shadow-violet-950/50 transition-all cursor-pointer flex justify-center items-center gap-2 border border-violet-500/30"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>💾 Guardar Disponibilidad</span>
                  )}
                </button>
              </div>
            </div>

            {/* JSON Output debug tool */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white m-0 flex items-center gap-2">
                  💻 Estructura JSON (BD ready)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Este payload representa la estructura de datos exacta que se envía y guarda en el servidor.
              </p>
              <pre className="text-[11px] font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800 text-emerald-400 overflow-x-auto max-h-64 scrollbar-thin">
                {JSON.stringify({
                  sleepStart,
                  sleepEnd,
                  weeklyAvailability: availability
                }, null, 2)}
              </pre>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default App;