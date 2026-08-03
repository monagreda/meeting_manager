import mongoose from 'mongoose';

// Interface representing a user's details for scheduling
export interface IParticipant {
  id: string;
  username: string;
  timezone: string;
  sleepStart: string; // "HH:MM"
  sleepEnd: string;   // "HH:MM"
  weeklyAvailability: {
    day: number;      // 0 = Lunes, 6 = Domingo
    start: string;    // "HH:MM"
    end: string;      // "HH:MM"
  }[];
}

// Interface representing a generated meeting slot option
export interface IMeetingOption {
  startTime: string; // ISO Date String
  endTime: string;   // ISO Date String
  startUtcMinute: number;
  endUtcMinute: number;
  score: number;     // Combined convenience score
  minScore: number;  // Minimum convenience score among all participants
  participantDetails: {
    username: string;
    timezone: string;
    localStartTime: string;
    localEndTime: string;
    score: number;
  }[];
}

// Helper to get exact timezone offset in minutes for a specific date
export function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find((p) => p.type === type)!.value;

    const year = parseInt(getPart('year'), 10);
    const month = parseInt(getPart('month'), 10) - 1;
    const day = parseInt(getPart('day'), 10);
    let hour = parseInt(getPart('hour'), 10);
    if (hour === 24) hour = 0; // standard fallback for 24h format quirk
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);

    const localDate = Date.UTC(year, month, day, hour, minute, second);
    const utcDate = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );

    return Math.round((localDate - utcDate) / 60000);
  } catch (error) {
    console.error(`Error calculating timezone offset for ${timezone}:`, error);
    // Return standard UTC offset (0) on failure
    return 0;
  }
}

// Parse "HH:MM" string into minutes of the day (0 to 1439)
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minute of day to "HH:MM" format
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Calculate the Monday 00:00:00 UTC date of the week for a given reference date
export function getStartOfWeekUtc(refDate: Date): Date {
  const date = new Date(refDate);
  const day = date.getUTCDay(); // 0 = Sunday, 1 = Monday...
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0));
}

// Create a boolean array of 10080 elements representing user's availability in UTC minutes
export function getUserUtcAvailability(
  participant: IParticipant,
  refDate: Date
): boolean[] {
  const localAvail = new Array<boolean>(10080).fill(false);

  // 1. Fill weekly availability slots
  for (const slot of participant.weeklyAvailability) {
    const startMin = parseTimeToMinutes(slot.start);
    const endMin = parseTimeToMinutes(slot.end);

    if (endMin < startMin) {
      // Slot spans midnight
      // Part 1: Start to midnight
      for (let m = startMin; m < 1440; m++) {
        localAvail[slot.day * 1440 + m] = true;
      }
      // Part 2: Midnight to End on the next day (wrapped cyclically)
      const nextDay = (slot.day + 1) % 7;
      for (let m = 0; m < endMin; m++) {
        localAvail[nextDay * 1440 + m] = true;
      }
    } else {
      for (let m = startMin; m < endMin; m++) {
        localAvail[slot.day * 1440 + m] = true;
      }
    }
  }

  // 2. Subtract sleep window (force availability = false)
  const sleepStartMin = parseTimeToMinutes(participant.sleepStart);
  const sleepEndMin = parseTimeToMinutes(participant.sleepEnd);

  for (let d = 0; d < 7; d++) {
    if (sleepStartMin > sleepEndMin) {
      // Sleep window spans midnight
      // Part 1: Sleep start to midnight
      for (let m = sleepStartMin; m < 1440; m++) {
        localAvail[d * 1440 + m] = false;
      }
      // Part 2: Midnight to sleep end on next day
      const nextDay = (d + 1) % 7;
      for (let m = 0; m < sleepEndMin; m++) {
        localAvail[nextDay * 1440 + m] = false;
      }
    } else {
      // Sleep window is on the same day
      for (let m = sleepStartMin; m < sleepEndMin; m++) {
        localAvail[d * 1440 + m] = false;
      }
    }
  }

  // 3. Compute timezone offsets for each of the 168 hours of the week
  const startOfWeek = getStartOfWeekUtc(refDate);
  const hourOffsets = new Array<number>(168);

  for (let h = 0; h < 168; h++) {
    const date = new Date(startOfWeek.getTime() + h * 60 * 60 * 1000);
    hourOffsets[h] = getTimezoneOffset(participant.timezone, date);
  }

  // 4. Map local minutes to UTC minutes
  const utcAvail = new Array<boolean>(10080).fill(false);
  for (let m = 0; m < 10080; m++) {
    const h = Math.floor(m / 60);
    const offset = hourOffsets[h];
    // utcMinute = localMinute - offset
    const utcMin = (m - offset + 10080) % 10080;
    if (localAvail[m]) {
      utcAvail[utcMin] = true;
    }
  }

  return utcAvail;
}

// Calculate the convenience score for a specific local hour (0 to 23)
export function getHourConvenienceScore(hour: number): number {
  if (hour >= 9 && hour < 18) {
    return 10; // High convenience (business hours)
  }
  if (hour === 8 || hour === 18 || hour === 19) {
    return 7;  // Medium convenience (fringe hours)
  }
  if (hour === 7 || hour === 20 || hour === 21) {
    return 4;  // Low convenience (early morning / late evening)
  }
  if (hour === 6 || hour === 22) {
    return 1;  // Undesirable but possible (very early / late night)
  }
  return 0;    // Blocked/Avoid (should be covered by sleep window mostly)
}

