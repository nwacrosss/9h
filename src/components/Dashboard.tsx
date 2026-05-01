import { useState, useMemo, useRef, useEffect } from 'react';
import type { EnrollmentData } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { RefreshCcw, AlertCircle, ArrowUpDown, Search, Filter, ChevronDown, Check, X, MapPin } from 'lucide-react';

interface DashboardProps {
  data: EnrollmentData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

type SortField = keyof EnrollmentData;
type SortOrder = 'asc' | 'desc';

export function Dashboard({ data, loading, error, lastUpdated }: DashboardProps) {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolType, setSchoolType] = useState<'all' | 'chuyen' | 'daitra'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  
  // 9H Mode
  const [is9HMode, setIs9HMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('vnedu_tracker_9h_mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('vnedu_tracker_9h_mode', is9HMode.toString());
  }, [is9HMode]);

  const target9HSchools = [
    'lương văn tụy',
    'lê hồng phong',
    'nguyễn huệ',
    'ngô thì nhậm'
  ];

  const get9HRank = (schoolName: string) => {
    const lowerName = schoolName.toLowerCase();
    for (let i = 0; i < target9HSchools.length; i++) {
      if (lowerName.includes(target9HSchools[i])) return i;
    }
    return 99;
  };

  // Dropdown states & refs
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [isSchoolTypeDropdownOpen, setIsSchoolTypeDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const schoolTypeDropdownRef = useRef<HTMLDivElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
      }
      if (schoolTypeDropdownRef.current && !schoolTypeDropdownRef.current.contains(event.target as Node)) {
        setIsSchoolTypeDropdownOpen(false);
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSchool = (school: string) => {
    setSelectedSchools(prev => 
      prev.includes(school) 
        ? prev.filter(s => s !== school)
        : [...prev, school]
    );
  };

  const clearSchoolFilters = () => setSelectedSchools([]);

  // Compute unique lists for filters
  const uniqueSchools = useMemo(() => {
    const schools = new Set(data.map(d => d.schoolName));
    return Array.from(schools).sort();
  }, [data]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(
      data.map(d => d.preferences).filter(p => p.toLowerCase() !== 'đại trà' && p !== '')
    );
    return Array.from(subjects).sort();
  }, [data]);

