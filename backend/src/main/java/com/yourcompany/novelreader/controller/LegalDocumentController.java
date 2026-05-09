package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.yourcompany.novelreader.entity.LegalDocument;
import com.yourcompany.novelreader.exception.BusinessException;
import com.yourcompany.novelreader.mapper.LegalDocumentMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.LegalDocumentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/legal-documents")
@RequiredArgsConstructor
public class LegalDocumentController {

    private final LegalDocumentMapper legalDocumentMapper;

    @GetMapping("/latest")
    public ApiResponse<Map<String, LegalDocumentVO>> latest() {
        Map<String, LegalDocumentVO> result = new LinkedHashMap<>();
        result.put("terms", toVO(requireLatest("TERMS")));
        result.put("privacy", toVO(requireLatest("PRIVACY")));
        return ApiResponse.success(result);
    }

    @GetMapping("/latest/{type}")
    public ApiResponse<LegalDocumentVO> latestByType(@PathVariable String type) {
        return ApiResponse.success(toVO(requireLatest(normalizeDocType(type))));
    }

    private LegalDocument requireLatest(String docType) {
        LegalDocument doc = legalDocumentMapper.selectOne(new LambdaQueryWrapper<LegalDocument>()
                .eq(LegalDocument::getDocType, docType)
                .eq(LegalDocument::getEnabled, true)
                .orderByDesc(LegalDocument::getEffectiveDate)
                .orderByDesc(LegalDocument::getId)
                .last("LIMIT 1"));
        if (doc == null) {
            throw new BusinessException(404, "法律文档未配置");
        }
        return doc;
    }

    private String normalizeDocType(String type) {
        if (type == null) {
            throw new BusinessException(400, "文档类型不能为空");
        }
        String upper = type.toUpperCase().trim();
        if ("TERMS".equals(upper) || "PRIVACY".equals(upper)) {
            return upper;
        }
        throw new BusinessException(400, "不支持的文档类型");
    }

    private LegalDocumentVO toVO(LegalDocument doc) {
        LegalDocumentVO vo = new LegalDocumentVO();
        vo.setId(doc.getId());
        vo.setDocType(doc.getDocType());
        vo.setTitle(doc.getTitle());
        vo.setVersion(doc.getVersion());
        vo.setEffectiveDate(doc.getEffectiveDate());
        vo.setContent(doc.getContent());
        vo.setEnabled(doc.getEnabled());
        vo.setUpdatedAt(doc.getUpdatedAt());
        return vo;
    }
}
