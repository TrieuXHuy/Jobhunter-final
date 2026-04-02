import { ModalForm, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { callCreateRole, callFetchPermission, callFetchRoleById, callUpdateRole } from "@/config/api";
import { IPermission, IRole } from "@/types/backend";
import { Card, Col, Collapse, Empty, Form, Row, Space, Spin, Switch, Tag, Typography, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { useEffect, useMemo, useState } from "react";
import queryString from "query-string";
import styles from "./modal.role.module.scss";

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

        Object.keys(groups).forEach((moduleName) => {
            groups[moduleName] = groups[moduleName].sort((a, b) => {
                const methodCompare = (a.method || "").localeCompare(b.method || "");
                if (methodCompare !== 0) return methodCompare;
                return (a.name || "").localeCompare(b.name || "");
            });
        });

        return groups;
    }, [permissions]);

    const orderedModuleNames = useMemo(() => {
        return Object.keys(groupedPermissions).sort((a, b) => a.localeCompare(b));
    }, [groupedPermissions]);

    const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

    const resolveMethodColor = (method: string) => {
        switch ((method || "").toUpperCase()) {
            case "GET":
                return "blue";
            case "POST":
                return "green";
            case "PUT":
                return "orange";
            case "DELETE":
                return "red";
            case "PATCH":
                return "purple";
            default:
                return "default";
        }
    };

    const togglePermission = (permissionId: string, checked: boolean) => {
        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(permissionId);
            } else {
                next.delete(permissionId);
            }
            return Array.from(next);
        });
    };

    const toggleModule = (moduleName: string, checked: boolean) => {
        const modulePermissions = groupedPermissions[moduleName] || [];
        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            modulePermissions.forEach((permission) => {
                const id = String(permission.id);
                if (checked) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
            });
            return Array.from(next);
        });
    };

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
                title={<>{dataInit?.id ? "Cập nhật vai trò" : "Tạo mới vai trò"}</>}
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
                                label="Tên vai trò"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                placeholder="Nhập tên vai trò"
                            />
                        </Col>
                        <Col span={24}>
                            <ProFormTextArea
                                label="Mô tả"
                                name="description"
                                placeholder="Nhập mô tả vai trò"
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
                            <Form.Item label="Danh sách Permission" className={styles.permissionBlock}>
                                <div className={styles.permissionSummary}>
                                    <Typography.Text type="secondary">
                                        Đã chọn {selectedPermissionIds.length}/{permissions.length} quyền
                                    </Typography.Text>
                                </div>

                                {orderedModuleNames.length === 0 ? (
                                    <Empty description="Chưa có permission" />
                                ) : (
                                    <Collapse
                                        className={styles.permissionCollapse}
                                        defaultActiveKey={orderedModuleNames}
                                        ghost
                                    >
                                        {orderedModuleNames.map((moduleName) => {
                                            const modulePermissions = groupedPermissions[moduleName] || [];
                                            const checkedCount = modulePermissions.filter((permission) => {
                                                return selectedPermissionSet.has(String(permission.id));
                                            }).length;
                                            const allChecked = modulePermissions.length > 0 && checkedCount === modulePermissions.length;

                                            return (
                                                <Collapse.Panel
                                                    key={moduleName}
                                                    header={
                                                        <div className={styles.moduleHeader}>
                                                            <div>
                                                                <Typography.Text strong>{moduleName}</Typography.Text>
                                                                <Typography.Text type="secondary" className={styles.moduleHint}>
                                                                    {checkedCount}/{modulePermissions.length} quyền
                                                                </Typography.Text>
                                                            </div>

                                                            <div
                                                                onClick={(event) => event.stopPropagation()}
                                                                className={styles.moduleSwitch}
                                                            >
                                                                <Switch
                                                                    checked={allChecked}
                                                                    onChange={(checked) => toggleModule(moduleName, checked)}
                                                                />
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <Row gutter={[12, 12]}>
                                                        {modulePermissions.map((permission) => {
                                                            const permissionId = String(permission.id);
                                                            const checked = selectedPermissionSet.has(permissionId);

                                                            return (
                                                                <Col xs={24} md={12} key={permissionId}>
                                                                    <Card size="small" className={styles.permissionCard}>
                                                                        <Space direction="vertical" size={6} style={{ width: "100%" }}>
                                                                            <div className={styles.permissionTitleRow}>
                                                                                <Typography.Text strong>
                                                                                    {permission.name}
                                                                                </Typography.Text>
                                                                                <Switch
                                                                                    size="small"
                                                                                    checked={checked}
                                                                                    onChange={(isChecked) => togglePermission(permissionId, isChecked)}
                                                                                />
                                                                            </div>

                                                                            <Space size={8} wrap>
                                                                                <Tag color={resolveMethodColor(permission.method)}>
                                                                                    {(permission.method || "").toUpperCase()}
                                                                                </Tag>
                                                                                <Typography.Text type="secondary" className={styles.apiPath}>
                                                                                    {permission.apiPath}
                                                                                </Typography.Text>
                                                                            </Space>
                                                                        </Space>
                                                                    </Card>
                                                                </Col>
                                                            );
                                                        })}
                                                    </Row>
                                                </Collapse.Panel>
                                            );
                                        })}
                                    </Collapse>
                                )}
                            </Form.Item>
                        </Col>
                    </Row>
                </Spin>
            </ModalForm>
        </>
    )
}

export default ModalRole;
