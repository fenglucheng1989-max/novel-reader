package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChapterDTO {
    @NotNull(message = "Chapter number is required")
    private Integer chapterNo;
    @NotBlank(message = "Title is required")
    private String title;
    @NotBlank(message = "Content is required")
    private String content;
}
