interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

export default function MeetingResultsList({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">{meeting.title}</h3>
            <p className="text-sm text-slate-400">
              {meeting.startTime.toLocaleTimeString()} - {meeting.endTime.toLocaleTimeString()}
            </p>
          </div>
          <button className="text-sm text-violet-400 hover:text-violet-300">
            Exportar .ics
          </button>
        </div>
      ))}
    </div>
  );
}
