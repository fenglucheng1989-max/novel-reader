package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookshelfStatsVO {
    private Integer totalBooks;
    private Integer todayMinutes;
    private Integer streakDays;
    private Integer updateCount;
    private Long latestBookId;
    private String latestBookTitle;
}
