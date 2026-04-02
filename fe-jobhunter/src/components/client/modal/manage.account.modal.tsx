import { callCreateSubscriber, callFetchAllSkill, callFetchResumeByUser, callFetchSubscriberSkills, callFetchUserById, callUpdateSubscriber, callUpdateUser } from "@/config/api";
import { convertSlug } from "@/config/utils";
import { useAppSelector } from "@/redux/hooks";
import { IResumeByUser, ISkill, ISubscriber } from "@/types/backend";
import { Button, Form, Input, InputNumber, Modal, Select, Table, Tabs, message, notification } from "antd";
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
    const [subscriberForm] = Form.useForm();

    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [profileForm] = Form.useForm();

    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [passwordForm] = Form.useForm();

    const [userDetail, setUserDetail] = useState<any>(null);

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
            subscriberForm.setFieldValue(
                "skills",
                (subscriberRes.data.skills || []).map((item) => String(item.id))
            );
        } else {
            setSubscriber(null);
            subscriberForm.setFieldValue("skills", []);
        }

        setSkillLoading(false);
    };

    const fetchCurrentUserProfile = async () => {
        if (!user?.id) return;

        setProfileLoading(true);
        const res = await callFetchUserById(user.id);
        setProfileLoading(false);

        if (res?.data) {
            setUserDetail(res.data);
            profileForm.setFieldsValue({
                name: res.data.name,
                email: res.data.email,
                age: res.data.age,
                gender: res.data.gender,
                address: res.data.address,
            });
            return;
        }

        profileForm.setFieldsValue({
            name: user?.name,
            email: user?.email,
        });
    };

    useEffect(() => {
        if (!open) return;
        fetchResumeByUser(1, resumePageSize);
        setResumePage(1);
        passwordForm.resetFields();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (activeTab === "subscriber") {
            fetchSubscriberAndSkills();
        }
        if (activeTab === "profile" || activeTab === "password") {
            fetchCurrentUserProfile();
        }
    }, [open, activeTab]);

    const handleChangeResumePage = (page: number, pageSize: number) => {
        setResumePage(page);
        setResumePageSize(pageSize);
        fetchResumeByUser(page, pageSize);
    };

    const handleUpdateSubscriber = async () => {
        const selectedSkills = subscriberForm.getFieldValue("skills") as string[];
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

    const handleUpdateProfile = async () => {
        const values = await profileForm.validateFields();
        if (!user?.id) {
            message.error("Không tìm thấy thông tin người dùng.");
            return;
        }

        const payload = {
            id: String(user.id),
            email: values.email,
            name: values.name,
            age: Number(values.age),
            gender: values.gender,
            address: values.address,
            ...(userDetail?.role?.id ? { role: { id: userDetail.role.id } } : {}),
            ...(userDetail?.company?.id ? { company: { id: userDetail.company.id } } : {}),
        };

        setProfileSubmitting(true);
        const res = await callUpdateUser(payload as any);
        setProfileSubmitting(false);

        if (res?.data) {
            message.success("Cập nhật thông tin thành công.");
            fetchCurrentUserProfile();
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: res?.message || "Không thể cập nhật thông tin.",
            });
        }
    };

    const handleChangePassword = async () => {
        const values = await passwordForm.validateFields();
        if (values.newPassword !== values.confirmPassword) {
            message.error("Xác nhận mật khẩu không khớp.");
            return;
        }

        setPasswordSubmitting(true);
        setTimeout(() => {
            setPasswordSubmitting(false);
            notification.info({
                message: "Backend chưa hỗ trợ",
                description: "Hiện API chưa có endpoint đổi mật khẩu riêng. Mình đã chuẩn bị form FE, khi backend bổ sung endpoint sẽ nối ngay.",
            });
        }, 300);
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
                            <Form form={subscriberForm} layout="vertical">
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
                        children: (
                            <Form form={profileForm} layout="vertical" disabled={profileLoading}>
                                <Form.Item
                                    label="Tên hiển thị"
                                    name="name"
                                    rules={[{ required: true, message: "Vui lòng nhập tên hiển thị" }]}
                                >
                                    <Input placeholder="Nhập tên hiển thị" />
                                </Form.Item>

                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[{ required: true, message: "Vui lòng nhập email" }, { type: "email", message: "Email không hợp lệ" }]}
                                >
                                    <Input disabled />
                                </Form.Item>

                                <Form.Item
                                    label="Tuổi"
                                    name="age"
                                    rules={[{ required: true, message: "Vui lòng nhập tuổi" }]}
                                >
                                    <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập tuổi" />
                                </Form.Item>

                                <Form.Item
                                    label="Giới tính"
                                    name="gender"
                                    rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
                                >
                                    <Select
                                        placeholder="Chọn giới tính"
                                        options={[
                                            { label: "Nam", value: "MALE" },
                                            { label: "Nữ", value: "FEMALE" },
                                            { label: "Khác", value: "OTHER" },
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Địa chỉ"
                                    name="address"
                                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                                >
                                    <Input placeholder="Nhập địa chỉ" />
                                </Form.Item>

                                <Button type="primary" loading={profileSubmitting || profileLoading} onClick={handleUpdateProfile}>
                                    Cập nhật
                                </Button>
                            </Form>
                        ),
                    },
                    {
                        key: "password",
                        label: "Thay đổi mật khẩu",
                        children: (
                            <Form form={passwordForm} layout="vertical">
                                <Form.Item
                                    label="Mật khẩu hiện tại"
                                    name="currentPassword"
                                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                                >
                                    <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                                </Form.Item>

                                <Form.Item
                                    label="Mật khẩu mới"
                                    name="newPassword"
                                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới" }, { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]}
                                >
                                    <Input.Password placeholder="Nhập mật khẩu mới" />
                                </Form.Item>

                                <Form.Item
                                    label="Xác nhận mật khẩu mới"
                                    name="confirmPassword"
                                    rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới" }]}
                                >
                                    <Input.Password placeholder="Nhập lại mật khẩu mới" />
                                </Form.Item>

                                <Button type="primary" loading={passwordSubmitting} onClick={handleChangePassword}>
                                    Đổi mật khẩu
                                </Button>
                            </Form>
                        ),
                    },
                ]}
            />
        </Modal>
    );
};

export default AccountManageModal;
