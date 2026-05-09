package com.yourcompany.novelreader.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("legal_document")
public class LegalDocument {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String docType;

    private String title;

    private String version;

    private LocalDate effectiveDate;

    private String content;

    private Boolean enabled;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
