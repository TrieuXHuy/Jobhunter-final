import { ModalForm, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { callCreateRole, callFetchPermission, callFetchRoleById, callUpdateRole } from "@/config/api";
import { IPermission, IRole } from "@/types/backend";
import { Col, Divider, Form, Row, Spin, Empty, Tree, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { useEffect, useMemo, useState } from "react";
import queryString from "query-string";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IRole | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalRole = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();

    const [isLoadingPermission, setIsLoadingPermission] = useState<boolean>(false);
    const [isLoadingRoleDetail, setIsLoadingRoleDetail] = useState<boolean>(false);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, IPermission[]> = {};
        permissions.forEach((p) => {
            const moduleName = p.module || "OTHER";
            if (!groups[moduleName]) groups[moduleName] = [];
            groups[moduleName].push(p);
        });
        return groups;
    }, [permissions]);

    const permissionTreeData = useMemo(() => {
        return Object.keys(groupedPermissions).reduce((acc, moduleName) => {
            acc.push({
                key: `module-${moduleName}`,
                title: moduleName,
                selectable: false,
                children: groupedPermissions[moduleName].map((p) => ({
                    key: String(p.id),
                    title: `${p.name} (${p.method} ${p.apiPath})`,
                }))
            })
            return acc;
        }, [] as any[]);
    }, [groupedPermissions]);

    useEffect(() => {
        const init = async () => {
            if (!openModal) return;

            setIsLoadingPermission(true);
            const query = queryString.stringify({ page: 1, size: 1000, sort: 'module,asc' });
            const resPermission = await callFetchPermission(query);
            if (resPermission?.data?.result) {
                setPermissions(resPermission.data.result);
            } else {
                setPermissions([]);
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: resPermission?.message || 'Không tải được danh sách permission',
                });
            }
            setIsLoadingPermission(false);

            if (dataInit?.id) {
                setIsLoadingRoleDetail(true);
                const resRole = await callFetchRoleById(dataInit.id);
                if (resRole?.data) {
                    const role = resRole.data;
                    form.setFieldsValue({
                        name: role.name,
                        description: role.description,
                        active: role.active,
                    });
                    setSelectedPermissionIds((role.permissions || []).map((p) => String(p.id)));
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: resRole?.message || 'Không tải được thông tin role',
                    });
                }
                setIsLoadingRoleDetail(false);
            } else {
                form.setFieldsValue({ active: true });
                setSelectedPermissionIds([]);
            }
        }

        init();
    }, [openModal, dataInit?.id]);

    const submitRole = async (valuesForm: any) => {
        const { name, description, active } = valuesForm;
        if (!selectedPermissionIds.length) {
            message.error('Vui lòng chọn ít nhất một permission');
            return false;
        }
        const selectedPermissions = selectedPermissionIds.map((id) => ({ id: Number(id) }));

        if (dataInit?.id) {
            const res = await callUpdateRole({
                id: dataInit.id,
                name,
                description,
                active,
                permissions: selectedPermissions,
            });
            if (res.data) {
                message.success("Cập nhật role thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            const res = await callCreateRole({
                name,
                description,
                active,
                permissions: selectedPermissions,
            });
            if (res.data) {
                message.success("Thêm mới role thành công");
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
        setSelectedPermissionIds([]);
        setOpenModal(false);
    }

    const isLoading = isLoadingPermission || isLoadingRoleDetail;

    return (
        <>
            <ModalForm
                title={<>{dataInit?.id ? "Cập nhật Role" : "Tạo mới Role"}</>}
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
                onFinish={submitRole}
                initialValues={dataInit?.id ? dataInit : { active: true }}
            >
                <Spin spinning={isLoading}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <ProFormText
                                label="Name"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                placeholder="Nhập tên role"
                            />
                        </Col>
                        <Col span={24}>
                            <ProFormTextArea
                                label="Description"
                                name="description"
                                placeholder="Nhập mô tả role"
                                fieldProps={{ autoSize: { minRows: 3 } }}
                            />
                        </Col>

                        <Col span={24}>
                            <ProFormSwitch
                                name="active"
                                label="Kích hoạt"
                            />
                        </Col>

                        <Col span={24}>
                            <Divider orientation="left" style={{ marginTop: 0 }}>Danh sách Permission</Divider>
                            <Form.Item>
                                <div>
                                    {permissionTreeData.length === 0 ? (
                                        <Empty description="Chưa có permission" />
                                    ) : (
                                        <Tree
                                            checkable
                                            defaultExpandAll
                                            checkedKeys={selectedPermissionIds}
                                            treeData={permissionTreeData}
                                            onCheck={(checkedKeysValue) => {
                                                const keys = Array.isArray(checkedKeysValue)
                                                    ? checkedKeysValue
                                                    : checkedKeysValue.checked;
                                                setSelectedPermissionIds(
                                                    keys
                                                        .map((x) => String(x))
                                                        .filter((x) => !x.startsWith('module-'))
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>
                </Spin>
            </ModalForm>
        </>
    )
}

export default ModalRole;
