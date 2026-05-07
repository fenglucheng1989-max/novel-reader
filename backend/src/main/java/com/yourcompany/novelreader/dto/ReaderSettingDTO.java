package com.yourcompany.novelreader.dto;

import lombok.Data;

@Data
public class ReaderSettingDTO {
    private Integer fontSize;
    private Integer lineHeight;
    private Integer marginX;
    private Integer marginY;
    private Integer paragraphSpacing;
    private String theme;
    private String turnMode;
    private Boolean autoPageEnabled;
    private Integer autoPageInterval;
}
