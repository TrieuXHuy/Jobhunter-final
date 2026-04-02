import SearchClient from '@/components/client/search.client';
import { Col, Row } from 'antd';
import styles from 'styles/client.module.scss';
import JobCard from '@/components/client/card/job.card';

const ClientJobPage = (props: any) => {
    return (
        <div className={styles.homePage}>
            <div className={styles.homeHeroWrap}>
                <div className={styles.container}>
                    <SearchClient />
                </div>
            </div>

            <div className={styles.container} style={{ paddingTop: 26 }}>
                <Row gutter={[20, 20]}>
                    <Col span={24}>
                        <JobCard
                            showPagination={true}
                        />
                    </Col>
                </Row>
            </div>
        </div>
    )
}

export default ClientJobPage;