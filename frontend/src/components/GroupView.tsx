import { useState } from 'react';
import { calculateGroupOverlap, type IUserSchedule } from '../utils/matchingEngine';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function GroupView() {
    const [groupCode, setGroupCode] = useState('TEST12');
    const [groupData, setGroupData] = useState<{ name: string; members: IUserSchedule[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchGroupData = async () => {
        if (!groupCode) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/groups/${groupCode}`);
            if (!res.ok) throw new Error('Sala no encontrada');

            const data = await res.json();
            setGroupData(data);
        } catch (err: any) {
            setError(err.message || 'Error al buscar la sala');
            setGroupData(null);
        } finally {
            setLoading(false);
        }
    };

    const overlapGrid = groupData ? calculateGroupOverlap(groupData.members) : null;

    return (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 backdrop-blur-md space-y-6">

            {/* Search Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        🤝 Sala de Reunión
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Ingresa el código del grupo para calcular los horarios libres comunes.
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                        placeholder="Ej: TEST12"
                        className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl font-mono uppercase text-white focus:outline-none focus:border-violet-500"
                    />
                    <button
                        onClick={fetchGroupData}
                        disabled={loading}
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all"
                    >
                        {loading ? 'Buscando...' : 'Buscar Sala'}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-950/50 border border-red-500/30 text-red-300 rounded-2xl text-sm">{error}</div>}

            {/* Group Info & Members */}
            {groupData && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <div>
                            <span className="text-xs text-slate-500 font-semibold uppercase">Nombre del Grupo</span>
                            <h3 className="text-lg font-bold text-violet-400">{groupData.name}</h3>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-semibold uppercase">Integrantes ({groupData.members.length})</span>
                            <div className="flex gap-2 mt-1">
                                {groupData.members.map((m, i) => (
                                    <span key={i} className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                                        👤 {m.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Overlap Result Grid */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                            ✨ Coincidencias Disponibles para Reunión
                        </h4>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="w-16 p-2 text-left text-xs font-semibold text-slate-500 uppercase">Hora</th>
                                        {DAYS.map((d) => (
                                            <th key={d} className="p-2 text-center text-xs font-semibold text-slate-300 uppercase">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 24 }).map((_, h) => (
                                        <tr key={h} className="border-t border-slate-800/60">
                                            <td className="p-2 text-xs font-mono text-slate-500">{`${h.toString().padStart(2, '0')}:00`}</td>
                                            {DAYS.map((_, d) => {
                                                const isMatch = overlapGrid ? overlapGrid[d][h] : false;
                                                return (
                                                    <td
                                                        key={d}
                                                        className={`p-1.5 text-center border border-slate-800/40 text-[10px] font-bold ${isMatch
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                            : 'bg-slate-950/30 text-slate-700'
                                                            }`}
                                                    >
                                                        {isMatch ? '🎯 Libre' : ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}