package com.yourcompany.novelreader.dto;

import lombok.Data;

@Data
public class BookFilterDTO {
    private Long categoryId;
    private String groupKey;
    private String status;
    private Integer minWordCount;
    private Integer maxWordCount;
    private String keyword;
    private String sortBy;
    private Integer page = 1;
    private Integer pageSize = 20;
}
