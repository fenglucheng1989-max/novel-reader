package com.yourcompany.novelreader.controller;

import com.yourcompany.novelreader.dto.BookDTO;
import com.yourcompany.novelreader.dto.CategoryDTO;
import com.yourcompany.novelreader.dto.ChapterDTO;
import com.yourcompany.novelreader.dto.ImportConfirmDTO;
import com.yourcompany.novelreader.dto.ImportPreviewDTO;
import com.yourcompany.novelreader.entity.NovelBook;
import com.yourcompany.novelreader.entity.NovelCategory;
import com.yourcompany.novelreader.entity.NovelChapter;
import com.yourcompany.novelreader.mapper.AppUserMapper;
import com.yourcompany.novelreader.mapper.NovelBookMapper;
import com.yourcompany.novelreader.mapper.NovelCategoryMapper;
import com.yourcompany.novelreader.mapper.NovelChapterMapper;
import com.yourcompany.novelreader.service.BookService;
import com.yourcompany.novelreader.vo.AdminDashboardVO;
import com.yourcompany.novelreader.vo.ApiResponse;
import com.yourcompany.novelreader.vo.BookDetailVO;
import com.yourcompany.novelreader.vo.ChapterItemVO;
import com.yourcompany.novelreader.vo.ImportPreviewVO;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminNovelController extends BaseUserController {

    private final BookService bookService;
    private final NovelBookMapper bookMapper;
    private final NovelChapterMapper chapterMapper;
    private final NovelCategoryMapper categoryMapper;
    private final AppUserMapper appUserMapper;

    public AdminNovelController(AppUserMapper appUserMapper,
                                BookService bookService,
                                NovelBookMapper bookMapper,
                                NovelChapterMapper chapterMapper,
                                NovelCategoryMapper categoryMapper) {
        super(appUserMapper);
        this.appUserMapper = appUserMapper;
        this.bookService = bookService;
        this.bookMapper = bookMapper;
        this.chapterMapper = chapterMapper;
        this.categoryMapper = categoryMapper;
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardVO> dashboard(Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(AdminDashboardVO.builder()
                .bookCount(bookMapper.selectCount(null))
                .chapterCount(chapterMapper.selectCount(null))
                .categoryCount(categoryMapper.selectCount(null))
                .userCount(appUserMapper.selectCount(null))
                .build());
    }

    @GetMapping("/books")
    public ApiResponse<List<NovelBook>> books(Authentication authentication,
                                             @RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) String keyword) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.list(categoryId, keyword));
    }

    @GetMapping("/books/{id}")
    public ApiResponse<BookDetailVO> book(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.detail(id, null));
    }

    @GetMapping("/books/{id}/chapters")
    public ApiResponse<List<ChapterItemVO>> chapters(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.chapters(id));
    }

    @GetMapping("/chapters/{id}")
    public ApiResponse<NovelChapter> chapter(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        return ApiResponse.success(chapterMapper.selectById(id));
    }

    @PostMapping("/books")
    public ApiResponse<NovelBook> createBook(Authentication authentication, @Valid @RequestBody BookDTO dto) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.createBook(dto));
    }

    @PutMapping("/books/{id}")
    public ApiResponse<NovelBook> updateBook(Authentication authentication,
                                             @PathVariable Long id,
                                             @Valid @RequestBody BookDTO dto) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.updateBook(id, dto));
    }

    @DeleteMapping("/books/{id}")
    public ApiResponse<Void> deleteBook(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        bookService.deleteBook(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/books/{id}/chapters")
    public ApiResponse<NovelChapter> createChapter(Authentication authentication,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody ChapterDTO dto) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.createChapter(id, dto));
    }

    @PutMapping("/chapters/{id}")
    public ApiResponse<NovelChapter> updateChapter(Authentication authentication,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody ChapterDTO dto) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.updateChapter(id, dto));
    }

    @DeleteMapping("/chapters/{id}")
    public ApiResponse<Void> deleteChapter(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        bookService.deleteChapter(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/categories")
    public ApiResponse<List<NovelCategory>> categories(Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.success(bookService.categories());
    }

    @PostMapping("/categories")
    public ApiResponse<NovelCategory> createCategory(Authentication authentication,
                                                     @Valid @RequestBody CategoryDTO dto) {
        requireAdmin(authentication);
        NovelCategory category = NovelCategory.builder()
                .name(dto.getName())
                .parentId(dto.getParentId() == null ? 0L : dto.getParentId())
                .sortOrder(dto.getSortOrder() == null ? 0 : dto.getSortOrder())
                .build();
        categoryMapper.insert(category);
        return ApiResponse.success(category);
    }

    @PutMapping("/categories/{id}")
    public ApiResponse<NovelCategory> updateCategory(Authentication authentication,
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody CategoryDTO dto) {
        requireAdmin(authentication);
        NovelCategory category = categoryMapper.selectById(id);
        if (category == null) {
            return ApiResponse.error(404, "Category not found");
        }
        category.setName(dto.getName());
        category.setParentId(dto.getParentId() == null ? 0L : dto.getParentId());
        category.setSortOrder(dto.getSortOrder() == null ? 0 : dto.getSortOrder());
        categoryMapper.updateById(category);
        return ApiResponse.success(category);
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(Authentication authentication, @PathVariable Long id) {
        requireAdmin(authentication);
        categoryMapper.deleteById(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/import/preview")
    public ApiResponse<ImportPreviewVO> previewImport(Authentication authentication,
                                                      @Valid @RequestBody ImportPreviewDTO dto) throws Exception {
        requireAdmin(authentication);
        String html = fetchHtml(dto.getUrl());
        String title = extractTitle(html);
        String text = extractText(html);
        String content = text.length() > 5000 ? text.substring(0, 5000) : text;
        return ApiResponse.success(ImportPreviewVO.builder()
                .sourceUrl(dto.getUrl())
                .title(title.isBlank() ? "外部导入：" + URI.create(dto.getUrl()).getHost() : title)
                .author(URI.create(dto.getUrl()).getHost())
                .description("来源：" + dto.getUrl())
                .chapterTitle("第一章 导入内容")
                .content(content)
                .wordCount(countWords(content))
                .build());
    }

    @PostMapping("/import/confirm")
    public ApiResponse<NovelBook> confirmImport(Authentication authentication,
                                                @Valid @RequestBody ImportConfirmDTO dto) {
        requireAdmin(authentication);
        BookDTO bookDTO = new BookDTO();
        bookDTO.setTitle(dto.getTitle());
        bookDTO.setAuthor(dto.getAuthor());
        bookDTO.setCategoryId(dto.getCategoryId());
        bookDTO.setDescription((dto.getDescription() == null ? "" : dto.getDescription()) + "\n来源：" + dto.getSourceUrl());
        bookDTO.setStatus("COMPLETED");
        bookDTO.setSourceType("EXTERNAL");
        bookDTO.setSortOrder(100);
        NovelBook book = bookService.createBook(bookDTO);

        ChapterDTO chapterDTO = new ChapterDTO();
        chapterDTO.setChapterNo(1);
        chapterDTO.setTitle(dto.getChapterTitle());
        chapterDTO.setContent(dto.getContent());
        bookService.createChapter(book.getId(), chapterDTO);
        return ApiResponse.success(bookMapper.selectById(book.getId()));
    }

    private String fetchHtml(String url) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalArgumentException("网页请求失败，状态码：" + response.statusCode());
        }
        return response.body();
    }

    private String extractTitle(String html) {
        Matcher matcher = Pattern.compile("(?is)<title[^>]*>(.*?)</title>").matcher(html);
        if (matcher.find()) {
            return cleanText(matcher.group(1)).trim();
        }
        Matcher h1 = Pattern.compile("(?is)<h1[^>]*>(.*?)</h1>").matcher(html);
        return h1.find() ? cleanText(h1.group(1)).trim() : "";
    }

    private String extractText(String html) {
        String text = html
                .replaceAll("(?is)<script.*?</script>", " ")
                .replaceAll("(?is)<style.*?</style>", " ")
                .replaceAll("(?is)<br\\s*/?>", "\n")
                .replaceAll("(?is)</p>", "\n")
                .replaceAll("(?is)<[^>]+>", " ");
        return cleanText(text);
    }

    private String cleanText(String text) {
        return text.replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replaceAll("[ \\t\\x0B\\f\\r]+", " ")
                .replaceAll("\\n\\s+", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private int countWords(String content) {
        return content == null ? 0 : content.replaceAll("\\s+", "").length();
    }
}
