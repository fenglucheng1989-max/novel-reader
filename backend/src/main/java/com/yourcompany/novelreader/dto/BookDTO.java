package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookDTO {
    @NotBlank(message = "Title is required")
    private String title;
    private String author;
    private Long categoryId;
    private String description;
    private String coverUrl;
    private String status;
    private String sourceType;
    private Integer sortOrder;
}
