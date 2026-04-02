import { useState, useEffect } from 'react';
import { LogoutOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Avatar, Badge, Drawer, Dropdown, MenuProps, Space, message } from 'antd';
import { Menu, ConfigProvider } from 'antd';
import styles from '@/styles/client.module.scss';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callFetchResumeByUser, callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { hasAnyAdminPermission } from '@/config/permission';
import AccountManageModal from './modal/manage.account.modal';
import NotificationsModal from './modal/notifications.modal';
import { IResumeByUser } from '@/types/backend';

const Header = (props: any) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const canAccessAdmin = hasAnyAdminPermission(user);
    const [openMobileMenu, setOpenMobileMenu] = useState<boolean>(false);
    const [openAccountModal, setOpenAccountModal] = useState<boolean>(false);
    const [openNotificationModal, setOpenNotificationModal] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<IResumeByUser[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoadingNotification, setIsLoadingNotification] = useState<boolean>(false);

    const [current, setCurrent] = useState('home');
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/' || location.pathname.startsWith('/auth')) {
            setCurrent('/');
            return;
        }

        if (location.pathname.startsWith('/company')) {
            setCurrent('/company');
            return;
        }

        if (location.pathname.startsWith('/job/saved')) {
            setCurrent('/job/saved');
            return;
        }

        if (location.pathname.startsWith('/job')) {
            setCurrent('/job');
            return;
        }

        setCurrent(location.pathname);
    }, [location])

    const items: MenuProps['items'] = [
        {
            label: <Link to={'/'}>Trang Chủ</Link>,
            key: '/',
        },
        {
            label: <Link to={'/company'}>Top Công ty</Link>,
            key: '/company',
        },
        {
            label: <Link to={'/job'}>Việc Làm</Link>,
            key: '/job',
        }
    ];



    const onClick: MenuProps['onClick'] = (e) => {
        console.log('click ', e);
        setCurrent(e.key);
    };

    const getNotificationReadStorageKey = () => {
        return `resume_notification_read_at_${user?.id || 'anonymous'}`;
    };

    const markNotificationsAsRead = () => {
        localStorage.setItem(getNotificationReadStorageKey(), new Date().toISOString());
        setUnreadCount(0);
    };

    const fetchResumeNotifications = async (showLoading = false) => {
        if (!isAuthenticated || !user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        if (showLoading) {
            setIsLoadingNotification(true);
        }

        try {
            const res = await callFetchResumeByUser('page=1&size=20&sort=updatedAt,desc');
            const items = (res?.data?.result || []).filter((item) => item.status && item.status !== 'PENDING');
            setNotifications(items);

            const lastRead = localStorage.getItem(getNotificationReadStorageKey());
            const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
            const unread = items.filter((item) => {
                if (!item.updatedAt) return false;
                return new Date(item.updatedAt).getTime() > lastReadTime;
            }).length;
            setUnreadCount(unread);
        } finally {
            if (showLoading) {
                setIsLoadingNotification(false);
            }
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchResumeNotifications(true);
        const intervalId = window.setInterval(() => {
            fetchResumeNotifications(false);
        }, 15000);

        return () => window.clearInterval(intervalId);
    }, [isAuthenticated, user?.id]);

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && +res.statusCode === 200) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/')
        }
    }

    const itemsDropdown: NonNullable<MenuProps['items']> = [
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => {
                    setOpenNotificationModal(true);
                    markNotificationsAsRead();
                }}
            >Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}</label>,
            key: 'notifications',
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenAccountModal(true)}
            >Quản lý tài khoản</label>,
            key: 'manage-account',
        },
        {
            label: <Link to={'/job/saved'}>Job đã lưu</Link>,
            key: '/job/saved',
        },
        canAccessAdmin ? {
            label: <Link to={'/admin'}>Trang quản trị</Link>,
            key: 'admin',
        } : null,
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
            icon: <LogoutOutlined />
        },
    ].filter(Boolean) as NonNullable<MenuProps['items']>;

    const itemsMobiles = [...items, ...itemsDropdown];

    return (
        <>
            <div className={styles["header-section"]}>
                <div className={styles["container"]}>
                    {!isMobile ?
                        <div className={styles['desktopHeader']}>
                            <div className={styles['top-menu']}>
                                <ConfigProvider
                                    theme={{
                                        token: {
                                            colorPrimary: '#ffffff',
                                            colorBgContainer: 'transparent',
                                            colorText: '#d4d4d8',
                                        },
                                    }}
                                >

                                    <Menu
                                        selectedKeys={[current]}
                                        mode="horizontal"
                                        items={items}
                                        className={styles['mainNav']}
                                    />
                                </ConfigProvider>
                                <div className={styles['extraActions']}>
                                    <button className={styles['headerGhostBtn']} type="button">Tuyển dụng vị trí cao cấp</button>
                                    <button className={styles['headerGhostBtn']} type="button">Dành cho Nhà Tuyển Dụng</button>

                                    {isAuthenticated === false ?
                                        <div className={styles['authLinks']}>
                                            <Link to={'/login'}>Đăng Nhập</Link>
                                            <span className={styles['langSwitch']}>EN | VI</span>
                                        </div>
                                        :
                                        <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                            <Space className={styles['userDropdown']}>
                                                <Badge count={unreadCount} size="small" overflowCount={9}>
                                                    <Avatar style={{ backgroundColor: '#e11d48', color: '#ffffff' }}>
                                                        {user?.name?.substring(0, 2)?.toUpperCase()}
                                                    </Avatar>
                                                </Badge>
                                            </Space>
                                        </Dropdown>
                                    }
                                </div>

                            </div>
                        </div>
                        :
                        <div className={styles['header-mobile']}>
                            <span>Your APP</span>
                            <MenuFoldOutlined onClick={() => setOpenMobileMenu(true)} />
                        </div>
                    }
                </div>
            </div>
            <Drawer title="Chức năng"
                placement="right"
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu}
            >
                <Menu
                    onClick={onClick}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={itemsMobiles}
                />
            </Drawer>
            <AccountManageModal
                open={openAccountModal}
                onClose={() => setOpenAccountModal(false)}
            />
            <NotificationsModal
                open={openNotificationModal}
                onClose={() => setOpenNotificationModal(false)}
                notifications={notifications}
                loading={isLoadingNotification}
            />
        </>
    )
};

export default Header;