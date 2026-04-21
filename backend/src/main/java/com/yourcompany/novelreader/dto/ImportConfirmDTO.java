package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ImportConfirmDTO {
    private String sourceUrl;
    @NotBlank
    private String title;
    private String author;
    @NotNull
    private Long categoryId;
    private String description;
    private String chapterTitle;
    private String content;
    private String sourceType;
    private List<ChapterItem> chapters;

    @Data
    public static class ChapterItem {
        private Integer chapterNo;
        @NotBlank
        private String title;
        @NotBlank
        private String content;
    }
}
