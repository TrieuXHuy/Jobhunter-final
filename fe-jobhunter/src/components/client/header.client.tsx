import { useState, useEffect } from 'react';
import { LogoutOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Avatar, Drawer, Dropdown, MenuProps, Space, message } from 'antd';
import { Menu, ConfigProvider } from 'antd';
import styles from '@/styles/client.module.scss';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { hasAnyAdminPermission } from '@/config/permission';
import AccountManageModal from './modal/manage.account.modal';

const Header = (props: any) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const canAccessAdmin = hasAnyAdminPermission(user);
    const [openMobileMenu, setOpenMobileMenu] = useState<boolean>(false);
    const [openAccountModal, setOpenAccountModal] = useState<boolean>(false);

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
                onClick={() => setOpenAccountModal(true)}
            >Quản lý tài khoản</label>,
            key: 'manage-account',
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
                            <div className={styles['brand']} onClick={() => navigate('/')}>
                                <span className={styles['brandIcon']}>it</span>
                                <span className={styles['brandText']}>IT</span>
                            </div>
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
                                                <Avatar style={{ backgroundColor: '#e11d48', color: '#ffffff' }}>
                                                    {user?.name?.substring(0, 2)?.toUpperCase()}
                                                </Avatar>
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
        </>
    )
};

export default Header;