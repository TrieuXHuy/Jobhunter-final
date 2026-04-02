package vn.developer.jobhunter.service;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import vn.developer.jobhunter.domain.Job;
import vn.developer.jobhunter.domain.Skill;
import vn.developer.jobhunter.domain.Subscriber;
import vn.developer.jobhunter.domain.response.email.ResEmailJob;
import vn.developer.jobhunter.repository.JobRepository;
import vn.developer.jobhunter.repository.SkillRepository;
import vn.developer.jobhunter.repository.SubscriberRepository;

@Service
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;
    private final SkillRepository skillRepository;
    private final JobRepository jobRepository;
    private final EmailService emailService;

    public SubscriberService(
            SubscriberRepository subscriberRepository,
            SkillRepository skillRepository,
            JobRepository jobRepository,
            EmailService emailService) {
        this.subscriberRepository = subscriberRepository;
        this.skillRepository = skillRepository;
        this.jobRepository = jobRepository;
        this.emailService = emailService;
    }

    // @Scheduled(cron = "*/10 * * * * *")
    // public void testCron() {
    // System.out.println(">>> TEST CRON");
    // }

    public boolean isExistsByEmail(String email) {
        return this.subscriberRepository.existsByEmail(email);
    }

    public Subscriber create(Subscriber subs) {
        // check skills
        if (subs.getSkills() != null) {
            List<Long> reqSkills = subs.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            subs.setSkills(dbSkills);
        }

        return this.subscriberRepository.save(subs);
    }

    public Subscriber update(Subscriber subsDB, Subscriber subsRequest) {
        // check skills
        if (subsRequest.getSkills() != null) {
            List<Long> reqSkills = subsRequest.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            subsDB.setSkills(dbSkills);
        }
        return this.subscriberRepository.save(subsDB);
    }

    public Subscriber findById(long id) {
        Optional<Subscriber> subsOptional = this.subscriberRepository.findById(id);
        if (subsOptional.isPresent())
            return subsOptional.get();
        return null;
    }

    public ResEmailJob convertJobToSendEmail(Job job) {
        ResEmailJob res = new ResEmailJob();
        res.setName(job.getName());
        res.setSalary(job.getSalary());
        res.setCompany(new ResEmailJob.CompanyEmail(job.getCompany().getName()));
        List<Skill> skills = job.getSkills();
        List<ResEmailJob.SkillEmail> s = skills.stream().map(skill -> new ResEmailJob.SkillEmail(skill.getName()))
                .collect(Collectors.toList());
        res.setSkills(s);
        return res;
    }

    public Map<String, Object> sendSubscribersEmailJobs() {
        Map<String, Object> summary = new HashMap<>();
        List<String> skippedSubscribers = new ArrayList<>();
        List<String> failedRecipients = new ArrayList<>();

        int totalSubscribers = 0;
        int subscribersWithSkills = 0;
        int subscribersWithMatchingJobs = 0;
        int sentCount = 0;

        List<Subscriber> listSubs = this.subscriberRepository.findAll();
        totalSubscribers = listSubs != null ? listSubs.size() : 0;

        if (listSubs != null && listSubs.size() > 0) {
            for (Subscriber sub : listSubs) {
                List<Skill> listSkills = sub.getSkills();
                if (listSkills != null && listSkills.size() > 0) {
                    subscribersWithSkills++;
                    List<Job> listJobs = this.jobRepository.findBySkillsIn(listSkills);
                    if (listJobs != null && listJobs.size() > 0) {
                        subscribersWithMatchingJobs++;

                        List<ResEmailJob> arr = listJobs.stream().map(
                                job -> this.convertJobToSendEmail(job)).collect(Collectors.toList());

                        boolean sent = this.emailService.sendEmailFromTemplateSync(
                                sub.getEmail(),
                                "Cơ hội việc làm hot đang chờ đón bạn, khám phá ngay",
                                "job",
                                sub.getName(),
                                arr);
                        if (sent) {
                            sentCount++;
                        } else {
                            failedRecipients.add(sub.getEmail());
                        }
                    } else {
                        skippedSubscribers.add(sub.getEmail() + " (khong co jobs phu hop)");
                    }
                } else {
                    skippedSubscribers.add(sub.getEmail() + " (khong co skills)");
                }
            }
        }

        summary.put("totalSubscribers", totalSubscribers);
        summary.put("subscribersWithSkills", subscribersWithSkills);
        summary.put("subscribersWithMatchingJobs", subscribersWithMatchingJobs);
        summary.put("sentCount", sentCount);
        summary.put("failedCount", failedRecipients.size());
        summary.put("failedRecipients", failedRecipients);
        summary.put("skippedSubscribers", skippedSubscribers);
        return summary;
    }

    public Map<String, Object> notifySubscribersByJob(Job job) {
        Map<String, Object> summary = new HashMap<>();
        List<String> failedRecipients = new ArrayList<>();

        if (job == null || !job.isActive() || job.getSkills() == null || job.getSkills().isEmpty()) {
            summary.put("matchedSubscribers", 0);
            summary.put("sentCount", 0);
            summary.put("failedCount", 0);
            summary.put("failedRecipients", Collections.emptyList());
            return summary;
        }

        List<Subscriber> matchedSubscribers = this.subscriberRepository.findDistinctBySkillsIn(job.getSkills());
        int sentCount = 0;

        List<ResEmailJob> arr = List.of(this.convertJobToSendEmail(job));
        for (Subscriber sub : matchedSubscribers) {
            boolean sent = this.emailService.sendEmailFromTemplateSync(
                    sub.getEmail(),
                    "Cơ hội việc làm mới phù hợp với kỹ năng của bạn",
                    "job",
                    sub.getName(),
                    arr);
            if (sent) {
                sentCount++;
            } else {
                failedRecipients.add(sub.getEmail());
            }
        }

        summary.put("matchedSubscribers", matchedSubscribers.size());
        summary.put("sentCount", sentCount);
        summary.put("failedCount", failedRecipients.size());
        summary.put("failedRecipients", failedRecipients);
        return summary;
    }

    public Subscriber findByEmail(String email) {
        return this.subscriberRepository.findByEmail(email);
    }
}