  // Apply filters and sort
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (is9HMode) {
      result = result.filter(item => get9HRank(item.schoolName) !== 99);
      return result.sort((a, b) => {
        const rankDiff = get9HRank(a.schoolName) - get9HRank(b.schoolName);
        if (rankDiff !== 0) return rankDiff;
        // Sort by ID naturally within the same school
        return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.schoolName.toLowerCase().includes(q) || 
        item.preferences.toLowerCase().includes(q)
      );
    }

    // Apply School Type
    if (schoolType === 'chuyen') {
      result = result.filter(item => item.preferences.toLowerCase() !== 'đại trà');
    } else if (schoolType === 'daitra') {
      result = result.filter(item => item.preferences.toLowerCase() === 'đại trà');
    }

    // Apply Subject
    if (selectedSubject !== 'all') {
      result = result.filter(item => item.preferences === selectedSubject);
    }

    // Apply Selected Schools
    if (selectedSchools.length > 0) {
      result = result.filter(item => selectedSchools.includes(item.schoolName));
    }

    // Apply Sort
    const sorted = result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        if (sortField === 'id') {
           return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
        }
        return aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      return 0;
    });

    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortField, sortOrder, searchQuery, schoolType, selectedSubject, selectedSchools]);

  const totalQuota = useMemo(() => filteredAndSortedData.reduce((acc, curr) => acc + (curr.quota || 0), 0), [filteredAndSortedData]);
  const totalRegistered = useMemo(() => filteredAndSortedData.reduce((acc, curr) => acc + (curr.totalRegistered || 0), 0), [filteredAndSortedData]);

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-subtext0">
        <RefreshCcw className="h-8 w-8 animate-spin mb-4 text-sapphire" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-flamingo/10 border border-flamingo/20 rounded-2xl p-6 flex items-start gap-4 text-flamingo">
        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg">Lỗi tải dữ liệu</h3>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Số liệu đăng ký dự thi</h1>
          <p className="text-subtext0 mt-2 text-sm flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Kỳ thi tuyển sinh lớp 10 THPT Ninh Bình năm học 2026-2027
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm bg-mantle/80 backdrop-blur-md px-4 py-2 rounded-xl border border-surface0 text-subtext1">
          {loading ? (
             <RefreshCcw className="h-4 w-4 animate-spin text-sapphire" />
          ) : (
             <span className="h-2.5 w-2.5 rounded-full bg-teal" />
          )}
          <span className="font-medium">
            {lastUpdated 
              ? `Cập nhật: ${formatInTimeZone(lastUpdated, 'Asia/Ho_Chi_Minh', 'HH:mm:ss dd/MM/yyyy')}`
              : 'Đang chờ...'}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-mantle/60 rounded-2xl border border-surface0 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 text-subtext1 font-semibold">
            <Filter className="h-4 w-4 text-lavender" />
            <span className="text-sm text-text">Bộ lọc dữ liệu</span>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer group" title="Hiển thị Lương Văn Tụy, Lê Hồng Phong, Nguyễn Huệ, Ngô Thì Nhậm">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={is9HMode}
                onChange={(e) => setIs9HMode(e.target.checked)}
                className="peer sr-only" 
              />
              <div className={`h-5 w-5 rounded border transition-all ${is9HMode ? 'bg-lavender border-lavender' : 'border-surface1 group-hover:border-lavender/50'}`}></div>
              <Check className={`absolute h-3.5 w-3.5 text-base transition-opacity ${is9HMode ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
            </div>
            <span className={`text-sm font-bold transition-colors ${is9HMode ? 'text-lavender' : 'text-subtext1 group-hover:text-text'}`}>
              9H Mode
            </span>
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-subtext0" />
            <input 
              type="text" 
              placeholder="Tìm kiếm trường, môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-base border border-surface0 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder-subtext0 focus:outline-none focus:ring-2 focus:ring-lavender/30 focus:border-lavender transition-all"
            />
          </div>

          {/* School Type */}
          <div className="relative" ref={schoolTypeDropdownRef}>
            <div 
              className="w-full bg-base border border-surface0 rounded-xl px-4 py-2.5 text-sm text-text flex items-center justify-between cursor-pointer hover:border-lavender/50 focus:outline-none focus:ring-2 focus:ring-lavender/30 focus:border-lavender transition-all"
              onClick={() => setIsSchoolTypeDropdownOpen(!isSchoolTypeDropdownOpen)}
            >
              <span className="truncate pr-2">
                {schoolType === 'all' ? 'Tất cả hệ đào tạo' : schoolType === 'chuyen' ? 'Hệ Chuyên' : 'Hệ Đại trà'}
              </span>
              <ChevronDown className={`h-4 w-4 text-subtext0 shrink-0 transition-transform ${isSchoolTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isSchoolTypeDropdownOpen && (
              <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-base border border-surface0 rounded-xl shadow-xl overflow-hidden custom-scrollbar">
                <div className="p-2 space-y-1">
                  {[
                    { value: 'all', label: 'Tất cả hệ đào tạo' },
                    { value: 'chuyen', label: 'Hệ Chuyên' },
                    { value: 'daitra', label: 'Hệ Đại trà' }
                  ].map(option => (
                    <div 
                      key={option.value}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-surface0/50 rounded-lg cursor-pointer text-sm transition-colors group"
                      onClick={() => {
                        setSchoolType(option.value as 'all' | 'chuyen' | 'daitra');
                        setIsSchoolTypeDropdownOpen(false);
                      }}
                    >
                      <span className={`${schoolType === option.value ? 'text-text font-medium' : 'text-subtext1'}`}>
                        {option.label}
                      </span>
                      {schoolType === option.value && <Check className="h-4 w-4 text-lavender" strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="relative" ref={subjectDropdownRef}>
            <div 
              className={`w-full bg-base border border-surface0 rounded-xl px-4 py-2.5 text-sm text-text flex items-center justify-between cursor-pointer hover:border-lavender/50 focus:outline-none focus:ring-2 focus:ring-lavender/30 focus:border-lavender transition-all ${schoolType === 'daitra' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              onClick={() => {
                if (schoolType !== 'daitra') setIsSubjectDropdownOpen(!isSubjectDropdownOpen)
              }}
            >
              <span className="truncate pr-2">
                {selectedSubject === 'all' ? 'Tất cả môn chuyên' : selectedSubject}
              </span>
              <ChevronDown className={`h-4 w-4 text-subtext0 shrink-0 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isSubjectDropdownOpen && schoolType !== 'daitra' && (
              <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-base border border-surface0 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                  <div 
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-surface0/50 rounded-lg cursor-pointer text-sm transition-colors group"
                    onClick={() => {
                      setSelectedSubject('all');
                      setIsSubjectDropdownOpen(false);
                    }}
                  >
                    <span className={`${selectedSubject === 'all' ? 'text-text font-medium' : 'text-subtext1'}`}>
                      Tất cả môn chuyên
                    </span>
                    {selectedSubject === 'all' && <Check className="h-4 w-4 text-lavender" strokeWidth={3} />}
                  </div>
                  {uniqueSubjects.map(sub => (
                    <div 
                      key={sub}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-surface0/50 rounded-lg cursor-pointer text-sm transition-colors group"
                      onClick={() => {
                        setSelectedSubject(sub);
                        setIsSubjectDropdownOpen(false);
                      }}
                    >
                      <span className={`${selectedSubject === sub ? 'text-text font-medium' : 'text-subtext1'}`}>
                        {sub}
                      </span>
                      {selectedSubject === sub && <Check className="h-4 w-4 text-lavender" strokeWidth={3} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multiple Schools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className="w-full bg-base border border-surface0 rounded-xl px-4 py-2.5 text-sm text-text flex items-center justify-between cursor-pointer hover:border-lavender/50 focus:outline-none focus:ring-2 focus:ring-lavender/30 focus:border-lavender transition-all"
              onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
            >
              <span className="truncate pr-2">
                {selectedSchools.length === 0 
                  ? 'Tất cả trường THPT' 
                  : `Đã chọn ${selectedSchools.length} trường`}
              </span>
              <ChevronDown className={`h-4 w-4 text-subtext0 shrink-0 transition-transform ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isSchoolDropdownOpen && (
              <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-base border border-surface0 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-base/95 backdrop-blur-sm border-b border-surface0 p-3 flex justify-between items-center z-20">
                  <span className="text-xs font-semibold text-subtext0 uppercase tracking-wider">Chọn trường</span>
                  {selectedSchools.length > 0 && (
                    <button 
                      onClick={clearSchoolFilters}
                      className="text-xs text-flamingo hover:text-flamingo/80 flex items-center gap-1 font-medium transition-colors"
                    >
                      <X className="h-3 w-3" /> Bỏ chọn
                    </button>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {uniqueSchools.map(school => (
                    <div 
                      key={school}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface0/50 rounded-lg cursor-pointer text-sm transition-colors group"
                      onClick={() => toggleSchool(school)}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedSchools.includes(school) ? 'bg-lavender border-lavender text-base' : 'border-surface1 group-hover:border-lavender/50'}`}>
                        {selectedSchools.includes(school) && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                      <span className={`truncate ${selectedSchools.includes(school) ? 'text-text font-medium' : 'text-subtext1'}`}>
                        {school}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-mantle/60 rounded-2xl border border-surface0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface0/40 text-subtext1 border-b border-surface0 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer hover:text-lavender transition-colors group" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-2">
                    STT <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer hover:text-lavender transition-colors group" onClick={() => handleSort('schoolName')}>
                  <div className="flex items-center gap-2">
                    Trường THPT <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer hover:text-lavender transition-colors group" onClick={() => handleSort('preferences')}>
                  <div className="flex items-center gap-2">
                    Nguyện vọng <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer hover:text-lavender transition-colors text-right group" onClick={() => handleSort('quota')}>
                  <div className="flex items-center justify-end gap-2 text-text">
                    <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" /> 
                    Chỉ tiêu ({totalQuota.toLocaleString()})
                  </div>
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer text-lavender hover:text-lavender/80 transition-colors text-right group" onClick={() => handleSort('totalRegistered')}>
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" /> 
                    Đã ĐKDT ({totalRegistered.toLocaleString()})
                  </div>
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold cursor-pointer hover:text-lavender transition-colors text-right group" onClick={() => handleSort('transferredFromSpecialized')}>
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" /> NV Chuyên về
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface0/30">
              {filteredAndSortedData.map((row, index) => (
                <tr 
                  key={`${row.id}-${row.schoolName}`}
                  className={`hover:bg-surface0/30 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-surface0/10'}`}
                >
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-subtext0">{row.id}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-text">{row.schoolName}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-subtext1">
                    <span className="bg-surface0/80 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface1/30">
                      {row.preferences}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right text-text font-medium">{row.quota}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right font-bold text-lavender text-base">
                    {row.totalRegistered}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right text-subtext0">{row.transferredFromSpecialized}</td>
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-subtext0">
                    <p className="text-base font-medium">Không tìm thấy kết quả phù hợp với bộ lọc</p>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setSchoolType('all');
                        setSelectedSubject('all');
                        setSelectedSchools([]);
                      }}
                      className="mt-4 px-4 py-2 bg-surface0/50 hover:bg-surface0 rounded-xl text-sm text-text font-medium transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
