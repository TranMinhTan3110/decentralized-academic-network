package com.network.document_service.it;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.client.IpfsStorageService;
import com.network.document_service.client.PdfProcessingService;
import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.request.ModerateDocumentRequest;
import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.entity.Document;
import com.network.document_service.entity.DocumentReport;
import com.network.document_service.entity.Notification;
import com.network.document_service.event.DocumentEventProducer;
import com.network.document_service.repository.DocumentReportRepository;
import com.network.document_service.repository.DocumentRepository;
import com.network.document_service.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Admin Moderation & Document Management Integration Flow")
class AdminModerationFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentReportRepository documentReportRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @MockBean
    private PdfProcessingService pdfProcessingService;

    @MockBean
    private IpfsStorageService ipfsStorageService;

    @MockBean
    private UserServiceClient userServiceClient;

    @MockBean
    private DocumentEventProducer documentEventProducer;

    private UUID adminId;
    private UUID authorId;
    private UUID reporterId;

    @BeforeEach
    void setUp() {
        documentReportRepository.deleteAll();
        notificationRepository.deleteAll();
        documentRepository.deleteAll();

        adminId = UUID.randomUUID();
        authorId = UUID.randomUUID();
        reporterId = UUID.randomUUID();

        when(userServiceClient.getAuthorSummary(authorId)).thenReturn(
                AuthorSummaryDto.builder().id(authorId).username("author_kim").fullName("Kim Author").build()
        );
        when(userServiceClient.getAuthorSummary(reporterId)).thenReturn(
                AuthorSummaryDto.builder().id(reporterId).username("reporter_bob").fullName("Bob Reporter").build()
        );
    }

    @Test
    @DisplayName("Admin Security Guards: Non-admin or unauthenticated requests are rejected")
    void testAdminSecurityGuards() throws Exception {
        // 1. Missing authentication
        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isUnauthorized());

        // 2. Regular USER role -> 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/reports")
                        .header("X-User-Id", authorId.toString())
                        .header("X-User-Role", "USER"))
                .andExpect(status().isForbidden());

        // 3. ADMIN role -> 200 OK
        mockMvc.perform(get("/api/v1/admin/reports")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Complete Admin Moderation Workflow: Reports -> Dismiss -> Reject & Remove -> Stats -> Delete")
    void testCompleteAdminModerationFlow() throws Exception {
        // 1. Seed two documents and two violation reports in database
        Document doc1 = documentRepository.save(Document.builder()
                .userId(authorId)
                .title("Slide Kinh tế học vi mô")
                .description("Tài liệu bài giảng đại học")
                .ipfsCid("QmSampleCid111")
                .status("PUBLISHED")
                .fileSizeBytes(1024L * 500)
                .totalPages(12)
                .build());

        Document doc2 = documentRepository.save(Document.builder()
                .userId(authorId)
                .title("Sách vi phạm bản quyền scan")
                .description("Tài liệu scan không được phép")
                .ipfsCid("QmSampleCid222")
                .status("PUBLISHED")
                .fileSizeBytes(1024L * 800)
                .totalPages(50)
                .build());

        DocumentReport rep1 = documentReportRepository.save(DocumentReport.builder()
                .documentId(doc1.getId())
                .reporterUserId(reporterId)
                .reason("Chất lượng scan mờ")
                .description("Không đọc được chữ ở trang 2")
                .status("PENDING")
                .build());

        DocumentReport rep2 = documentReportRepository.save(DocumentReport.builder()
                .documentId(doc2.getId())
                .reporterUserId(reporterId)
                .reason("Vi phạm bản quyền NXB")
                .description("Sách bản quyền chưa xin phép")
                .status("PENDING")
                .build());

        // 2. Admin retrieves reports list
        mockMvc.perform(get("/api/v1/admin/reports")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2));

        // 3. Admin dismisses Report 1 (status: PUBLISHED) -> Report becomes DISMISSED, Doc1 stays PUBLISHED
        ModerateDocumentRequest dismissReq = new ModerateDocumentRequest("PUBLISHED", "Bác bỏ báo cáo sai sự thật");
        mockMvc.perform(put("/api/v1/admin/documents/" + doc1.getId() + "/moderate")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dismissReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        DocumentReport updatedRep1 = documentReportRepository.findById(rep1.getId()).orElseThrow();
        assertThat(updatedRep1.getStatus()).isEqualTo("DISMISSED");
        Document checkedDoc1 = documentRepository.findById(doc1.getId()).orElseThrow();
        assertThat(checkedDoc1.getStatus()).isEqualTo("PUBLISHED");

        // 4. Admin confirms violation on Doc 2 (status: REJECTED) -> Report 2 becomes RESOLVED, Doc 2 becomes REJECTED
        ModerateDocumentRequest rejectReq = new ModerateDocumentRequest("REJECTED", "Xác nhận vi phạm bản quyền NXB");
        mockMvc.perform(put("/api/v1/admin/documents/" + doc2.getId() + "/moderate")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        DocumentReport updatedRep2 = documentReportRepository.findById(rep2.getId()).orElseThrow();
        assertThat(updatedRep2.getStatus()).isEqualTo("RESOLVED");
        Document checkedDoc2 = documentRepository.findById(doc2.getId()).orElseThrow();
        assertThat(checkedDoc2.getStatus()).isEqualTo("REJECTED");

        List<Notification> notifications = notificationRepository.findAll();
        assertThat(notifications).anyMatch(n -> n.getRecipientUserId().equals(authorId) && n.getContent().contains("Xác nhận vi phạm"));

        // 5. Admin lists documents with status filter
        mockMvc.perform(get("/api/v1/admin/documents")
                        .param("status", "REJECTED")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(doc2.getId().toString()));

        // 6. Admin checks Dashboard stats
        mockMvc.perform(get("/api/v1/admin/documents/stats")
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDocuments").value(2))
                .andExpect(jsonPath("$.data.pendingReports").value(0))
                .andExpect(jsonPath("$.data.rejectedDocuments").value(1));

        // 7. Admin deletes Doc 1 via DELETE endpoint
        mockMvc.perform(delete("/api/v1/admin/documents/" + doc1.getId())
                        .header("X-User-Id", adminId.toString())
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isOk());

        Document deletedDoc1 = documentRepository.findById(doc1.getId()).orElseThrow();
        assertThat(deletedDoc1.getStatus()).isEqualTo("REJECTED");
    }
}
