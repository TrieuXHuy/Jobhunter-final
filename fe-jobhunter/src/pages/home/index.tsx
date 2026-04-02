import styles from 'styles/client.module.scss';
import SearchClient from '@/components/client/search.client';
import JobCard from '@/components/client/card/job.card';
import CompanyCard from '@/components/client/card/company.card';
import RecommendedJobCard from '@/components/client/card/recommended.job.card';

const HomePage = () => {
    return (
        <div className={styles.homePage}>
            <div className={styles.homeHeroWrap}>
                <div className={styles.container}>
                    <SearchClient />
                </div>
            </div>

            <div className={`${styles["container"]} ${styles["home-section"]}`}>
                <div className={styles.homeContentBlock}>
                    <CompanyCard />
                </div>

                <div className={styles.homeContentBlock}>
                    <RecommendedJobCard />
                </div>

                <div className={styles.homeContentBlock}>
                    <JobCard />
                </div>
            </div>
        </div>
    )
}

export default HomePage;