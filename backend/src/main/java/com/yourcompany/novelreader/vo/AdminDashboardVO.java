package com.yourcompany.novelreader.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardVO {
    private Long bookCount;
    private Long chapterCount;
    private Long categoryCount;
    private Long userCount;
}
