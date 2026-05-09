package com.yourcompany.novelreader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.yourcompany.novelreader.entity.LegalDocument;
import com.yourcompany.novelreader.mapper.LegalDocumentMapper;
import com.yourcompany.novelreader.vo.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminLegalDocumentController extends BaseUserController {

    private final LegalDocumentMapper documentMapper;

    public AdminLegalDocumentController(com.yourcompany.novelreader.mapper.AppUserMapper appUserMapper,
                                         LegalDocumentMapper documentMapper) {
        super(appUserMapper);
        this.documentMapper = documentMapper;
    }

    @GetMapping("/legal-documents")
    public ApiResponse<List<LegalDocument>> list(Authentication authentication) {
        requireAdmin(authentication);
        List<LegalDocument> docs = documentMapper.selectList(
                new LambdaQueryWrapper<LegalDocument>().orderByDesc(LegalDocument::getEffectiveDate));
        return ApiResponse.success(docs);
    }

    @PostMapping("/legal-documents")
    public ApiResponse<LegalDocument> create(Authentication authentication,
                                              @RequestBody Map<String, Object> body) {
        requireAdmin(authentication);
        LegalDocument doc = new LegalDocument();
        doc.setDocType((String) body.get("docType"));
        doc.setTitle((String) body.get("title"));
        doc.setVersion((String) body.get("version"));
        doc.setContent((String) body.get("content"));
        doc.setEnabled(body.get("enabled") != null ? (Boolean) body.get("enabled") : true);
        String dateStr = (String) body.get("effectiveDate");
        doc.setEffectiveDate(dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now());
        documentMapper.insert(doc);
        return ApiResponse.success(doc);
    }

    @PutMapping("/legal-documents/{id}")
    public ApiResponse<LegalDocument> update(Authentication authentication,
                                              @PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        requireAdmin(authentication);
        LegalDocument doc = documentMapper.selectById(id);
        if (doc == null) return ApiResponse.error(404, "Document not found");
        if (body.containsKey("title")) doc.setTitle((String) body.get("title"));
        if (body.containsKey("version")) doc.setVersion((String) body.get("version"));
        if (body.containsKey("content")) doc.setContent((String) body.get("content"));
        if (body.containsKey("enabled")) doc.setEnabled((Boolean) body.get("enabled"));
        if (body.containsKey("effectiveDate")) doc.setEffectiveDate(LocalDate.parse((String) body.get("effectiveDate")));
        documentMapper.updateById(doc);
        return ApiResponse.success(doc);
    }

    @PutMapping("/legal-documents/{id}/activate")
    public ApiResponse<Void> activate(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        LegalDocument doc = documentMapper.selectById(id);
        if (doc == null) return ApiResponse.error(404, "Document not found");
        LambdaUpdateWrapper<LegalDocument> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(LegalDocument::getDocType, doc.getDocType())
                .set(LegalDocument::getEnabled, Boolean.FALSE);
        documentMapper.update(null, updateWrapper);
        doc.setEnabled(true);
        documentMapper.updateById(doc);
        return ApiResponse.success(null);
    }
}
