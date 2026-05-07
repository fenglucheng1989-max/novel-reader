package com.yourcompany.novelreader.vo;

import com.yourcompany.novelreader.entity.NovelBook;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class BookDetailVO {
    private NovelBook book;
    private String categoryName;
    private Boolean inBookshelf;
    private List<ChapterItemVO> chapters;
    private BigDecimal rating;
    private Integer ratingCount;
    private Integer readingCount;
    private Integer favoriteCount;
    private List<String> tags;
    private Integer estimatedReadingMinutes;
}
