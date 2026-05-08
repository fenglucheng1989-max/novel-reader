package com.yourcompany.novelreader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yourcompany.novelreader.entity.NovelComment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentMapper extends BaseMapper<NovelComment> {
}
