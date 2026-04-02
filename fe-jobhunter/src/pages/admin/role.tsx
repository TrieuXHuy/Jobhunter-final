import ModalRole from "@/components/admin/role/modal.role";
import DataTable from "@/components/client/data-table";
import { callDeleteRole } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchRole } from "@/redux/slice/roleSlide";
import { IRole } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag, message, notification } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { useRef, useState } from "react";
import { sfLike } from "spring-filter-query-builder";

const RolePage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IRole | null>(null);

    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.role.isFetching);
    const meta = useAppSelector(state => state.role.meta);
    const roles = useAppSelector(state => state.role.result);
    const dispatch = useAppDispatch();

    const handleDeleteRole = async (id: string | number | undefined) => {
        if (id) {
            const res = await callDeleteRole(id);
            if (res && +res.statusCode === 200) {
                message.success('Xóa Role thành công');
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

    const columns: ProColumns<IRole>[] = [
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
            title: 'Description',
            dataIndex: 'description',
            sorter: true,
        },
        {
            title: 'Active',
            dataIndex: 'active',
            hideInSearch: true,
            render: (_dom, entity) => (
                <Tag color={entity.active ? 'lime' : 'red'}>
                    {entity.active ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
            ),
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
                        title={"Xác nhận xóa role"}
                        description={"Bạn có chắc chắn muốn xóa role này ?"}
                        onConfirm={() => handleDeleteRole(entity.id)}
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
        if (clone.description) parts.push(`${sfLike("description", clone.description)}`);
        q.filter = parts.join(' and ');

        if (!q.filter) delete q.filter;

        let temp = queryString.stringify(q);

        let sortBy = "";
        const fields = ["name", "description", "createdAt"];
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
            <DataTable<IRole>
                actionRef={tableRef}
                headerTitle="Danh sách Roles"
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={roles}
                request={async (params, sort): Promise<any> => {
                    const query = buildQuery(params, sort);
                    dispatch(fetchRole({ query }))
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
            <ModalRole
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    )
}

export default RolePage;
