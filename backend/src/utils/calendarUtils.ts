import { format } from 'date-fns';

/**
 * Genera un enlace para Google Calendar
 */
export const generateGoogleCalendarLink = (
  title: string,
  start: Date,
  end: Date,
  description: string
): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const fmt = "yyyyMMdd'T'HHmmss'Z'";
  
  const params = new URLSearchParams({
    text: title,
    dates: `${format(start, fmt)}/${format(end, fmt)}`,
    details: description,
  });

  return `${baseUrl}&${params.toString()}`;
};

/**
 * Genera el contenido de un archivo .ics
 */
export const generateICSFileContent = (
  title: string,
  start: Date,
  end: Date,
  description: string
): string => {
  const fmt = "yyyyMMdd'T'HHmmss'Z'";
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antigravity//MeetingManager//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${format(start, fmt)}`,
    `DTEND:${format(end, fmt)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};
