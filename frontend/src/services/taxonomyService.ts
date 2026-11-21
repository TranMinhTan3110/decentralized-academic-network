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
   * Thêm trường đại học mới (Admin)
   */
  async createUniversity(payload: {
    code: string;
    name: string;
    city: string;
    description?: string;
  }): Promise<UniversityDto> {
    return apiClient.post<UniversityDto>('/api/v1/admin/taxonomy/universities', payload);
  }

  /**
   * Cập nhật thông tin trường đại học (Admin)
   */
  async updateUniversity(
    id: string,
    payload: {
      code?: string;
      name?: string;
      city?: string;
      description?: string;
    }
  ): Promise<UniversityDto> {
    return apiClient.put<UniversityDto>(`/api/v1/admin/taxonomy/universities/${id}`, payload);
  }

  /**
   * Xóa trường đại học (Admin)
   */
  async deleteUniversity(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/admin/taxonomy/universities/${id}`);
  }

  /**
   * Lấy danh sách toàn bộ Khoa / Viện
   */
  async getFaculties(): Promise<FacultyDto[]> {
    return apiClient.get<FacultyDto[]>('/api/v1/faculties');
  }

  /**
   * Lấy danh sách khoa theo trường đại học
   */
  async getFacultiesByUniversity(universityId: string): Promise<FacultyDto[]> {
    return apiClient.get<FacultyDto[]>(`/api/v1/universities/${universityId}/faculties`);
  }

  /**
   * Thêm Khoa / Viện mới (Admin)
   */
  async createFaculty(payload: {
    code: string;
    name: string;
    description?: string;
  }): Promise<FacultyDto> {
    return apiClient.post<FacultyDto>('/api/v1/admin/taxonomy/faculties', payload);
  }

  /**
   * Cập nhật Khoa / Viện (Admin)
   */
  async updateFaculty(
    id: string,
    payload: {
      code?: string;
      name?: string;
      description?: string;
    }
  ): Promise<FacultyDto> {
    return apiClient.put<FacultyDto>(`/api/v1/admin/taxonomy/faculties/${id}`, payload);
  }

  /**
   * Xóa Khoa / Viện (Admin)
   */
  async deleteFaculty(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/admin/taxonomy/faculties/${id}`);
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
   * Thêm môn học mới (Admin)
   */
  async createCourse(payload: {
    code: string;
    name: string;
    area?: string;
    description?: string;
  }): Promise<CourseDto> {
    return apiClient.post<CourseDto>('/api/v1/admin/taxonomy/courses', payload);
  }

  /**
   * Cập nhật môn học (Admin)
   */
  async updateCourse(
    id: string,
    payload: {
      code?: string;
      name?: string;
      area?: string;
      description?: string;
    }
  ): Promise<CourseDto> {
    return apiClient.put<CourseDto>(`/api/v1/admin/taxonomy/courses/${id}`, payload);
  }

  /**
   * Xóa môn học (Admin)
   */
  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/admin/taxonomy/courses/${id}`);
  }

  /**
   * Lấy danh sách các lĩnh vực học thuật (Areas)
   */
  async getAreas(): Promise<string[]> {
    return apiClient.get<string[]>('/api/v1/taxonomy/areas');
  }
}

export const taxonomyService = new TaxonomyService();
