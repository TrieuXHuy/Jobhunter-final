import JobCard from '@/components/client/card/job.card';
import styles from 'styles/client.module.scss';

const ClientSavedJobPage = () => {
    return (
        <div className={styles.homePage}>
            <div className={styles.container} style={{ paddingTop: 26 }}>
                <JobCard showPagination={true} savedOnly={true} title="Job đã lưu" />
            </div>
        </div>
    );
};

export default ClientSavedJobPage;
