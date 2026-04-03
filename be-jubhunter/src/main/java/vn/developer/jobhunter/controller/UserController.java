package vn.developer.jobhunter.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import vn.developer.jobhunter.domain.Company;
import vn.developer.jobhunter.domain.Role;
import vn.developer.jobhunter.domain.User;
import vn.developer.jobhunter.domain.response.ResCreateUserDTO;
import vn.developer.jobhunter.domain.response.ResUpdateUserDTO;
import vn.developer.jobhunter.domain.response.ResUserDTO;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.service.RoleService;
import vn.developer.jobhunter.service.UserService;
import vn.developer.jobhunter.util.SecurityUtil;
import vn.developer.jobhunter.util.annotation.ApiMessage;
import vn.developer.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class UserController {
    private final UserService userService;
    private final RoleService roleService;

    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, PasswordEncoder passwordEncoder, RoleService roleService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.roleService = roleService;
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        if (email.isEmpty()) {
            return null;
        }
        return this.userService.handleGetUserByUsername(email);
    }

    private Long getCurrentCompanyId() {
        User currentUser = this.getCurrentUser();
        if (currentUser == null || currentUser.getCompany() == null) {
            return null;
        }
        return currentUser.getCompany().getId();
    }

    private void validateRoleInCompany(Role role, Long companyId) throws IdInvalidException {
        if (role == null || companyId == null) {
            return;
        }
        Role roleDb = this.roleService.fetchById(role.getId());
        if (roleDb == null) {
            throw new IdInvalidException("Role với id = " + role.getId() + " không tồn tại");
        }
        if (roleDb.getComId() == null || roleDb.getComId().longValue() != companyId.longValue()) {
            throw new IdInvalidException("Bạn chỉ có thể gán vai trò thuộc công ty của mình");
        }
    }

    @PostMapping("/users")
    @ApiMessage("Create a new user")
    public ResponseEntity<ResCreateUserDTO> createNewUser(@Valid @RequestBody User postManUser)
            throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();

        boolean isEmailExist = this.userService.isEmailExist(postManUser.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + postManUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }

        if (companyId != null) {
            Company company = new Company();
            company.setId(companyId);
            postManUser.setCompany(company);
        }
        this.validateRoleInCompany(postManUser.getRole(), companyId);

        String hashPassword = this.passwordEncoder.encode(postManUser.getPassword());
        postManUser.setPassword(hashPassword);
        User ericUser = this.userService.handleCreateUser(postManUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(ericUser));
    }

    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete a user")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") long id)
            throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        User currentUser = this.userService.fetchUserById(id);
        if (currentUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }
        if (companyId != null && (currentUser.getCompany() == null
                || currentUser.getCompany().getId() != companyId.longValue())) {
            throw new IdInvalidException("Bạn không có quyền truy cập người dùng này");
        }

        this.userService.handleDeleteUser(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{id}")
    @ApiMessage("fetch user by id")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") long id) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        User fetchUser = this.userService.fetchUserById(id);
        if (fetchUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }
        if (companyId != null && (fetchUser.getCompany() == null || fetchUser.getCompany().getId() != companyId.longValue())) {
            throw new IdInvalidException("Bạn không có quyền truy cập người dùng này");
        }

        return ResponseEntity.status(HttpStatus.OK)
                .body(this.userService.convertToResUserDTO(fetchUser));
    }

    // fetch all users
    @GetMapping("/users")
    @ApiMessage("fetch all users")
    public ResponseEntity<ResultPaginationDTO> getAllUser(
            @Filter Specification<User> spec,
            Pageable pageable) {
        Long companyId = this.getCurrentCompanyId();
        if (companyId != null) {
            Specification<User> companySpec = (root, query, criteriaBuilder) -> {
                Predicate byCompany = criteriaBuilder.equal(root.get("company").get("id"), companyId);
                return byCompany;
            };
            spec = (spec == null) ? companySpec : spec.and(companySpec);
        }

        return ResponseEntity.status(HttpStatus.OK).body(
                this.userService.fetchAllUser(spec, pageable));
    }

    @PutMapping("/users")
    @ApiMessage("Update a user")
    public ResponseEntity<ResUpdateUserDTO> updateUser(@RequestBody User user) throws IdInvalidException {
        Long companyId = this.getCurrentCompanyId();
        User existingUser = this.userService.fetchUserById(user.getId());
        if (existingUser == null) {
            throw new IdInvalidException("User với id = " + user.getId() + " không tồn tại");
        }
        if (companyId != null && (existingUser.getCompany() == null
                || existingUser.getCompany().getId() != companyId.longValue())) {
            throw new IdInvalidException("Bạn không có quyền cập nhật người dùng này");
        }

        if (companyId != null) {
            Company company = new Company();
            company.setId(companyId);
            user.setCompany(company);
        }
        this.validateRoleInCompany(user.getRole(), companyId);

        User ericUser = this.userService.handleUpdateUser(user);
        if (ericUser == null) {
            throw new IdInvalidException("User với id = " + user.getId() + " không tồn tại");
        }
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(ericUser));
    }

}
