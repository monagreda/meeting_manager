import { findMeetingOptions, IParticipant } from './meetingEngine.js';

// Define target week starting on a Monday in July 2026 (summer time)
const testRefDate = new Date('2026-07-27T00:00:00Z'); // Monday

const participants: IParticipant[] = [
  {
    id: 'userA',
    username: 'Usuario A (Madrid)',
    timezone: 'Europe/Madrid', // UTC+2 in July
    sleepStart: '23:00',
    sleepEnd: '07:00',
    weeklyAvailability: [
      { day: 0, start: '09:00', end: '17:00' }, // Lunes
      { day: 1, start: '09:00', end: '17:00' }, // Martes
      { day: 2, start: '09:00', end: '17:00' }, // Miércoles
      { day: 3, start: '09:00', end: '17:00' }, // Jueves
      { day: 4, start: '09:00', end: '17:00' }, // Viernes
    ],
  },
  {
    id: 'userB',
    username: 'Usuario B (Caracas)',
    timezone: 'America/Caracas', // UTC-4 all year
    sleepStart: '22:00',
    sleepEnd: '06:00',
    weeklyAvailability: [
      { day: 0, start: '09:00', end: '17:00' }, // Lunes
      { day: 1, start: '09:00', end: '17:00' }, // Martes
      { day: 2, start: '09:00', end: '17:00' }, // Miércoles
      { day: 3, start: '09:00', end: '17:00' }, // Jueves
      { day: 4, start: '09:00', end: '17:00' }, // Viernes
    ],
  },
];

console.log('=== TESTING MEETING ENGINE ===');
console.log(`Reference Date: ${testRefDate.toISOString()}`);
console.log('Participants:');
participants.forEach((p) => {
  console.log(`- ${p.username}: Timezone ${p.timezone}, Sleep ${p.sleepStart}-${p.sleepEnd}`);
});

try {
  // Test finding 60 minute meeting options
  const duration = 60;
  const options = findMeetingOptions(participants, duration, testRefDate);

  console.log(`\nFound ${options.length} meeting options of ${duration} minutes.`);

  // Print first 5 options
  const topOptions = options.slice(0, 10);
  console.log('\nTop 10 Options (sorted by convenience score):');
  topOptions.forEach((opt, idx) => {
    console.log(`\nOption #${idx + 1}: Score ${opt.score} (Min Score: ${opt.minScore})`);
    console.log(`  UTC Start: ${opt.startTime}`);
    console.log(`  UTC End:   ${opt.endTime}`);
    console.log('  Participant Local Times:');
    opt.participantDetails.forEach((det) => {
      console.log(`    - ${det.username}: ${det.localStartTime} -> ${det.localEndTime} (Convenience: ${det.score})`);
    });
  });

  // Verify that options match expected overlap (Lunes-Viernes 13:00-15:00 UTC)
  console.log('\nVerifying constraints...');
  let allCorrect = true;
  for (const opt of options) {
    const startHourUtc = new Date(opt.startTime).getUTCHours();
    const startDayUtc = new Date(opt.startTime).getUTCDay(); // 0 is Sunday, 1 is Monday...

    // 13:00 to 14:00 UTC or 14:00 to 15:00 UTC are the only 60min blocks in 13:00-15:00 UTC
    if (startHourUtc < 13 || startHourUtc >= 15) {
      console.error(`❌ Found option outside common work hours window (13:00-15:00 UTC): ${opt.startTime}`);
      allCorrect = false;
    }

    // Must be Mon-Fri (1 to 5)
    if (startDayUtc === 0 || startDayUtc === 6) {
      console.error(`❌ Found option on weekend: ${opt.startTime}`);
      allCorrect = false;
    }
  }

  if (allCorrect && options.length > 0) {
    console.log('\n✅ Success! All generated options respect timezone offsets, sleep windows, and work hours!');
  } else if (options.length === 0) {
    console.error('\n❌ Error: No options were generated.');
  }
} catch (error: any) {
  console.error('\n❌ Execution failed:', error.message);
}
