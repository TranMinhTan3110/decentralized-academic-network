// ==============================================================================
// TAXONOMY SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls for Universities, Faculties, and Courses
// ==============================================================================

import { apiClient } from './apiClient';
import type { UniversityDto, FacultyDto, CourseDto, CourseDetailDto } from '../types';

class TaxonomyService {
  /**
   * Lấy danh sách tất cả các trường đại học
   */
  async getUniversities(): Promise<UniversityDto[]> {
    return apiClient.get<UniversityDto[]>('/api/v1/universities');
  }

  /**
   * Lấy thông tin chi tiết một trường đại học
   */
  async getUniversityById(id: string): Promise<UniversityDto> {
    return apiClient.get<UniversityDto>(`/api/v1/universities/${id}`);
  }

  /**
   * Lấy danh sách khoa theo trường đại học
   */
  async getFacultiesByUniversity(universityId: string): Promise<FacultyDto[]> {
    return apiClient.get<FacultyDto[]>(`/api/v1/universities/${universityId}/faculties`);
  }

  /**
   * Lấy danh sách các môn học (có thể lọc theo lĩnh vực hoặc khoa)
   */
  async getCourses(area?: string, facultyId?: string): Promise<CourseDto[]> {
    const params = new URLSearchParams();
    if (area) params.set('area', area);
    if (facultyId) params.set('facultyId', facultyId);

    const qs = params.toString();
    const endpoint = qs ? `/api/v1/courses?${qs}` : '/api/v1/courses';
    return apiClient.get<CourseDto[]>(endpoint);
  }

  /**
   * Lấy chi tiết môn học kèm thống kê
   */
  async getCourseDetail(id: string): Promise<CourseDetailDto> {
    return apiClient.get<CourseDetailDto>(`/api/v1/courses/${id}`);
  }

  /**
   * Lấy danh sách các lĩnh vực học thuật (Areas)
   */
  async getAreas(): Promise<string[]> {
    return apiClient.get<string[]>('/api/v1/taxonomy/areas');
  }
}

export const taxonomyService = new TaxonomyService();
