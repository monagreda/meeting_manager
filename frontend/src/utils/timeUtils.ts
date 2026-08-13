import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface LocalSlot {
    day: number;   // 0 = Domingo, 1 = Lunes, etc.
    start: string; // "14:00"
    end: string;   // "16:00"
}

interface UtcSlot {
    day: number;
    startMinutes: number; // Minutos transcurridos desde el inicio de la semana en UTC
    endMinutes: number;
}

/**
 * Convierte un slot local (ej: Lunes 14:00 Caracas) a un rango de minutos universales en UTC
 */
export function convertSlotToUTC(slot: LocalSlot, userTimezone: string): UtcSlot {
    // Tomamos una fecha de referencia fija que sepamos qué día de la semana es (ej: Lunes 5 de Enero de 2026)
    // Lunes = 1, Martes = 2, etc.
    const baseDate = dayjs('2026-01-05').add(slot.day - 1, 'day').format('YYYY-MM-DD');

    // Interpretamos la hora local en la zona del usuario
    const startLocal = dayjs.tz(`${baseDate} ${slot.start}`, userTimezone);
    const endLocal = dayjs.tz(`${baseDate} ${slot.end}`, userTimezone);

    // Convertimos a UTC
    const startUtc = startLocal.utc();
    const endUtc = endLocal.utc();

    // Convertimos a un valor absoluto en minutos dentro de la semana para comparar fácil
    const startMinutes = (startUtc.day() * 1440) + (startUtc.hour() * 60) + startUtc.minute();
    const endMinutes = (endUtc.day() * 1440) + (endUtc.hour() * 60) + endUtc.minute();

    return {
        day: startUtc.day(),
        startMinutes,
        endMinutes
    };
}