import { ModalForm, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { callCreatePermission, callUpdatePermission } from "@/config/api";
import { IPermission } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IPermission | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const methodOptions = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
}

const moduleOptions = {
    AUTH: 'AUTH',
    COMPANY: 'COMPANY',
    USER: 'USER',
    JOB: 'JOB',
    RESUME: 'RESUME',
    PERMISSION: 'PERMISSION',
    ROLE: 'ROLE',
}

const ModalPermission = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();

    const submitPermission = async (valuesForm: IPermission) => {
        const { name, apiPath, method, module } = valuesForm;
        if (dataInit?.id) {
            const res = await callUpdatePermission({
                id: dataInit.id,
                name,
                apiPath,
                method,
                module,
            });
            if (res.data) {
                message.success("Cập nhật permission thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            const res = await callCreatePermission({
                name,
                apiPath,
                method,
                module,
            });
            if (res.data) {
                message.success("Thêm mới permission thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const handleReset = async () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    }

    return (
        <>
            <ModalForm
                title={<>{dataInit?.id ? "Cập nhật Permission" : "Tạo mới Permission"}</>}
                open={openModal}
                modalProps={{
                    onCancel: () => { handleReset() },
                    afterClose: () => handleReset(),
                    destroyOnClose: true,
                    width: isMobile ? "100%" : 700,
                    keyboard: false,
                    maskClosable: false,
                    okText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                    cancelText: "Hủy"
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={submitPermission}
                initialValues={dataInit?.id ? dataInit : { method: "GET" }}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <ProFormText
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập tên permission"
                        />
                    </Col>

                    <Col span={24}>
                        <ProFormText
                            label="API Path"
                            name="apiPath"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Ví dụ: /api/v1/users"
                        />
                    </Col>

                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormSelect
                            name="method"
                            label="Method"
                            valueEnum={methodOptions}
                            placeholder="Chọn method"
                            rules={[{ required: true, message: 'Vui lòng chọn method' }]}
                        />
                    </Col>

                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormSelect
                            name="module"
                            label="Module"
                            valueEnum={moduleOptions}
                            placeholder="Chọn module"
                            rules={[{ required: true, message: 'Vui lòng chọn module' }]}
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    )
}

export default ModalPermission;
