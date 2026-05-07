package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ImportConfirmDTO {
    private String sourceUrl;
    @NotBlank(message = "Title is required")
    private String title;
    private String author;
    @NotNull(message = "Category is required")
    private Long categoryId;
    private String description;
    private String chapterTitle;
    private String content;
    private String sourceType;
    private List<ChapterItem> chapters;

    @Data
    public static class ChapterItem {
        private Integer chapterNo;
        @NotBlank(message = "Title is required")
        private String title;
        @NotBlank(message = "Content is required")
        private String content;
    }
}
