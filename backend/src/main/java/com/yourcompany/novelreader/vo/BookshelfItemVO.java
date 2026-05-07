package com.yourcompany.novelreader.vo;

import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookshelfItemVO {
    private Long shelfId;
    private NovelBook book;
    private NovelReadingProgress progress;
    private Boolean pinned;
    private Integer sortOrder;
    private LocalDateTime lastReadAt;
}
