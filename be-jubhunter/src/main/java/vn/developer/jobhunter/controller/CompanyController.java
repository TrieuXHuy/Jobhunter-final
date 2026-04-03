package vn.developer.jobhunter.controller;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import vn.developer.jobhunter.domain.Company;
import vn.developer.jobhunter.domain.User;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.service.CompanyService;
import vn.developer.jobhunter.service.UserService;
import vn.developer.jobhunter.util.SecurityUtil;
import vn.developer.jobhunter.util.annotation.ApiMessage;
import vn.developer.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class CompanyController {
    private final CompanyService companyService;
    private final UserService userService;

    public CompanyController(CompanyService companyService, UserService userService) {
        this.companyService = companyService;
        this.userService = userService;
    }

    private Long getCurrentCompanyId() {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        if (email.isEmpty()) {
            return null;
        }
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null || currentUser.getCompany() == null) {
            return null;
        }
        return currentUser.getCompany().getId();
    }

    @PostMapping("/companies")
    public ResponseEntity<?> createCompany(@Valid @RequestBody Company reqCompany) {

        return ResponseEntity.status(HttpStatus.CREATED).body(this.companyService.handleCreateCompany(reqCompany));
    }

    @GetMapping("/companies")
    @ApiMessage("Fetch companies")
    public ResponseEntity<ResultPaginationDTO> getCompany(
            @Filter Specification<Company> spec, Pageable pageable) {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null) {
            Specification<Company> companySpec = (root, query, criteriaBuilder) -> criteriaBuilder
                    .equal(root.get("id"), companyId);
            spec = (spec == null) ? companySpec : spec.and(companySpec);
        }

        return ResponseEntity.ok(this.companyService.handleGetCompany(spec, pageable));
    }

    @PutMapping("/companies")
    public ResponseEntity<Company> updateCompany(@Valid @RequestBody Company reqCompany) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null && reqCompany.getId() != companyId.longValue()) {
            throw new IdInvalidException("Bạn chỉ có thể cập nhật công ty của mình");
        }
        Company updatedCompany = this.companyService.handleUpdateCompany(reqCompany);
        return ResponseEntity.ok(updatedCompany);
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null && id != companyId.longValue()) {
            throw new IdInvalidException("Bạn chỉ có thể xóa công ty của mình");
        }
        this.companyService.handleDeleteCompany(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/companies/{id}")
    @ApiMessage("fetch company by id")
    public ResponseEntity<Company> fetchCompanyById(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null && id != companyId.longValue()) {
            throw new IdInvalidException("Bạn không có quyền truy cập công ty này");
        }
        Optional<Company> cOptional = this.companyService.findById(id);
        return ResponseEntity.ok().body(cOptional.get());
    }
}
