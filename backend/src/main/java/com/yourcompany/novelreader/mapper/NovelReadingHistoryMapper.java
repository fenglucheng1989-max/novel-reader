package com.yourcompany.novelreader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yourcompany.novelreader.dto.ReadingHistoryDTO;
import com.yourcompany.novelreader.entity.NovelReadingHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface NovelReadingHistoryMapper extends BaseMapper<NovelReadingHistory> {

    @Select("SELECT b.id AS bookId, b.title AS bookTitle, b.author AS bookAuthor, " +
            "b.cover_url AS coverUrl, b.status, b.latest_chapter_title AS latestChapterTitle, " +
            "h.read_at AS lastReadAt " +
            "FROM novel_reading_history h " +
            "JOIN novel_book b ON h.book_id = b.id " +
            "WHERE h.user_id = #{userId} " +
            "AND h.read_at = (SELECT MAX(h2.read_at) FROM novel_reading_history h2 " +
            "WHERE h2.user_id = h.user_id AND h2.book_id = h.book_id) " +
            "ORDER BY h.read_at DESC " +
            "LIMIT 50")
    List<ReadingHistoryDTO> findHistoryWithBooks(@Param("userId") Long userId);
}
