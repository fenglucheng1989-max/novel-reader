package com.yourcompany.novelreader.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("novel_book_tag")
public class NovelBookTag {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long bookId;
    private String tag;
    private Integer sortOrder;
}
