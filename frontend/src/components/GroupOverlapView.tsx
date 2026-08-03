//  Muestra los miembros de la sala con un badge/avatar.
// Calcula e imprime la lista de horarios comunes.
// Muestra un indicador del porcentaje de coincidencia.

import { findGroupOverlaps, getDayName } from '../utils/schedulerUtils';
import type { MemberAvailability } from '../utils/schedulerUtils'; //

interface GroupOverlapViewProps {
    groupName: string;
    groupCode: string;
    members: MemberAvailability[];
    onRefresh?: () => void;
}

export default function GroupOverlapView({ groupName, groupCode, members, onRefresh }: GroupOverlapViewProps) {
    const commonSlots = findGroupOverlaps(members);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Sala Activa</span>
                    <h2 className="text-2xl font-bold text-white">{groupName}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-sm font-bold text-violet-400">
                        {groupCode}
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1"
                        >
                            🔄 Actualizar
                        </button>
                    )}
                </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Miembros en esta sala ({members.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                        <div
                            key={member._id}
                            className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-xs"
                        >
                            <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-[10px] uppercase">
                                {member.username ? member.username[0] : 'U'}
                            </div>
                            <span className="text-slate-200 font-medium">{member.username || member.email}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlaps Result */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        🎯 Coincidencias de Horario ({commonSlots.length})
                    </h3>
                    {members.length > 1 && (
                        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            100% Coincidencia
                        </span>
                    )}
                </div>

                {commonSlots.length === 0 ? (
                    <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center space-y-1">
                        <p className="text-sm text-slate-400 font-medium">No se encontraron franjas horarias comunes 😕</p>
                        <p className="text-xs text-slate-500">
                            Prueben ajustando sus horarios individuales o reduciendo la ventana de sueño.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                        {commonSlots.map((slot, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl font-mono text-xs"
                            >
                                <span className="font-semibold text-emerald-300">{getDayName(slot.day)}</span>
                                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                    {slot.start} - {slot.end}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}