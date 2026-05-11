package com.yourcompany.novelreader.dto;

import lombok.Data;

@Data
public class HighlightCreateDTO {
    private Long bookId;
    private String bookTitle;
    private Integer chapterNo;
    private Integer paragraphIndex;
    private String quoteText;
    private String color;
}
