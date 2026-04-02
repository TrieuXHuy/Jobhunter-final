import { callFetchCompany, callFetchJob } from '@/config/api';
import { convertSlug } from '@/config/utils';
import { ICompany } from '@/types/backend';
import { Card, Col, Empty, Pagination, Row, Spin, Tag, Typography } from 'antd';
import { EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useNavigate } from 'react-router-dom';
import styles from 'styles/client.module.scss';

interface IProps {
    showPagination?: boolean;
}

interface ICompanyInsight {
    skills: string[];
    totalJobs: number;
}

const CompanyCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [displayCompany, setDisplayCompany] = useState<ICompany[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(4);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const [companyInsights, setCompanyInsights] = useState<Record<string, ICompanyInsight>>({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompany();
    }, [current, pageSize, filter, sortQuery]);

    const fetchCompany = async () => {
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        const res = await callFetchCompany(query);
        if (res && res.data) {
            setDisplayCompany(res.data.result);
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

    const handleViewDetailJob = (item: ICompany) => {
        if (item.name) {
            const slug = convertSlug(item.name);
            navigate(`/company/${slug}?id=${item.id}`)
        }
    }

    const toPlainText = (value?: string) => {
        if (!value) return '';
        return value
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    useEffect(() => {
        const fetchCompanyInsights = async () => {
            if (!displayCompany || displayCompany.length === 0) return;

            const insightEntries = await Promise.all(
                displayCompany.map(async (company) => {
                    const companyId = company.id;
                    if (!companyId) {
                        return [String(Math.random()), { skills: [], totalJobs: 0 }] as const;
                    }

                    const filterExpression = encodeURIComponent(`company.id = ${companyId} and active = true`);
                    const res = await callFetchJob(`page=1&size=20&sort=updatedAt,desc&filter=${filterExpression}`);

                    const jobs = res?.data?.result || [];
                    const totalJobs = Number(res?.data?.meta?.total || 0);
                    const uniqueSkills = Array.from(
                        new Set(
                            jobs
                                .flatMap((job) => (job.skills || []).map((skill) => skill.name || ''))
                                .filter(Boolean)
                        )
                    ).slice(0, 6);

                    return [String(companyId), { skills: uniqueSkills, totalJobs }] as const;
                })
            );

            setCompanyInsights(Object.fromEntries(insightEntries));
        };

        fetchCompanyInsights();
    }, [displayCompany]);

    return (
        <div className={`${styles["company-section"]}`}>
            <div className={styles["company-content"]}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <span className={styles["title"]}>Nhà Tuyển Dụng Hàng Đầu</span>
                                {!showPagination &&
                                    <Link to="company">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayCompany?.map(item => {
                            const insight = companyInsights[String(item.id)] || { skills: [], totalJobs: 0 };
                            const locationText = item.address || 'Đang cập nhật địa điểm';
                            const logoSrc = item?.logo
                                ? `${import.meta.env.VITE_BACKEND_URL}/storage/company/${item.logo}`
                                : '/company-placeholder.svg';
                            return (
                                <Col span={24} md={8} key={item.id}>
                                    <Card
                                        onClick={() => handleViewDetailJob(item)}
                                        className={styles.companyCard}
                                        hoverable
                                    >
                                        <div className={styles.companyCardTop}>
                                            <div className={styles.companyPattern}></div>
                                            <div className={styles.companyLogoWrap}>
                                                <img
                                                    className={styles.companyLogo}
                                                    alt="company-logo"
                                                    src={logoSrc}
                                                    onError={(event) => {
                                                        const target = event.currentTarget;
                                                        if (target.dataset.fallbackApplied === 'true') return;
                                                        target.dataset.fallbackApplied = 'true';
                                                        target.src = '/company-placeholder.svg';
                                                    }}
                                                />
                                            </div>
                                            <Typography.Title level={5} className={styles.companyName}>
                                                {item.name}
                                            </Typography.Title>

                                            <div className={styles.companySkillRow}>
                                                {(insight.skills.length ? insight.skills : ['IT', 'Developer', 'Teamwork']).map((skill) => (
                                                    <Tag key={`${item.id}-${skill}`} className={styles.companySkillTag}>
                                                        {skill}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.companyFlexSpacer}></div>

                                        <div className={styles.companyCardBottom}>
                                            <div className={styles.companyAddressTag}>
                                                <EnvironmentOutlined /> {locationText}
                                            </div>
                                            <div className={styles.companyJobCount}>
                                                <span className={styles.companyJobDot}></span>
                                                <span>{insight.totalJobs} Việc làm</span>
                                                <RightOutlined />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            )
                        })}

                        {(!displayCompany || displayCompany && displayCompany.length === 0)
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

export default CompanyCard;