package com.yourcompany.novelreader.vo;

import lombok.Data;

import java.util.List;

@Data
public class BookshelfSortRequest {
    private List<Long> bookIds;
}
