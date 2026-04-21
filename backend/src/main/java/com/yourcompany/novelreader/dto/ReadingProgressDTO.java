package com.yourcompany.novelreader.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReadingProgressDTO {
    private Long chapterId;
    private Integer chapterNo;
    private Integer position;
    private BigDecimal progressPercent;
    private Integer durationSeconds;
}
