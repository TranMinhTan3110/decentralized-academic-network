package com.network.document_service.controller;

import com.network.document_service.entity.Course;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.service.TaxonomyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaxonomyController.class)
class TaxonomyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaxonomyService taxonomyService;

    @Test
    void getAllUniversities_shouldReturn200() throws Exception {
        when(taxonomyService.getAllUniversities()).thenReturn(List.of(
                University.builder().name("NEU").build()
        ));

        mockMvc.perform(get("/api/universities").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("NEU"));
    }

    @Test
    void getUniversityById_shouldReturn200() throws Exception {
        UUID id = UUID.randomUUID();
        when(taxonomyService.getUniversityById(id)).thenReturn(
                University.builder().id(id).name("HUST").build()
        );

        mockMvc.perform(get("/api/universities/" + id).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("HUST"));
    }

    @Test
    void getFaculties_shouldReturn200() throws Exception {
        UUID id = UUID.randomUUID();
        when(taxonomyService.getFacultiesByUniversity(id)).thenReturn(List.of(
                Faculty.builder().name("Khoa CNTT").build()
        ));

        mockMvc.perform(get("/api/universities/" + id + "/faculties").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Khoa CNTT"));
    }

    @Test
    void getCourses_shouldReturn200() throws Exception {
        when(taxonomyService.getCourses(null, null)).thenReturn(List.of(
                Course.builder().name("Java OOP").build()
        ));

        mockMvc.perform(get("/api/courses").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Java OOP"));
    }
}
