package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImportPreviewVO {
    private String sourceUrl;
    private String title;
    private String author;
    private String description;
    private String chapterTitle;
    private String content;
    private Integer wordCount;
}
