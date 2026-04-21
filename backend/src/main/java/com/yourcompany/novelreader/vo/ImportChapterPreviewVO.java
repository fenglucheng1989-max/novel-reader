package com.yourcompany.novelreader.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportChapterPreviewVO {
    private Integer chapterNo;
    private String title;
    private String content;
    private Integer wordCount;
}
