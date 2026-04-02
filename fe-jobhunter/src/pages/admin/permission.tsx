import ModalPermission from "@/components/admin/permission/modal.permission";
import DataTable from "@/components/client/data-table";
import { callDeletePermission } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchPermission } from "@/redux/slice/permissionSlide";
import { IPermission } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns, ProFormSelect } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, message, notification } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfIn, sfLike } from "spring-filter-query-builder";

const PermissionPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IPermission | null>(null);

    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.permission.isFetching);
    const meta = useAppSelector(state => state.permission.meta);
    const permissions = useAppSelector(state => state.permission.result);
    const dispatch = useAppDispatch();

    const handleDeletePermission = async (id: string | number | undefined) => {
        if (id) {
            const res = await callDeletePermission(id);
            if (res && +res.statusCode === 200) {
                message.success('Xóa Permission thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const reloadTable = () => {
        tableRef?.current?.reload();
    }

    const columns: ProColumns<IPermission>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 50,
            align: "center",
            render: (_text, _record, index) => {
                return (
                    <>
                        {(index + 1) + (meta.page - 1) * (meta.pageSize)}
                    </>)
            },
            hideInSearch: true,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            sorter: true,
        },
        {
            title: 'API Path',
            dataIndex: 'apiPath',
            sorter: true,
        },
        {
            title: 'Method',
            dataIndex: 'method',
            sorter: true,
            renderFormItem: () => (
                <ProFormSelect
                    showSearch
                    mode="multiple"
                    allowClear
                    valueEnum={{
                        GET: 'GET',
                        POST: 'POST',
                        PUT: 'PUT',
                        DELETE: 'DELETE',
                    }}
                    placeholder="Chọn method"
                />
            ),
        },
        {
            title: 'Module',
            dataIndex: 'module',
            sorter: true,
        },

        {
            title: 'CreatedAt',
            dataIndex: 'createdAt',
            width: 200,
            sorter: true,
            render: (_text, record) => {
                return (
                    <>{record.createdAt ? dayjs(record.createdAt).format('DD-MM-YYYY HH:mm:ss') : ""}</>
                )
            },
            hideInSearch: true,
        },
        {

            title: 'Actions',
            hideInSearch: true,
            width: 80,
            render: (_value, entity) => (
                <Space>
                    <EditOutlined
                        style={{
                            fontSize: 20,
                            color: '#ffa500',
                        }}
                        onClick={() => {
                            setOpenModal(true);
                            setDataInit(entity);
                        }}
                    />

                    <Popconfirm
                        placement="leftTop"
                        title={"Xác nhận xóa permission"}
                        description={"Bạn có chắc chắn muốn xóa permission này ?"}
                        onConfirm={() => handleDeletePermission(entity.id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <span style={{ cursor: "pointer", margin: "0 10px" }}>
                            <DeleteOutlined
                                style={{
                                    fontSize: 20,
                                    color: '#ff4d4f',
                                }}
                            />
                        </span>
                    </Popconfirm>
                </Space>
            ),

        },
    ];

    const buildQuery = (params: any, sort: any) => {
        const clone = { ...params };
        const q: any = {
            page: params.current,
            size: params.pageSize,
            filter: ""
        }

        let parts = [];
        if (clone.name) parts.push(`${sfLike("name", clone.name)}`);
        if (clone.apiPath) parts.push(`${sfLike("apiPath", clone.apiPath)}`);
        if (clone.module) parts.push(`${sfLike("module", clone.module)}`);
        if (clone?.method?.length) parts.push(`${sfIn("method", clone.method).toString()}`);
        q.filter = parts.join(' and ');

        if (!q.filter) delete q.filter;

        let temp = queryString.stringify(q);

        let sortBy = "";
        const fields = ["name", "apiPath", "method", "module", "createdAt"];
        if (sort) {
            for (const field of fields) {
                if (sort[field]) {
                    sortBy = `sort=${field},${sort[field] === 'ascend' ? 'asc' : 'desc'}`;
                    break;
                }
            }
        }

        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=createdAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    }

    return (
        <div>
            <DataTable<IPermission>
                actionRef={tableRef}
                headerTitle="Danh sách Permissions"
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={permissions}
                request={async (params, sort): Promise<any> => {
                    const query = buildQuery(params, sort);
                    dispatch(fetchPermission({ query }))
                }}
                scroll={{ x: true }}
                pagination={
                    {
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => { return (<div> {range[0]}-{range[1]} trên {total} rows</div>) }
                    }
                }
                rowSelection={false}
                toolBarRender={(): any => {
                    return (
                        <Button
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={() => setOpenModal(true)}
                        >
                            Thêm mới
                        </Button>
                    );
                }}
            />
            <ModalPermission
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    )
}

export default PermissionPage;
