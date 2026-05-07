package com.yourcompany.novelreader.entity;

import com.baomidou.mybatisplus.annotation.IdType;
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
@TableName("novel_reader_setting")
public class NovelReaderSetting {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer fontSize;
    private Integer lineHeight;
    private Integer marginX;
    private Integer marginY;
    private Integer paragraphSpacing;
    private String theme;
    private String turnMode;
    private Boolean autoPageEnabled;
    private Integer autoPageInterval;
    private LocalDateTime updatedAt;
}
