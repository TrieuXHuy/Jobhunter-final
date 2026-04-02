import { IResumeByUser } from '@/types/backend';
import { Empty, List, Modal, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

interface IProps {
    open: boolean;
    onClose: () => void;
    notifications: IResumeByUser[];
    loading?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'green';
        case 'REJECTED':
            return 'red';
        case 'REVIEWING':
            return 'blue';
        default:
            return 'default';
    }
};

const NotificationsModal = ({ open, onClose, notifications, loading = false }: IProps) => {
    return (
        <Modal
            title="Thông báo"
            open={open}
            onCancel={onClose}
            footer={null}
            width={720}
            destroyOnClose
        >
            <List
                loading={loading}
                locale={{ emptyText: <Empty description="Chưa có thông báo" /> }}
                dataSource={notifications}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Typography.Text strong>
                                        CV cho job {item?.job?.name ?? 'N/A'}
                                    </Typography.Text>
                                    <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                                </div>
                            }
                            description={
                                <div>
                                    <Typography.Text type="secondary">
                                        Công ty: {item.companyName || 'N/A'}
                                    </Typography.Text>
                                    <br />
                                    <Typography.Text type="secondary">
                                        Cập nhật lúc: {item.updatedAt ? dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '--'}
                                    </Typography.Text>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default NotificationsModal;
