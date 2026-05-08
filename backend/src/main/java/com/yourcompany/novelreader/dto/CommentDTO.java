package com.yourcompany.novelreader.dto;

import lombok.Data;

@Data
public class CommentDTO {
    private Long bookId;
    private Long chapterId;
    private String content;
    private String commentType;
    private Integer paragraphIndex;
    private String quoteText;
}
