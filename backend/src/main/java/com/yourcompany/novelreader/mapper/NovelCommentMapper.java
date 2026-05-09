package com.yourcompany.novelreader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yourcompany.novelreader.entity.NovelComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface NovelCommentMapper extends BaseMapper<NovelComment> {

    @Select("SELECT c.id, c.user_id AS userId, c.book_id AS bookId, c.chapter_id AS chapterId, " +
            "c.content, c.comment_type AS commentType, c.status, c.like_count AS likeCount, c.created_at AS createdAt, " +
            "u.username, b.title AS bookTitle " +
            "FROM novel_comment c " +
            "LEFT JOIN app_user u ON c.user_id = u.id " +
            "LEFT JOIN novel_book b ON c.book_id = b.id " +
            "ORDER BY c.created_at DESC")
    List<Map<String, Object>> listAllWithDetails();
}
