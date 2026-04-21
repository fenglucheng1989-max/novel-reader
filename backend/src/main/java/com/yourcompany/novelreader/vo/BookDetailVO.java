package com.yourcompany.novelreader.vo;

import com.yourcompany.novelreader.entity.NovelBook;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BookDetailVO {
    private NovelBook book;
    private String categoryName;
    private Boolean inBookshelf;
    private List<ChapterItemVO> chapters;
}