// Main scheduler engine
export function findMeetingOptions(
  participants: IParticipant[],
  durationMinutes: number,
  refDate: Date = new Date()
): IMeetingOption[] {
  if (participants.length === 0) return [];
  if (durationMinutes < 40 || durationMinutes > 90) {
    throw new Error('Meeting duration must be between 40 and 90 minutes.');
  }

  // 1. Calculate UTC availability for each participant
  const participantAvailabilities = participants.map((p) =>
    getUserUtcAvailability(p, refDate)
  );

  // 2. Intersect availability
  const commonAvailability = new Array<boolean>(10080).fill(true);
  for (let m = 0; m < 10080; m++) {
    for (const avail of participantAvailabilities) {
      if (!avail[m]) {
        commonAvailability[m] = false;
        break;
      }
    }
  }

  // 3. Scan for contiguous free intervals, handling weekly cyclicity
  const freeIntervals: { start: number; length: number }[] = [];

  // Find first false to establish scan boundary and avoid duplicating wrapped blocks
  let startIdx = 0;
  let hasFalse = false;
  for (let m = 0; m < 10080; m++) {
    if (!commonAvailability[m]) {
      startIdx = m;
      hasFalse = true;
      break;
    }
  }

  if (!hasFalse) {
    // Entire week is free for everyone!
    freeIntervals.push({ start: 0, length: 10080 });
  } else {
    let j = 0;
    while (j < 10080) {
      const idx = (startIdx + j) % 10080;
      if (commonAvailability[idx]) {
        let len = 0;
        while (len < 10080 && commonAvailability[(idx + len) % 10080]) {
          len++;
        }
        if (len >= durationMinutes) {
          freeIntervals.push({ start: idx, length: len });
        }
        j += len;
      } else {
        j++;
      }
    }
  }

  // 4. Generate concrete meeting options (stepped by 30 minutes inside free intervals)
  const options: IMeetingOption[] = [];
  const startOfWeek = getStartOfWeekUtc(refDate);

  // Pre-calculate timezone offset arrays to optimize scoring loop
  const participantHourOffsets = participants.map((p) => {
    const offsets = new Array<number>(168);
    for (let h = 0; h < 168; h++) {
      const date = new Date(startOfWeek.getTime() + h * 60 * 60 * 1000);
      offsets[h] = getTimezoneOffset(p.timezone, date);
    }
    return offsets;
  });

  for (const interval of freeIntervals) {
    const maxOffset = interval.length - durationMinutes;
    for (let offset = 0; offset <= maxOffset; offset += 30) {
      const startUtcMin = (interval.start + offset) % 10080;
      const endUtcMin = (startUtcMin + durationMinutes) % 10080;

      // Determine local times and scores for each participant
      const details = participants.map((p, pIdx) => {
        const offsets = participantHourOffsets[pIdx];

        // Convert UTC minutes back to local minutes
        const startHourIdx = Math.floor(startUtcMin / 60);
        const endHourIdx = Math.floor(endUtcMin / 60);

        const startOffset = offsets[startHourIdx];
        const endOffset = offsets[endHourIdx];

        const localStartMin = (startUtcMin + startOffset + 10080) % 10080;
        const localEndMin = (endUtcMin + endOffset + 10080) % 10080;

        const startDay = Math.floor(localStartMin / 1440);
        const startHour = Math.floor((localStartMin % 1440) / 60);
        const startMinPart = localStartMin % 60;

        const endDay = Math.floor(localEndMin / 1440);
        const endHour = Math.floor((localEndMin % 1440) / 60);
        const endMinPart = localEndMin % 60;

        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const localStartStr = `${days[startDay]} ${startHour.toString().padStart(2, '0')}:${startMinPart.toString().padStart(2, '0')}`;
        const localEndStr = `${days[endDay]} ${endHour.toString().padStart(2, '0')}:${endMinPart.toString().padStart(2, '0')}`;

        // Rate the hour convenience
        const score = getHourConvenienceScore(startHour);

        return {
          username: p.username,
          timezone: p.timezone,
          localStartTime: localStartStr,
          localEndTime: localEndStr,
          score,
        };
      });

      // Calculate combined scores
      const scoresList = details.map((d) => d.score);
      const minScore = Math.min(...scoresList);
      const averageScore = scoresList.reduce((a, b) => a + b, 0) / scoresList.length;

      // Final score formula: prioritize minScore, resolve ties with averageScore
      const combinedScore = minScore * 100 + averageScore;

      // Construct concrete timestamps
      const startTimestamp = new Date(startOfWeek.getTime() + (interval.start + offset) * 60 * 1000);
      const endTimestamp = new Date(startTimestamp.getTime() + durationMinutes * 60 * 1000);

      options.push({
        startTime: startTimestamp.toISOString(),
        endTime: endTimestamp.toISOString(),
        startUtcMinute: startUtcMin,
        endUtcMinute: endUtcMin,
        score: parseFloat(combinedScore.toFixed(2)),
        minScore,
        participantDetails: details,
      });
    }
  }

  // 5. Sort options by score descending (convenience first)
  return options.sort((a, b) => b.score - a.score);
}
