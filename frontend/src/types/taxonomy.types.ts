// ==============================================================================
// TAXONOMY TYPES - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Universities, Faculties, and Academic Courses
// ==============================================================================

export interface UniversityDto {
  id: string;
  name: string;
  code?: string;
  city?: string;
  logoUrl?: string;
}

export interface FacultyDto {
  id: string;
  universityId: string;
  name: string;
  code?: string;
}

export interface CourseDto {
  id: string;
  facultyId?: string;
  code: string;
  name: string;
  area?: string;
  description?: string;
  documentCount?: number;
}

export interface CourseDetailDto extends CourseDto {
  facultyName?: string;
  universityName?: string;
}
