package vn.developer.jobhunter.controller;

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
import vn.developer.jobhunter.domain.Role;
import vn.developer.jobhunter.domain.User;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.service.RoleService;
import vn.developer.jobhunter.service.UserService;
import vn.developer.jobhunter.util.SecurityUtil;
import vn.developer.jobhunter.util.annotation.ApiMessage;
import vn.developer.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class RoleController {

    private final RoleService roleService;
    private final UserService userService;

    public RoleController(RoleService roleService, UserService userService) {
        this.roleService = roleService;
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

    private void assertRoleInCompany(Role role, Long companyId) throws IdInvalidException {
        if (companyId == null) {
            return;
        }
        if (role.getComId() == null || role.getComId().longValue() != companyId.longValue()) {
            throw new IdInvalidException("Bạn không có quyền truy cập vai trò này");
        }
    }

    @PostMapping("/roles")
    @ApiMessage("Create a role")
    public ResponseEntity<Role> create(@Valid @RequestBody Role r) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null) {
            r.setComId(companyId);
        }

        // check name
        if (this.roleService.existByNameAndCompany(r.getName(), r.getComId())) {
            throw new IdInvalidException("Role với name = " + r.getName() + " đã tồn tại");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(r));
    }

    @PutMapping("/roles")
    @ApiMessage("Update a role")
    public ResponseEntity<Role> update(@Valid @RequestBody Role r) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        // check id
        Role roleInDb = this.roleService.fetchById(r.getId());
        if (roleInDb == null) {
            throw new IdInvalidException("Role với id = " + r.getId() + " không tồn tại");
        }
        this.assertRoleInCompany(roleInDb, companyId);
        if (companyId != null) {
            r.setComId(companyId);
        }

        // check name
        // if (this.roleService.existByName(r.getName())) {
        // throw new IdInvalidException("Role với name = " + r.getName() + " đã tồn
        // tại");
        // }

        return ResponseEntity.ok().body(this.roleService.update(r));
    }

    @DeleteMapping("/roles/{id}")
    @ApiMessage("Delete a role")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        // check id
        Role roleInDb = this.roleService.fetchById(id);
        if (roleInDb == null) {
            throw new IdInvalidException("Role với id = " + id + " không tồn tại");
        }
        this.assertRoleInCompany(roleInDb, companyId);
        this.roleService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/roles")
    @ApiMessage("Fetch roles")
    public ResponseEntity<ResultPaginationDTO> getPermissions(
            @Filter Specification<Role> spec, Pageable pageable) {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null) {
            Specification<Role> companySpec = (root, query, criteriaBuilder) -> criteriaBuilder
                    .equal(root.get("comId"), companyId);
            spec = (spec == null) ? companySpec : spec.and(companySpec);
        }

        return ResponseEntity.ok(this.roleService.getRoles(spec, pageable));
    }

    @GetMapping("/roles/{id}")
    @ApiMessage("Fetch role by id")
    public ResponseEntity<Role> getById(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();

        Role role = this.roleService.fetchById(id);
        if (role == null) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }
        this.assertRoleInCompany(role, companyId);

        return ResponseEntity.ok().body(role);
    }

}
