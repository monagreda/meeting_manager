import { useState, useEffect } from 'react';

const TIMEZONES = [
  'UTC',
  'Europe/Madrid',
  'America/New_York',
  'America/Los_Angeles',
  'America/Caracas',
  'Asia/Tokyo'
];

interface TimezoneSelectorProps {
  onTimezoneChange: (timezone: string) => void;
}

export default function TimezoneSelector({ onTimezoneChange }: TimezoneSelectorProps) {
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    onTimezoneChange(timezone);
  }, [timezone, onTimezoneChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400 font-medium">Zona Horaria:</label>
      <select
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="bg-slate-900 border border-slate-700 text-sm text-white rounded-lg p-2 focus:ring-2 focus:ring-violet-500 outline-none"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>{tz}</option>
        ))}
      </select>
    </div>
  );
}
