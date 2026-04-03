package vn.developer.jobhunter.controller;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import vn.developer.jobhunter.domain.Resume;
import vn.developer.jobhunter.domain.User;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.domain.response.resume.ResCreateResumeDTO;
import vn.developer.jobhunter.domain.response.resume.ResFetchResumeDTO;
import vn.developer.jobhunter.domain.response.resume.ResUpdateResumeDTO;
import vn.developer.jobhunter.service.ResumeService;
import vn.developer.jobhunter.service.UserService;
import vn.developer.jobhunter.util.SecurityUtil;
import vn.developer.jobhunter.util.annotation.ApiMessage;
import vn.developer.jobhunter.util.error.IdInvalidException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1")
public class ResumeController {

    private final ResumeService resumeService;
    private final UserService userService;

    public ResumeController(
            ResumeService resumeService,
            UserService userService) {
        this.resumeService = resumeService;
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

    private boolean isResumeInCompany(Resume resume, Long companyId) {
        if (companyId == null) {
            return true;
        }
        if (resume.getJob() == null || resume.getJob().getCompany() == null) {
            return false;
        }
        return resume.getJob().getCompany().getId() == companyId.longValue();
    }

    @PostMapping("/resumes")
    @ApiMessage("Create a resume")
    public ResponseEntity<ResCreateResumeDTO> create(@Valid @RequestBody Resume resume) throws IdInvalidException {
        // check id exists
        boolean isIdExist = this.resumeService.checkResumeExistByUserAndJob(resume);
        if (!isIdExist) {
            throw new IdInvalidException("User id/Job id không tồn tại");
        }

        // create new resume
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.create(resume));
    }

    @PutMapping("/resumes")
    @ApiMessage("Update a resume")
    public ResponseEntity<ResUpdateResumeDTO> update(@RequestBody Resume resume) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        // check id exist
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(resume.getId());
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + resume.getId() + " không tồn tại");
        }

        Resume reqResume = reqResumeOptional.get();
        if (!this.isResumeInCompany(reqResume, companyId)) {
            throw new IdInvalidException("Bạn không có quyền cập nhật hồ sơ ứng tuyển này");
        }
        reqResume.setStatus(resume.getStatus());

        return ResponseEntity.ok().body(this.resumeService.update(reqResume));
    }

    @DeleteMapping("/resumes/{id}")
    @ApiMessage("Delete a resume by id")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }
        if (!this.isResumeInCompany(reqResumeOptional.get(), companyId)) {
            throw new IdInvalidException("Bạn không có quyền xóa hồ sơ ứng tuyển này");
        }

        this.resumeService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/resumes/{id}")
    @ApiMessage("Fetch a resume by id")
    public ResponseEntity<ResFetchResumeDTO> fetchById(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }
        if (!this.isResumeInCompany(reqResumeOptional.get(), companyId)) {
            throw new IdInvalidException("Bạn không có quyền truy cập hồ sơ ứng tuyển này");
        }

        return ResponseEntity.ok().body(this.resumeService.getResume(reqResumeOptional.get()));
    }

    @GetMapping("/resumes")
    @ApiMessage("Fetch all resume with paginate")
    public ResponseEntity<ResultPaginationDTO> fetchAll(
            @Filter Specification<Resume> spec,
            Pageable pageable) {
        Long companyId = this.getCurrentCompanyId();
        Specification<Resume> finalSpec = spec;

        if (companyId != null) {
            Specification<Resume> companySpec = (root, query, criteriaBuilder) -> criteriaBuilder
                    .equal(root.get("job").get("company").get("id"), companyId);
            finalSpec = (finalSpec == null) ? companySpec : finalSpec.and(companySpec);
        }

        return ResponseEntity.ok().body(this.resumeService.fetchAllResume(finalSpec, pageable));
    }

    @PostMapping("/resumes/by-user")
    @ApiMessage("Get list resumes by user")
    public ResponseEntity<ResultPaginationDTO> fetchResumeByUser(Pageable pageable) {

        return ResponseEntity.ok().body(this.resumeService.fetchResumeByUser(pageable));
    }
}
