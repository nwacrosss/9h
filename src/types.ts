export interface EnrollmentData {
  id: string; // STT
  schoolName: string; // Trường trung học phổ thông
  preferences: string; // Nguyện vọng
  quota: number; // Chỉ tiêu
  totalRegistered: number; // Tổng số hồ sơ đã đkdt
  transferredFromSpecialized: number; // Tổng số hồ sơ có NV từ trường chuyên về
}

export interface ChangeRecord {
  timestamp: Date;
  schoolName: string;
  previousValue: number;
  newValue: number;
}
