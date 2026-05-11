package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HighlightVO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private Integer chapterNo;
    private Integer paragraphIndex;
    private String quoteText;
    private String color;
    private LocalDateTime createdAt;
}
