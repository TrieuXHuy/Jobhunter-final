import { callCreateSubscriber, callFetchAllSkill, callFetchResumeByUser, callFetchSubscriberSkills, callUpdateSubscriber } from "@/config/api";
import { convertSlug } from "@/config/utils";
import { useAppSelector } from "@/redux/hooks";
import { IResumeByUser, ISkill, ISubscriber } from "@/types/backend";
import { Button, Form, Modal, Select, Table, Tabs, message, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface IProps {
    open: boolean;
    onClose: () => void;
}

const AccountManageModal = ({ open, onClose }: IProps) => {
    const user = useAppSelector((state) => state.account.user);

    const [activeTab, setActiveTab] = useState("resume");

    const [resumeLoading, setResumeLoading] = useState(false);
    const [resumes, setResumes] = useState<IResumeByUser[]>([]);
    const [resumePage, setResumePage] = useState(1);
    const [resumePageSize, setResumePageSize] = useState(5);
    const [resumeTotal, setResumeTotal] = useState(0);

    const [skillLoading, setSkillLoading] = useState(false);
    const [updatingSubscriber, setUpdatingSubscriber] = useState(false);
    const [skillOptions, setSkillOptions] = useState<{ label: string; value: string }[]>([]);
    const [subscriber, setSubscriber] = useState<ISubscriber | null>(null);
    const [form] = Form.useForm();

    const fetchResumeByUser = async (page = resumePage, size = resumePageSize) => {
        setResumeLoading(true);
        const query = `page=${page}&size=${size}&sort=createdAt,desc`;
        const res = await callFetchResumeByUser(query);
        if (res?.data) {
            setResumes(res.data.result || []);
            setResumeTotal(res.data.meta?.total || 0);
        } else {
            setResumes([]);
            setResumeTotal(0);
        }
        setResumeLoading(false);
    };

    const fetchSubscriberAndSkills = async () => {
        setSkillLoading(true);

        const [skillsRes, subscriberRes] = await Promise.all([
            callFetchAllSkill("page=1&size=1000&sort=createdAt,desc"),
            callFetchSubscriberSkills(),
        ]);

        const skills = skillsRes?.data?.result ?? [];
        setSkillOptions(
            skills
                .filter((item: ISkill) => !!item.id)
                .map((item: ISkill) => ({
                    label: item.name ?? "",
                    value: String(item.id),
                }))
        );

        if (subscriberRes?.data?.id) {
            setSubscriber(subscriberRes.data);
            form.setFieldValue(
                "skills",
                (subscriberRes.data.skills || []).map((item) => String(item.id))
            );
        } else {
            setSubscriber(null);
            form.setFieldValue("skills", []);
        }

        setSkillLoading(false);
    };

    useEffect(() => {
        if (!open) return;
        fetchResumeByUser(1, resumePageSize);
        setResumePage(1);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (activeTab === "subscriber") {
            fetchSubscriberAndSkills();
        }
    }, [open, activeTab]);

    const handleChangeResumePage = (page: number, pageSize: number) => {
        setResumePage(page);
        setResumePageSize(pageSize);
        fetchResumeByUser(page, pageSize);
    };

    const handleUpdateSubscriber = async () => {
        const selectedSkills = form.getFieldValue("skills") as string[];
        if (!selectedSkills || selectedSkills.length === 0) {
            message.error("Vui lòng chọn ít nhất 1 kỹ năng.");
            return;
        }

        const payload: ISubscriber = {
            ...(subscriber?.id ? { id: subscriber.id } : {}),
            email: user.email,
            name: user.name,
            skills: selectedSkills.map((id) => ({ id: Number(id) })),
        };

        setUpdatingSubscriber(true);
        const res = subscriber?.id
            ? await callUpdateSubscriber(payload)
            : await callCreateSubscriber(payload);
        setUpdatingSubscriber(false);

        if (res?.data) {
            message.success("Cập nhật nhận jobs qua email thành công.");
            setSubscriber(res.data);
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: res?.message || "Không thể cập nhật đăng ký nhận email.",
            });
        }
    };

    const resumeColumns: ColumnsType<IResumeByUser> = useMemo(
        () => [
            {
                title: "STT",
                render: (_, __, index) => (index + 1) + (resumePage - 1) * resumePageSize,
                width: 70,
            },
            {
                title: "Công Ty",
                render: (_, record) => record.companyName ?? "",
            },
            {
                title: "Job title",
                render: (_, record) => record.job?.name ?? "",
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                width: 120,
            },
            {
                title: "Ngày rải CV",
                render: (_, record) => (record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss") : ""),
                width: 180,
            },
            {
                title: "",
                render: (_, record) => {
                    if (record.job?.id && record.job?.name) {
                        const slug = convertSlug(record.job.name);
                        return <Link to={`/job/${slug}?id=${record.job.id}`}>Chi tiết</Link>;
                    }
                    return null;
                },
                width: 100,
            },
        ],
        [resumePage, resumePageSize]
    );

    return (
        <Modal
            title="Quản lý tài khoản"
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
            destroyOnClose
            maskClosable={false}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "resume",
                        label: "Rải CV",
                        children: (
                            <Table<IResumeByUser>
                                rowKey="id"
                                loading={resumeLoading}
                                columns={resumeColumns}
                                dataSource={resumes}
                                pagination={{
                                    current: resumePage,
                                    pageSize: resumePageSize,
                                    total: resumeTotal,
                                    onChange: handleChangeResumePage,
                                    showSizeChanger: true,
                                }}
                            />
                        ),
                    },
                    {
                        key: "subscriber",
                        label: "Nhận Jobs qua Email",
                        children: (
                            <Form form={form} layout="vertical">
                                <Form.Item
                                    label="Kỹ năng"
                                    name="skills"
                                    rules={[{ required: true, message: "Vui lòng chọn kỹ năng" }]}
                                >
                                    <Select
                                        mode="multiple"
                                        options={skillOptions}
                                        loading={skillLoading}
                                        placeholder="Chọn kỹ năng để nhận jobs qua email"
                                    />
                                </Form.Item>
                                <Button type="primary" loading={updatingSubscriber} onClick={handleUpdateSubscriber}>
                                    Cập nhật
                                </Button>
                            </Form>
                        ),
                    },
                    {
                        key: "profile",
                        label: "Cập nhật thông tin",
                        children: <div>Tính năng sẽ được cập nhật trong bước tiếp theo.</div>,
                    },
                    {
                        key: "password",
                        label: "Thay đổi mật khẩu",
                        children: <div>Tính năng sẽ được cập nhật trong bước tiếp theo.</div>,
                    },
                ]}
            />
        </Modal>
    );
};

export default AccountManageModal;
