package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChapterItemVO {
    private Long id;
    private Long bookId;
    private Integer chapterNo;
    private String title;
    private Integer wordCount;
}
