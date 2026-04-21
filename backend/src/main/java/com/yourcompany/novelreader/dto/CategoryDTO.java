package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryDTO {
    @NotBlank
    private String name;
    private Long parentId;
    private Integer sortOrder;
}
