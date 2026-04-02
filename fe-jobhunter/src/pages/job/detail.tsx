import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callAddFavoriteJob, callFetchFavoriteJobIds, callFetchJobById, callRemoveFavoriteJob } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, Row, Skeleton, Tag, message } from "antd";
import { DollarOutlined, EnvironmentOutlined, HistoryOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons";
import { getLocationName } from "@/config/utils";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ApplyModal from "@/components/client/modal/apply.modal";
import { useAppSelector } from "@/redux/hooks";
dayjs.extend(relativeTime)


const ClientJobDetailPage = (props: any) => {
    const [jobDetail, setJobDetail] = useState<IJob | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [favoriteJobIds, setFavoriteJobIds] = useState<number[]>([]);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState<boolean>(false);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const navigate = useNavigate();

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // job id

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true)
                const res = await callFetchJobById(id);
                if (res?.data) {
                    setJobDetail(res.data)
                }
                setIsLoading(false)
            }
        }
        init();
    }, [id]);

    useEffect(() => {
        const fetchFavoriteIds = async () => {
            if (!isAuthenticated) {
                setFavoriteJobIds([]);
                return;
            }
            const res = await callFetchFavoriteJobIds();
            if (res?.data) {
                setFavoriteJobIds(res.data.map(item => Number(item)));
            }
        };
        fetchFavoriteIds();
    }, [isAuthenticated]);

    const handleToggleFavorite = async () => {
        if (!jobDetail?.id) return;

        if (!isAuthenticated) {
            message.warning('Bạn cần đăng nhập để lưu job yêu thích.');
            navigate('/login');
            return;
        }

        const jobId = Number(jobDetail.id);
        const isSaved = favoriteJobIds.includes(jobId);

        try {
            setIsFavoriteLoading(true);
            if (isSaved) {
                await callRemoveFavoriteJob(jobId);
                setFavoriteJobIds(prev => prev.filter(id => id !== jobId));
                message.success('Đã bỏ lưu job');
            } else {
                await callAddFavoriteJob(jobId);
                setFavoriteJobIds(prev => [...prev, jobId]);
                message.success('Đã lưu job yêu thích');
            }
        } finally {
            setIsFavoriteLoading(false);
        }
    };

    const getRelativeUpdatedTime = (job: IJob | null) => {
        const sourceTime = job?.updatedAt || job?.createdAt;
        if (!sourceTime) return "";

        const parsedTime = dayjs(sourceTime);
        if (!parsedTime.isValid()) return "";

        return parsedTime.locale("en").fromNow();
    };

    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`}>
            {isLoading ?
                <Skeleton />
                :
                <Row gutter={[20, 20]}>
                    {jobDetail && jobDetail.id &&
                        <>
                            <Col span={24} md={16}>
                                <div className={styles["header"]}>
                                    {jobDetail.name}
                                </div>
                                <div>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={styles["btn-apply"]}
                                    >Ứng tuyển ngay</button>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={styles["btn-favorite"]}
                                        disabled={isFavoriteLoading}
                                    >
                                        {favoriteJobIds.includes(Number(jobDetail.id)) ? <HeartFilled /> : <HeartOutlined />} &nbsp;
                                        {favoriteJobIds.includes(Number(jobDetail.id)) ? 'Đã lưu job này' : 'Lưu job yêu thích'}
                                    </button>
                                </div>
                                <Divider />
                                <div className={styles["skills"]}>
                                    {jobDetail?.skills?.map((item, index) => {
                                        return (
                                            <Tag key={`${index}-key`} color="gold" >
                                                {item.name}
                                            </Tag>
                                        )
                                    })}
                                </div>
                                <div className={styles["salary"]}>
                                    <DollarOutlined />
                                    <span>&nbsp;{(jobDetail.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ</span>
                                </div>
                                <div className={styles["location"]}>
                                    <EnvironmentOutlined style={{ color: '#58aaab' }} />&nbsp;{getLocationName(jobDetail.location)}
                                </div>
                                <div>
                                    <HistoryOutlined /> {getRelativeUpdatedTime(jobDetail)}
                                </div>
                                <Divider />
                                {parse(jobDetail.description)}
                            </Col>

                            <Col span={24} md={8}>
                                <div className={styles["company"]}>
                                    <div>
                                        <img
                                            width={"200px"}
                                            alt="example"
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo}`}
                                        />
                                    </div>
                                    <div>
                                        {jobDetail.company?.name}
                                    </div>
                                </div>
                            </Col>
                        </>
                    }
                </Row>
            }
            <ApplyModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                jobDetail={jobDetail}
            />
        </div>
    )
}
export default ClientJobDetailPage;