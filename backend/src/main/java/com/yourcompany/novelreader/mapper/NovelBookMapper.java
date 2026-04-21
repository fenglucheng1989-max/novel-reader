package com.yourcompany.novelreader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yourcompany.novelreader.entity.NovelBook;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NovelBookMapper extends BaseMapper<NovelBook> {
}
