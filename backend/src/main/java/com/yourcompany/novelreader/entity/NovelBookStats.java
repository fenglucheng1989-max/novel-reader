package com.yourcompany.novelreader.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("novel_book_stats")
public class NovelBookStats {
    @TableId(type = IdType.INPUT)
    private Long bookId;
    private BigDecimal rating;
    private Integer ratingCount;
    private Integer readingCount;
    private Integer favoriteCount;
    private Integer viewCount;
    private LocalDateTime updatedAt;
}
