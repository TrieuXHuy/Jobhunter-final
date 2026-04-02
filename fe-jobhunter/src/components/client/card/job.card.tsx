import { callFetchJob } from '@/config/api';
import { convertSlug, getLocationName } from '@/config/utils';
import { IJob } from '@/types/backend';
import { EnvironmentOutlined, ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Pagination, Row, Spin, Tag } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from 'styles/client.module.scss';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


interface IProps {
    showPagination?: boolean;
}

const JobCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [displayJob, setDisplayJob] = useState<IJob[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(showPagination ? 8 : 5);
    const [total, setTotal] = useState(0);
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const filter = useMemo(() => {
        const parts: string[] = [];
        const skillsParam = searchParams.get('skills');
        const locationsParam = searchParams.get('locations');

        const selectedSkills = skillsParam
            ? skillsParam.split(',').map((item) => item.trim()).filter(Boolean)
            : [];
        const selectedLocations = locationsParam
            ? locationsParam.split(',').map((item) => item.trim()).filter(Boolean)
            : [];

        const toQuoted = (value: string) => `'${value.replace(/'/g, "\\'")}'`;

        if (selectedLocations.length > 0) {
            parts.push(`location in [${selectedLocations.map(toQuoted).join(',')}]`);
        }

        if (selectedSkills.length > 0) {
            parts.push(`skills.name in [${selectedSkills.map(toQuoted).join(',')}]`);
        }

        if (parts.length === 0) return "";
        return `filter=${encodeURIComponent(parts.join(' and '))}`;
    }, [searchParams]);

    useEffect(() => {
        setCurrent(1);
    }, [filter]);

    useEffect(() => {
        fetchJob();
    }, [current, pageSize, filter, sortQuery]);

    const fetchJob = async () => {
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        const res = await callFetchJob(query);
        if (res && res.data) {
            setDisplayJob(res.data.result);
            setTotal(res.data.meta.total)
        }
        setIsLoading(false)
    }



    const handleOnchangePage = (pagination: { current: number, pageSize: number }) => {
        if (pagination && pagination.current !== current) {
            setCurrent(pagination.current)
        }
        if (pagination && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
            setCurrent(1);
        }
    }

    const handleViewDetailJob = (item: IJob) => {
        const slug = convertSlug(item.name);
        navigate(`/job/${slug}?id=${item.id}`)
    }

    const getRelativeUpdatedTime = (item: IJob) => {
        const sourceTime = item.updatedAt || item.createdAt;
        if (!sourceTime) return "";

        const parsedTime = dayjs(sourceTime);
        if (!parsedTime.isValid()) return "";

        return parsedTime.locale('en').fromNow();
    }

    return (
        <div className={`${styles["card-job-section"]}`}>
            <div className={`${styles["job-content"]}`}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <span className={styles["title"]}>Công Việc Mới Nhất</span>
                                {!showPagination &&
                                    <Link to="job">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayJob?.map(item => {
                            return (
                                <Col span={24} md={showPagination ? 24 : 12} key={item.id}>
                                    <Card
                                        size="small"
                                        title={null}
                                        hoverable
                                        className={`${styles.jobCard} ${showPagination ? styles.jobCardList : ''}`}
                                        onClick={() => handleViewDetailJob(item)}
                                    >
                                        <div className={styles["card-job-content"]}>
                                            <div className={styles["card-job-left"]}>
                                                <img
                                                    alt="example"
                                                    src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${item?.company?.logo}`}
                                                />
                                            </div>
                                            <div className={styles["card-job-right"]}>
                                                <div className={styles["job-title"]}>{item.name}</div>
                                                <div className={styles["job-location"]}><EnvironmentOutlined style={{ color: '#58aaab' }} />&nbsp;{getLocationName(item.location)}</div>
                                                <div className={styles["job-salary"]}><ThunderboltOutlined style={{ color: 'orange' }} />&nbsp;{(item.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ</div>
                                                <div className={styles["job-skill-tags"]}>
                                                    {(item.skills || []).slice(0, 3).map((skill) => (
                                                        <Tag key={skill.id || skill.name} className={styles["job-skill-tag"]}>
                                                            {skill.name}
                                                        </Tag>
                                                    ))}
                                                </div>
                                                <div className={styles["job-updatedAt"]}>
                                                    <ClockCircleOutlined /> {getRelativeUpdatedTime(item)}
                                                </div>
                                            </div>
                                        </div>

                                    </Card>
                                </Col>
                            )
                        })}


                        {(!displayJob || displayJob && displayJob.length === 0)
                            && !isLoading &&
                            <div className={styles["empty"]}>
                                <Empty description="Không có dữ liệu" />
                            </div>
                        }
                    </Row>
                    {showPagination && <>
                        <div style={{ marginTop: 30 }}></div>
                        <Row style={{ display: "flex", justifyContent: "center" }}>
                            <Pagination
                                current={current}
                                total={total}
                                pageSize={pageSize}
                                responsive
                                onChange={(p: number, s: number) => handleOnchangePage({ current: p, pageSize: s })}
                            />
                        </Row>
                    </>}
                </Spin>
            </div>
        </div>
    )
}

export default JobCard;