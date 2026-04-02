package vn.developer.jobhunter.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.developer.jobhunter.domain.Company;
import vn.developer.jobhunter.domain.Job;
import vn.developer.jobhunter.domain.Skill;
import vn.developer.jobhunter.domain.User;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.developer.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.developer.jobhunter.repository.CompanyRepository;
import vn.developer.jobhunter.repository.JobRepository;
import vn.developer.jobhunter.repository.SkillRepository;
import vn.developer.jobhunter.repository.UserRepository;
import vn.developer.jobhunter.util.SecurityUtil;
import vn.developer.jobhunter.util.error.IdInvalidException;

@Service
public class JobService {

    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final CompanyRepository companyRepository;
    private final SubscriberService subscriberService;
    private final UserRepository userRepository;

    public JobService(JobRepository jobRepository,
            SkillRepository skillRepository,
            CompanyRepository companyRepository,
            SubscriberService subscriberService,
            UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.skillRepository = skillRepository;
        this.companyRepository = companyRepository;
        this.subscriberService = subscriberService;
        this.userRepository = userRepository;
    }

    public Optional<Job> fetchJobById(long id) {
        return this.jobRepository.findById(id);
    }

    public ResCreateJobDTO create(Job j) {
        // check skills
        if (j.getSkills() != null) {
            List<Long> reqSkills = j.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            j.setSkills(dbSkills);
        }

        // check company
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                j.setCompany(cOptional.get());
            }
        }

        // create job
        Job currentJob = this.jobRepository.save(j);
        this.subscriberService.notifySubscribersByJobDelayed(currentJob, 5);
        log.info("Scheduled delayed subscriber notify for jobId={} delaySeconds={}", currentJob.getId(), 5);

        // convert response
        ResCreateJobDTO dto = new ResCreateJobDTO();
        dto.setId(currentJob.getId());
        dto.setName(currentJob.getName());
        dto.setSalary(currentJob.getSalary());
        dto.setQuantity(currentJob.getQuantity());
        dto.setLocation(currentJob.getLocation());
        dto.setLevel(currentJob.getLevel());
        dto.setStartDate(currentJob.getStartDate());
        dto.setEndDate(currentJob.getEndDate());
        dto.setActive(currentJob.isActive());
        dto.setCreatedAt(currentJob.getCreatedAt());
        dto.setCreatedBy(currentJob.getCreatedBy());

        if (currentJob.getSkills() != null) {
            List<String> skills = currentJob.getSkills()
                    .stream().map(item -> item.getName())
                    .collect(Collectors.toList());
            dto.setSkills(skills);
        }

        return dto;
    }

    public ResUpdateJobDTO update(Job j, Job jobInDB) {

        // check skills
        if (j.getSkills() != null) {
            List<Long> reqSkills = j.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            jobInDB.setSkills(dbSkills);
        }

        // check company
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                jobInDB.setCompany(cOptional.get());
            }
        }

        // update correct info
        jobInDB.setName(j.getName());
        jobInDB.setSalary(j.getSalary());
        jobInDB.setQuantity(j.getQuantity());
        jobInDB.setLocation(j.getLocation());
        jobInDB.setLevel(j.getLevel());
        jobInDB.setStartDate(j.getStartDate());
        jobInDB.setEndDate(j.getEndDate());
        jobInDB.setActive(j.isActive());

        // update job
        Job currentJob = this.jobRepository.save(jobInDB);
        Map<String, Object> notifySummary = this.subscriberService.notifySubscribersByJob(currentJob);
        log.info("Immediate subscriber notify for updated jobId={} summary={}", currentJob.getId(), notifySummary);

        // convert response
        ResUpdateJobDTO dto = new ResUpdateJobDTO();
        dto.setId(currentJob.getId());
        dto.setName(currentJob.getName());
        dto.setSalary(currentJob.getSalary());
        dto.setQuantity(currentJob.getQuantity());
        dto.setLocation(currentJob.getLocation());
        dto.setLevel(currentJob.getLevel());
        dto.setStartDate(currentJob.getStartDate());
        dto.setEndDate(currentJob.getEndDate());
        dto.setActive(currentJob.isActive());
        dto.setUpdatedAt(currentJob.getUpdatedAt());
        dto.setUpdatedBy(currentJob.getUpdatedBy());

        if (currentJob.getSkills() != null) {
            List<String> skills = currentJob.getSkills()
                    .stream().map(item -> item.getName())
                    .collect(Collectors.toList());
            dto.setSkills(skills);
        }

        return dto;
    }

    public void delete(long id) {
        this.jobRepository.deleteById(id);
    }

    public ResultPaginationDTO fetchAll(Specification<Job> spec, Pageable pageable) {
        Page<Job> pageUser = this.jobRepository.findAll(spec, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);

        rs.setResult(pageUser.getContent());

        return rs;
    }

    private User getCurrentUser() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent()
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        if (email.isEmpty()) {
            throw new IdInvalidException("Bạn cần đăng nhập để thực hiện chức năng này.");
        }

        User user = this.userRepository.findByEmail(email);
        if (user == null) {
            throw new IdInvalidException("Không tìm thấy người dùng hiện tại.");
        }
        return user;
    }

    @Transactional
    public void saveFavoriteJob(long jobId) throws IdInvalidException {
        Optional<Job> jobOptional = this.jobRepository.findById(jobId);
        if (jobOptional.isEmpty()) {
            throw new IdInvalidException("Job not found");
        }

        User currentUser = this.getCurrentUser();
        List<Job> favoriteJobs = currentUser.getFavoriteJobs();
        if (favoriteJobs == null) {
            favoriteJobs = new ArrayList<>();
            currentUser.setFavoriteJobs(favoriteJobs);
        }

        boolean existed = favoriteJobs.stream().anyMatch(item -> item.getId() == jobId);
        if (!existed) {
            favoriteJobs.add(jobOptional.get());
            this.userRepository.save(currentUser);
        }
    }

    @Transactional
    public void removeFavoriteJob(long jobId) throws IdInvalidException {
        User currentUser = this.getCurrentUser();
        List<Job> favoriteJobs = currentUser.getFavoriteJobs();
        if (favoriteJobs == null || favoriteJobs.isEmpty()) {
            return;
        }

        favoriteJobs.removeIf(item -> item.getId() == jobId);
        this.userRepository.save(currentUser);
    }

    @Transactional(readOnly = true)
    public List<Long> fetchFavoriteJobIds() throws IdInvalidException {
        User currentUser = this.getCurrentUser();
        List<Job> favoriteJobs = currentUser.getFavoriteJobs();
        if (favoriteJobs == null || favoriteJobs.isEmpty()) {
            return new ArrayList<>();
        }

        return favoriteJobs.stream().map(Job::getId).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResultPaginationDTO fetchFavoriteJobs(Pageable pageable) throws IdInvalidException {
        User currentUser = this.getCurrentUser();
        List<Job> favoriteJobs = currentUser.getFavoriteJobs();
        if (favoriteJobs == null) {
            favoriteJobs = new ArrayList<>();
        }

        favoriteJobs.sort(Comparator.comparing(Job::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                .thenComparing(Job::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        int page = Math.max(pageable.getPageNumber(), 0);
        int size = pageable.getPageSize() <= 0 ? 10 : pageable.getPageSize();
        int fromIndex = Math.min(page * size, favoriteJobs.size());
        int toIndex = Math.min(fromIndex + size, favoriteJobs.size());
        List<Job> pageResult = favoriteJobs.subList(fromIndex, toIndex);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(page + 1);
        mt.setPageSize(size);
        mt.setTotal(favoriteJobs.size());
        mt.setPages(size == 0 ? 0 : (int) Math.ceil((double) favoriteJobs.size() / size));

        rs.setMeta(mt);
        rs.setResult(pageResult);

        return rs;
    }
}
