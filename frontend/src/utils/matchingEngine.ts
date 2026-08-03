import type { IAvailabilitySlot } from '../components/WeeklyScheduler';

export interface IUserSchedule {
    name: string;
    availability: IAvailabilitySlot[];
    sleepStart: string;
    sleepEnd: string;
}

// Devuelve una matriz de 7 días x 24 horas con `true` solo donde TODOS están libres
export function calculateGroupOverlap(members: IUserSchedule[]): boolean[][] {
    const overlapGrid = Array.from({ length: 7 }, () => Array(24).fill(true));

    if (!members || members.length === 0) {
        return Array.from({ length: 7 }, () => Array(24).fill(false));
    }

    members.forEach((member) => {
        const memberGrid = Array.from({ length: 7 }, () => Array(24).fill(false));

        // Parse sleep
        const sleepStartH = parseInt(member.sleepStart.split(':')[0], 10);
        const sleepEndH = parseInt(member.sleepEnd.split(':')[0], 10);

        const isSleep = (h: number) => {
            if (sleepStartH === sleepEndH) return false;
            return sleepStartH > sleepEndH
                ? h >= sleepStartH || h < sleepEndH
                : h >= sleepStartH && h < sleepEndH;
        };

        // Fill availability
        member.availability.forEach((slot) => {
            const startH = parseInt(slot.start.split(':')[0], 10);
            const endH = parseInt(slot.end.split(':')[0], 10);
            const d = slot.day;

            for (let h = startH; h < endH; h++) {
                if (!isSleep(h)) {
                    memberGrid[d][h] = true;
                }
            }
        });

        // Intersect with overall grid
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                overlapGrid[d][h] = overlapGrid[d][h] && memberGrid[d][h];
            }
        }
    });

    return overlapGrid;
}
