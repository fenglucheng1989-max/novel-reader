package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImportPreviewDTO {
    @NotBlank
    private String url;
}
