package vn.developer.jobhunter.controller;

import java.util.List;
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
import vn.developer.jobhunter.domain.Job;
import vn.developer.jobhunter.domain.response.ResultPaginationDTO;
import vn.developer.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.developer.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.developer.jobhunter.service.JobService;
import vn.developer.jobhunter.util.annotation.ApiMessage;
import vn.developer.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping("/jobs")
    @ApiMessage("Create a job")
    public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.jobService.create(job));
    }

    @PutMapping("/jobs")
    @ApiMessage("Update a job")
    public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(job.getId());
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        return ResponseEntity.ok()
                .body(this.jobService.update(job, currentJob.get()));
    }

    @DeleteMapping("/jobs/{id}")
    @ApiMessage("Delete a job by id")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }
        this.jobService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/jobs/{id}")
    @ApiMessage("Get a job by id")
    public ResponseEntity<Job> getJob(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        return ResponseEntity.ok().body(currentJob.get());
    }

    @GetMapping("/jobs")
    @ApiMessage("Get job with pagination")
    public ResponseEntity<ResultPaginationDTO> getAllJob(
            @Filter Specification<Job> spec,
            Pageable pageable) {

        return ResponseEntity.ok().body(this.jobService.fetchAll(spec, pageable));
    }

    @PostMapping("/jobs/favorites/{jobId}")
    @ApiMessage("Save favorite job")
    public ResponseEntity<Void> saveFavoriteJob(@PathVariable("jobId") long jobId) throws IdInvalidException {
        this.jobService.saveFavoriteJob(jobId);
        return ResponseEntity.ok().body(null);
    }

    @DeleteMapping("/jobs/favorites/{jobId}")
    @ApiMessage("Remove favorite job")
    public ResponseEntity<Void> removeFavoriteJob(@PathVariable("jobId") long jobId) throws IdInvalidException {
        this.jobService.removeFavoriteJob(jobId);
        return ResponseEntity.ok().body(null);
    }

    @PostMapping("/jobs/favorites")
    @ApiMessage("Get favorite jobs with pagination")
    public ResponseEntity<ResultPaginationDTO> getFavoriteJobs(Pageable pageable) throws IdInvalidException {
        return ResponseEntity.ok().body(this.jobService.fetchFavoriteJobs(pageable));
    }

    @PostMapping("/jobs/favorites/ids")
    @ApiMessage("Get favorite job ids")
    public ResponseEntity<List<Long>> getFavoriteJobIds() throws IdInvalidException {
        return ResponseEntity.ok().body(this.jobService.fetchFavoriteJobIds());
    }
}
