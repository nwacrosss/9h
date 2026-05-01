import { useState, useEffect, useRef } from 'react';
import type { EnrollmentData, ChangeRecord } from '../types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api/service/vneduApi/getReportTHPT?nam_hoc=2026';
const POLLING_INTERVAL = 5000;
const LOGS_STORAGE_KEY = 'vnedu_tracker_logs';

export function useEnrollmentData() {
  const [data, setData] = useState<EnrollmentData[]>([]);
  const [logs, setLogs] = useState<ChangeRecord[]>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure dates are parsed back to Date objects
        return parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      } catch (e) {
        console.error('Failed to parse logs from local storage', e);
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const previousDataRef = useRef<EnrollmentData[]>([]);

  // Sync logs to local storage
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    let timeoutId: number;

    const fetchData = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonResponse = await response.json();
        const htmlText = jsonResponse.html || '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Extract rows from the table with class tbl-hk
        const rows = doc.querySelectorAll('table.tbl-hk tr');
        const newData: EnrollmentData[] = [];

        // Start from index 1 to skip the header row
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length >= 6) {
            const getInt = (str: string | null) => {
               const val = parseInt(str?.replace(/[^0-9]/g, '') || '0', 10);
               return isNaN(val) ? 0 : val;
            };

            const item: EnrollmentData = {
              id: cells[0].textContent?.trim() || '',
              schoolName: cells[1].textContent?.trim() || '',
              preferences: cells[2].textContent?.trim() || '',
              quota: getInt(cells[3].textContent),
              totalRegistered: getInt(cells[4].textContent),
              transferredFromSpecialized: getInt(cells[5].textContent),
            };
            
            // Skip empty rows or totals if necessary based on id
            if (item.id && item.schoolName) {
              // Ignore the total row at the very end
              if (item.id.toLowerCase() !== 'tổng cộng') {
                newData.push(item);
              }
            }
          }
        }

        setData(newData);
        setLastUpdated(new Date());
        setError(null);

        // Diffing logic
        if (previousDataRef.current.length > 0) {
          const newLogs: ChangeRecord[] = [];
          
          newData.forEach(newItem => {
            const oldItem = previousDataRef.current.find(o => o.id === newItem.id && o.schoolName === newItem.schoolName);
            if (oldItem && oldItem.totalRegistered !== newItem.totalRegistered) {
              const changeLog = {
                timestamp: new Date(),
                schoolName: newItem.schoolName,
                previousValue: oldItem.totalRegistered,
                newValue: newItem.totalRegistered,
              };
              newLogs.push(changeLog);
              
              // Show toast notification
              const diff = newItem.totalRegistered - oldItem.totalRegistered;
              const sign = diff > 0 ? '+' : '';
              toast.info(`${newItem.schoolName}: ${sign}${diff} hồ sơ mới`, {
                 description: `Từ ${oldItem.totalRegistered} lên ${newItem.totalRegistered} (${newItem.preferences})`,
              });
            }
          });

          if (newLogs.length > 0) {
            setLogs(prev => [...newLogs, ...prev]); // Prepend newest logs
          }
        }

        previousDataRef.current = newData;
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }

      timeoutId = window.setTimeout(fetchData, POLLING_INTERVAL);
    };

    fetchData();

    return () => clearTimeout(timeoutId);
  }, []);

  return { data, logs, loading, error, lastUpdated };
}
