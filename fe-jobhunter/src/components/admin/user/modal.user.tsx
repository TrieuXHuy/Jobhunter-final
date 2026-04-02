import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { callCreateUser, callFetchRole, callUpdateUser } from "@/config/api";
import { IRole, IUser } from "@/types/backend";
import { useEffect, useState } from "react";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

export interface ICompanySelect {
    label: string;
    value: string;
    key?: string;
}

const ModalUser = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

    const normalizeRoleValue = (role: unknown): string | undefined => {
        if (!role) return undefined;

        if (typeof role === 'object' && role !== null && 'id' in role) {
            return String((role as { id?: string | number }).id ?? '');
        }

        if (typeof role === 'string') {
            const roleByName = roleOptions.find((item) => item.label === role);
            return roleByName ? roleByName.value : role;
        }

        if (typeof role === 'object' && role !== null && 'name' in role) {
            const roleName = String((role as { name?: string }).name ?? '');
            const roleByName = roleOptions.find((item) => item.label === roleName);
            return roleByName ? roleByName.value : roleName;
        }

        return undefined;
    };

    useEffect(() => {
        //case update, initial data
        if (dataInit?.id) {
            form.setFieldsValue({
                ...dataInit,
                role: normalizeRoleValue(dataInit.role)
            })
        }
    }, [dataInit, roleOptions])

    useEffect(() => {
        const initRoles = async () => {
            const res = await callFetchRole('page=1&size=100');
            const roles = res?.data?.result ?? [];
            setRoleOptions(
                roles.map((role: IRole) => ({
                    label: role.name,
                    value: String(role.id),
                }))
            );
        };

        if (openModal) {
            initRoles();
        }
    }, [openModal]);

    const submitUser = async (valuesForm: any) => {
        const { name, email, password, address, age, gender, role } = valuesForm;
        const roleId = Number.isNaN(Number(role)) ? role : Number(role);
        const rolePayload = { id: roleId };

        if (dataInit?.id) {
            //update
            const user = {
                id: dataInit.id,
                name,
                email,
                password,
                age,
                gender,
                address,
                role: rolePayload,
            }

            const res = await callUpdateUser(user);
            if (res.data) {
                message.success("Cập nhật user thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            //create
            const user = {
                name,
                email,
                password,
                age,
                gender,
                address,
                role: rolePayload,
            }
            const res = await callCreateUser(user);
            if (res.data) {
                message.success("Thêm mới user thành công");
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
                title={<>{dataInit?.id ? "Cập nhật User" : "Tạo mới User"}</>}
                open={openModal}
                modalProps={{
                    onCancel: () => { handleReset() },
                    afterClose: () => handleReset(),
                    destroyOnClose: true,
                    width: isMobile ? "100%" : 900,
                    keyboard: false,
                    maskClosable: false,
                    okText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                    cancelText: "Hủy"
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={submitUser}
                initialValues={dataInit?.id ? dataInit : {}}
            >
                <Row gutter={16}>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng không bỏ trống' },
                                { type: 'email', message: 'Vui lòng nhập email hợp lệ' }
                            ]}
                            placeholder="Nhập email"
                        />
                    </Col>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText.Password
                            disabled={dataInit?.id ? true : false}
                            label="Password"
                            name="password"
                            rules={[{ required: dataInit?.id ? false : true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập password"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormText
                            label="Tên hiển thị"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập tên hiển thị"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormDigit
                            label="Tuổi"
                            name="age"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập nhập tuổi"
                        />
                    </Col>
                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormSelect
                            name="gender"
                            label="Giới Tính"
                            valueEnum={{
                                MALE: 'Nam',
                                FEMALE: 'Nữ',
                                OTHER: 'Khác',
                            }}
                            placeholder="Chọn giới tính"
                            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                        />
                    </Col>

                    <Col lg={6} md={6} sm={24} xs={24}>
                        <ProFormSelect
                            name="role"
                            label="Vai trò"
                            placeholder="Chọn vai trò"
                            options={roleOptions}
                            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                        />
                    </Col>

                    <Col lg={24} md={24} sm={24} xs={24}>
                        <ProFormText
                            label="Địa chỉ"
                            name="address"
                            rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                            placeholder="Nhập địa chỉ"
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    )
}

export default ModalUser;
