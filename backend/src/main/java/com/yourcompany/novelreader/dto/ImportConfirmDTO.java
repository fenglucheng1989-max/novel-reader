package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ImportConfirmDTO {
    @NotBlank
    private String sourceUrl;
    @NotBlank
    private String title;
    private String author;
    @NotNull
    private Long categoryId;
    private String description;
    @NotBlank
    private String chapterTitle;
    @NotBlank
    private String content;
}
