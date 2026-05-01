import type { ChangeRecord } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { History, TrendingUp, TrendingDown, Clock, GitCommit } from 'lucide-react';

interface ChangelogProps {
  logs: ChangeRecord[];
}

export function Changelog({ logs }: ChangelogProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-subtext0 bg-mantle/50 border border-surface0 rounded-2xl">
        <History className="h-12 w-12 mb-4 text-surface1" />
        <h3 className="text-lg font-medium text-text">Chưa có thay đổi nào</h3>
        <p className="mt-2 text-center max-w-md text-sm">
          Hệ thống đang theo dõi. Bất kỳ thay đổi nào về số lượng hồ sơ đăng ký sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  // Group logs by day using UTC+7
  const groupedLogs = logs.reduce((acc, log) => {
    const dateKey = formatInTimeZone(log.timestamp, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, ChangeRecord[]>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-text tracking-tight flex items-center gap-3">
          <GitCommit className="h-8 w-8 text-lavender" /> Timeline Thay Đổi
        </h1>
        <p className="text-subtext0 mt-2 text-sm">Lịch sử biến động hồ sơ được ghi nhận theo thời gian thực</p>
      </div>

      <div className="relative pl-4 sm:pl-6 border-l-2 border-surface0 space-y-10">
        {Object.entries(groupedLogs).map(([dateStr, dayLogs]) => (
          <div key={dateStr} className="relative">
            {/* Date Header */}
            <div className="absolute -left-[29px] sm:-left-[33px] top-1 bg-base p-1">
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-lavender bg-base" />
            </div>
            <h2 className="text-lg font-bold text-text mb-4 ml-4">
              Ngày {formatInTimeZone(new Date(dateStr), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy')}
            </h2>

            <div className="space-y-4 ml-4">
              {dayLogs.map((log, index) => {
                const diff = log.newValue - log.previousValue;
                const isIncrease = diff > 0;

                return (
                  <div 
                    key={`${log.timestamp.getTime()}-${index}`}
                    className="bg-mantle/80 border border-surface0 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface0/30 transition-all shadow-sm shadow-base/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${isIncrease ? 'bg-teal/10 text-teal' : 'bg-flamingo/10 text-flamingo'}`}>
                        {isIncrease ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-text text-base">{log.schoolName}</h3>
                        <p className="text-xs text-subtext0 mt-1 flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatInTimeZone(log.timestamp, 'Asia/Ho_Chi_Minh', 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-base/50 px-4 py-2.5 rounded-xl border border-surface0/50 self-start sm:self-auto">
                      <span className="text-sm font-medium text-subtext1 line-through opacity-70">
                        {log.previousValue}
                      </span>
                      <span className="text-subtext0">→</span>
                      <span className="text-base font-bold text-text">
                        {log.newValue}
                      </span>
                      <span className={`text-sm font-bold ml-2 ${isIncrease ? 'text-teal' : 'text-flamingo'}`}>
                        {isIncrease ? '+' : ''}{diff}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
