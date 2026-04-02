import { useAppSelector } from "@/redux/hooks";
import { IJob } from "@/types/backend";
import { ProForm, ProFormText } from "@ant-design/pro-components";
import { Button, Col, ConfigProvider, Divider, Modal, Row, Upload, message, notification } from "antd";
import { useNavigate } from "react-router-dom";
import enUS from 'antd/lib/locale/en_US';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { callCreateResume, callUploadSingleFile } from "@/config/api";
import { useState } from 'react';

interface IProps {
    isModalOpen: boolean;
    setIsModalOpen: (v: boolean) => void;
    jobDetail: IJob | null;
}

const ApplyModal = (props: IProps) => {
    const { isModalOpen, setIsModalOpen, jobDetail } = props;
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const [urlCV, setUrlCV] = useState<string>("");
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [uploadingCV, setUploadingCV] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleOkButton = async () => {
        if (!cvFile && !urlCV && isAuthenticated) {
            message.error("Vui lòng upload CV!");
            return;
        }

        if (!isAuthenticated) {
            setIsModalOpen(false);
            navigate(`/login?callback=${window.location.href}`)
        }
        else {
            //todo
            if (jobDetail) {
                let uploadedCvUrl = urlCV;

                if (cvFile) {
                    setUploadingCV(true);
                    const uploadRes = await callUploadSingleFile(cvFile, "resume");
                    setUploadingCV(false);

                    if (!uploadRes?.data?.fileName) {
                        notification.error({
                            message: 'Có lỗi xảy ra',
                            description: uploadRes?.message ?? 'Upload CV thất bại.'
                        });
                        return;
                    }

                    uploadedCvUrl = uploadRes.data.fileName;
                    setUrlCV(uploadedCvUrl);
                }

                const res = await callCreateResume(uploadedCvUrl, jobDetail?.id, user.email, user.id);
                if (res.data) {
                    message.success("Rải CV thành công!");
                    setCvFile(null);
                    setUrlCV("");
                    setIsModalOpen(false);
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res.message
                    });
                }
            }
        }
    }

    const propsUpload: UploadProps = {
        maxCount: 1,
        multiple: false,
        accept: "application/pdf,application/msword, .doc, .docx, .pdf",
        beforeUpload(file) {
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            const isAllowedType = allowedTypes.includes(file.type);
            if (!isAllowedType) {
                message.error('Chỉ hỗ trợ file .doc, .docx, .pdf');
                return Upload.LIST_IGNORE;
            }

            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('File phải nhỏ hơn 5MB');
                return Upload.LIST_IGNORE;
            }

            return false;
        },
        onChange(info) {
            const selectedFile = info?.fileList?.[0];
            if (!selectedFile) {
                setCvFile(null);
                setUrlCV("");
                return;
            }

            if (selectedFile.originFileObj) {
                setCvFile(selectedFile.originFileObj as File);
                setUrlCV("");
            }
        },
        onRemove() {
            setCvFile(null);
            setUrlCV("");
        }
    };


    return (
        <>
            <Modal title="Ứng Tuyển Job"
                open={isModalOpen}
                onOk={() => handleOkButton()}
                onCancel={() => {
                    setCvFile(null);
                    setUrlCV("");
                    setIsModalOpen(false)
                }}
                maskClosable={false}
                confirmLoading={uploadingCV}
                okText={isAuthenticated ? "Rải CV Nào " : "Đăng Nhập Nhanh"}
                cancelButtonProps={
                    { style: { display: "none" } }
                }
                destroyOnClose={true}
            >
                <Divider />
                {isAuthenticated ?
                    <div>
                        <ConfigProvider locale={enUS}>
                            <ProForm
                                submitter={{
                                    render: () => <></>
                                }}
                            >
                                <Row gutter={[10, 10]}>
                                    <Col span={24}>
                                        <div>
                                            Bạn đang ứng tuyển công việc <b>{jobDetail?.name} </b>tại  <b>{jobDetail?.company?.name}</b>
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <ProFormText
                                            fieldProps={{
                                                type: "email"
                                            }}
                                            label="Email"
                                            name={"email"}
                                            labelAlign="right"
                                            disabled
                                            initialValue={user?.email}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProForm.Item
                                            label={"Upload file CV"}
                                            rules={[{ required: true, message: 'Vui lòng upload file!' }]}
                                        >

                                            <Upload {...propsUpload}>
                                                <Button icon={<UploadOutlined />}>Tải lên CV của bạn ( Hỗ trợ *.doc, *.docx, *.pdf, and &lt; 5MB )</Button>
                                            </Upload>
                                        </ProForm.Item>
                                    </Col>
                                </Row>

                            </ProForm>
                        </ConfigProvider>
                    </div>
                    :
                    <div>
                        Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập để có thể "Rải CV" bạn nhé -.-
                    </div>
                }
                <Divider />
            </Modal>
        </>
    )
}
export default ApplyModal;
