package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommentVO {
    private Long id;
    private Long userId;
    private String username;
    private Long bookId;
    private String bookTitle;
    private Long chapterId;
    private String chapterTitle;
    private String content;
    private String commentType;
    private Integer paragraphIndex;
    private String quoteText;
    private Integer likeCount;
    private String status;
    private LocalDateTime createdAt;
}
