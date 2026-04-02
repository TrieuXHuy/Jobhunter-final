import { callUpdateResumeStatus } from "@/config/api";
import axios from "@/config/axios-customize";
import { IResume } from "@/types/backend";
import { Button, Descriptions, Drawer, Form, Select, Space, Typography, message, notification } from "antd";
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
const { Option } = Select;

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IResume | null | any;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}
const ViewDetailResume = (props: IProps) => {
    const [isSubmit, setIsSubmit] = useState<boolean>(false);
    const [isHandlingCv, setIsHandlingCv] = useState<boolean>(false);
    const { onClose, open, dataInit, setDataInit, reloadTable } = props;
    const [form] = Form.useForm();

    const resolveResumeFileName = (rawUrl?: string) => {
        if (!rawUrl) return "";

        const trimmed = rawUrl.trim();
        if (/^https?:\/\//i.test(trimmed)) {
            try {
                const parsed = new URL(trimmed);
                const queryFile = parsed.searchParams.get('fileName');
                if (queryFile) return queryFile;
                const segments = parsed.pathname.split('/').filter(Boolean);
                return segments.length > 0 ? segments[segments.length - 1] : "";
            } catch {
                return "";
            }
        }

        if (trimmed.includes('fileName=')) {
            try {
                const query = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
                const queryParams = new URLSearchParams(query);
                const queryFile = queryParams.get('fileName');
                return queryFile || "";
            } catch {
                return "";
            }
        }

        if (trimmed.startsWith('/storage/')) {
            const segments = trimmed.split('/').filter(Boolean);
            return segments.length > 0 ? segments[segments.length - 1] : "";
        }

        return trimmed;
    };

    const getFileExtension = (fileName?: string) => {
        if (!fileName) return "";
        const segments = fileName.split('.');
        return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : "";
    };

    const resumeFileName = resolveResumeFileName(dataInit?.url);
    const previewUrl = resumeFileName
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/files/preview?fileName=${encodeURIComponent(resumeFileName)}&folder=resume`
        : "";
    const downloadUrl = resumeFileName
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/files?fileName=${encodeURIComponent(resumeFileName)}&folder=resume`
        : "";
    const previewableExtensions = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt']);
    const isPreviewableInBrowser = previewableExtensions.has(getFileExtension(resumeFileName));

    const handlePreviewCv = async () => {
        if (!previewUrl) return;

        if (!isPreviewableInBrowser) {
            notification.info({
                message: 'Định dạng này không hỗ trợ xem trực tiếp',
                description: 'File Word thường không preview trực tiếp trên trình duyệt. Hệ thống sẽ tải CV về máy để bạn mở bằng Office.',
            });
            await handleDownloadCv();
            return;
        }

        try {
            setIsHandlingCv(true);
            const blob = await axios.get(previewUrl, { responseType: 'blob' as any });
            const objectUrl = window.URL.createObjectURL(blob as Blob);
            window.open(objectUrl, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30000);
        } catch (error) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: 'Không thể mở CV. Vui lòng thử lại.',
            });
        } finally {
            setIsHandlingCv(false);
        }
    };

    const handleDownloadCv = async () => {
        if (!downloadUrl) return;
        try {
            setIsHandlingCv(true);
            const blob = await axios.get(downloadUrl, { responseType: 'blob' as any });
            const objectUrl = window.URL.createObjectURL(blob as Blob);
            const anchor = document.createElement('a');
            anchor.href = objectUrl;
            anchor.download = resumeFileName || 'resume-file';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: 'Không thể tải CV. Vui lòng thử lại.',
            });
        } finally {
            setIsHandlingCv(false);
        }
    };

    const handleChangeStatus = async () => {
        setIsSubmit(true);

        const status = form.getFieldValue('status');
        const res = await callUpdateResumeStatus(dataInit?.id, status)
        if (res.data) {
            message.success("Update Resume status thành công!");
            setDataInit(null);
            onClose(false);
            reloadTable();
        } else {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: res.message
            });
        }

        setIsSubmit(false);
    }

    useEffect(() => {
        if (dataInit) {
            form.setFieldValue("status", dataInit.status)
        }
        return () => form.resetFields();
    }, [dataInit])

    return (
        <>
            <Drawer
                title="Thông Tin Resume"
                placement="right"
                onClose={() => { onClose(false); setDataInit(null) }}
                open={open}
                width={"40vw"}
                maskClosable={false}
                destroyOnClose
                extra={

                    <Button loading={isSubmit} type="primary" onClick={handleChangeStatus}>
                        Change Status
                    </Button>

                }
            >
                <Descriptions title="" bordered column={2} layout="vertical">
                    <Descriptions.Item label="Email">{dataInit?.email}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Form
                            form={form}
                        >
                            <Form.Item name={"status"}>
                                <Select
                                    // placeholder="Select a option and change input text above"
                                    // onChange={onGenderChange}
                                    // allowClear
                                    style={{ width: "100%" }}
                                    defaultValue={dataInit?.status}
                                >
                                    <Option value="PENDING">PENDING</Option>
                                    <Option value="REVIEWING">REVIEWING</Option>
                                    <Option value="APPROVED">APPROVED</Option>
                                    <Option value="REJECTED">REJECTED</Option>
                                </Select>
                            </Form.Item>
                        </Form>

                    </Descriptions.Item>
                    <Descriptions.Item label="Tên Job">
                        {dataInit?.job?.name}

                    </Descriptions.Item>
                    <Descriptions.Item label="Tên Công Ty">
                        {dataInit?.companyName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{dataInit && dataInit.createdAt ? dayjs(dataInit.createdAt).format('DD-MM-YYYY HH:mm:ss') : ""}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sửa">{dataInit && dataInit.updatedAt ? dayjs(dataInit.updatedAt).format('DD-MM-YYYY HH:mm:ss') : ""}</Descriptions.Item>

                    <Descriptions.Item label="CV" span={2}>
                        {previewUrl ? (
                            <Space direction="vertical" size={8}>
                                <Space>
                                    <Button type="primary" loading={isHandlingCv} onClick={handlePreviewCv}>
                                        Xem CV
                                    </Button>
                                    <Button loading={isHandlingCv} onClick={handleDownloadCv}>
                                        Tải CV
                                    </Button>
                                </Space>
                                <Typography.Text type="secondary" copyable>
                                    {previewUrl}
                                </Typography.Text>
                            </Space>
                        ) : (
                            <Typography.Text type="secondary">Chưa có file CV</Typography.Text>
                        )}
                    </Descriptions.Item>

                </Descriptions>
            </Drawer>
        </>
    )
}

export default ViewDetailResume;