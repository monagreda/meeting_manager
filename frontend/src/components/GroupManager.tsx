import { useState } from 'react';
import GroupOverlapView from './GroupOverlapView';

interface GroupManagerProps {
  onGroupSelected?: (group: any) => void;
}

export default function GroupManager({ onGroupSelected }: GroupManagerProps) {
  const [roomCode, setRoomCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGroup, setActiveGroup] = useState<any>(null);

  // Helper para obtener el token guardado
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Crear Sala
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Por favor ingresa un nombre para la sala');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/groups/create', {
        method: 'POST',
        headers: getAuthHeaders(), // 👈 Usa JWT Header
        body: JSON.stringify({ name: groupName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error al crear la sala');
      }

      setActiveGroup(data); // 👈 Guardamos el grupo activo para mostrar el OverlapView
      if (onGroupSelected) onGroupSelected(data);
      setGroupName('');
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Unirse a Sala
  const handleJoinGroup = async () => {
    if (!roomCode.trim()) {
      setError('Por favor ingresa un código de sala');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/groups/join', {
        method: 'POST',
        headers: getAuthHeaders(), // 👈 Usa JWT Header
        body: JSON.stringify({ code: roomCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'No se pudo unir a la sala');
      }

      setActiveGroup(data); // 👈 Guardamos el grupo activo con sus miembros
      if (onGroupSelected) onGroupSelected(data);
      setRoomCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para traer la versión más reciente de la sala desde la BD
  const refreshGroup = async (code: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setActiveGroup(data); // Actualiza la lista de miembros y sus horarios
      }
    } catch (err) {
      console.error('Error al actualizar sala:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de Controles Crear / Unirse */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white">Gestión de Sala</h2>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Crear Sala */}
        {isCreating ? (
          <div className="space-y-2 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="Nombre de la nueva sala (Ej: Equipo Dev)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-sm outline-none focus:border-violet-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl text-xs font-semibold transition"
              >
                {loading ? 'Creando...' : 'Confirmar y Crear'}
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-xs transition"
          >
            + Crear Nueva Sala
          </button>
        )}

        {/* Unirse a Sala */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            placeholder="Código de la sala (Ej: TEST12)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-sm outline-none focus:border-violet-500 font-mono uppercase"
          />
          <button
            onClick={handleJoinGroup}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold transition text-xs"
          >
            {loading ? '...' : 'Unirse'}
          </button>
        </div>
      </div>

      {/* Renderizado de la Intersección del Grupo (Fuera del Flex) */}
      {activeGroup && (
        <GroupOverlapView
          groupName={activeGroup.name}
          groupCode={activeGroup.code}
          members={activeGroup.members || []}
          onRefresh={() => refreshGroup(activeGroup.code)}
        />
      )}
    </div>
  );
}