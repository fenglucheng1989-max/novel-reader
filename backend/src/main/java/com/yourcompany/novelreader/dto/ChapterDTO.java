package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChapterDTO {
    @NotNull
    private Integer chapterNo;
    @NotBlank
    private String title;
    @NotBlank
    private String content;
}
