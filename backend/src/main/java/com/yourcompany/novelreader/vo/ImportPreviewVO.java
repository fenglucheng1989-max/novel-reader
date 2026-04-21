package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ImportPreviewVO {
    private String sourceUrl;
    private String sourceType;
    private String title;
    private String author;
    private String description;
    private String chapterTitle;
    private String content;
    private Integer wordCount;
    private Integer chapterCount;
    private List<ImportChapterPreviewVO> chapters;
}
