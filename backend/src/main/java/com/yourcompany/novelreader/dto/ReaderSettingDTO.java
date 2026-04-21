package com.yourcompany.novelreader.dto;

import lombok.Data;

@Data
public class ReaderSettingDTO {
    private Integer fontSize;
    private Integer lineHeight;
    private String theme;
    private String turnMode;
}
