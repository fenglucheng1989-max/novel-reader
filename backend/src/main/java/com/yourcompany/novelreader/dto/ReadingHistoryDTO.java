package com.yourcompany.novelreader.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingHistoryDTO {
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String coverUrl;
    private String status;
    private String latestChapterTitle;
    private LocalDateTime lastReadAt;
}
