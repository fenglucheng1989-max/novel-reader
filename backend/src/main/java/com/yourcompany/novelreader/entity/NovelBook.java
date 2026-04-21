package com.yourcompany.novelreader.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("novel_book")
public class NovelBook {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String author;
    private Long categoryId;
    private String description;
    private String coverUrl;
    private String status;
    private Integer wordCount;
    private Integer chapterCount;
    private String latestChapterTitle;
    private String sourceType;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
