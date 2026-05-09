package com.yourcompany.novelreader.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LegalDocumentVO {
    private Long id;
    private String docType;
    private String title;
    private String version;
    private LocalDate effectiveDate;
    private String content;
    private Boolean enabled;
    private LocalDateTime updatedAt;
}
