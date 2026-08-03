export interface MemberAvailability {
    _id: string;
    username: string;
    email: string;
    availability: Array<{ day: number; start: string; end: string }>;
}

export interface OverlapSlot {
    day: number;
    start: string;
    end: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Encuentra las franjas horarias comunes donde TODOS los miembros están disponibles
 */
export function findGroupOverlaps(members: MemberAvailability[]): OverlapSlot[] {
    if (!members || members.length === 0) return [];

    // Si solo hay 1 miembro, su disponibilidad es la coincidencia
    if (members.length === 1) {
        return members[0].availability || [];
    }

    // 1. Obtener los bloques del primer miembro como base
    let commonSlots = [...(members[0].availability || [])];

    // 2. Filtrar intersecando progresivamente con los demás miembros
    for (let i = 1; i < members.length; i++) {
        const currentMemberSlots = members[i].availability || [];

        commonSlots = commonSlots.filter(slotA =>
            currentMemberSlots.some(
                slotB => slotA.day === slotB.day && slotA.start === slotB.start && slotA.end === slotB.end
            )
        );
    }

    return commonSlots;
}

export function getDayName(dayIdx: number): string {
    return DAYS[dayIdx] || '';
}