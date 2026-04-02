import { callFetchSubscriberSkills } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';
import JobCard from './job.card';

const RecommendedJobCard = () => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [loading, setLoading] = useState<boolean>(false);
    const [customFilter, setCustomFilter] = useState<string>('');
    const [hasSubscribedSkill, setHasSubscribedSkill] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            if (!isAuthenticated) {
                setCustomFilter('');
                setHasSubscribedSkill(false);
                return;
            }

            setLoading(true);
            const res = await callFetchSubscriberSkills();
            const skillIds = (res?.data?.skills || [])
                .map((item) => Number(item.id))
                .filter((id) => !Number.isNaN(id));

            if (skillIds.length > 0) {
                setCustomFilter(`filter=${encodeURIComponent(`skills.id in [${skillIds.join(',')}]`)}`);
                setHasSubscribedSkill(true);
            } else {
                setCustomFilter('');
                setHasSubscribedSkill(false);
            }
            setLoading(false);
        };

        init();
    }, [isAuthenticated]);

    if (!isAuthenticated) return null;

    if (loading) {
        return <Spin spinning tip="Đang gợi ý việc làm phù hợp..." />;
    }

    if (!hasSubscribedSkill) {
        return (
            <Alert
                message="Việc phù hợp với bạn"
                description="Bạn chưa chọn kỹ năng nhận job trong phần Quản lý tài khoản, nên chưa có gợi ý phù hợp."
                type="info"
                showIcon
            />
        );
    }

    return <JobCard title="Việc phù hợp với bạn" customFilter={customFilter} />;
};

export default RecommendedJobCard;
