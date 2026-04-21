package com.yourcompany.novelreader.vo;

import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelReadingProgress;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookshelfItemVO {
    private Long shelfId;
    private NovelBook book;
    private NovelReadingProgress progress;
}
