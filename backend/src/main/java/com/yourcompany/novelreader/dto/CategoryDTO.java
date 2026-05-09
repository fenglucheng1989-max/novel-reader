package com.yourcompany.novelreader.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryDTO {
    @NotBlank(message = "Name is required")
    private String name;
    private Long parentId;
    private String groupKey;
    private Integer sortOrder;
}
