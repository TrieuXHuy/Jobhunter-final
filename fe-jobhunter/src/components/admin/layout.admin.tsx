import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    BankOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AliwangwangOutlined,
    LogoutOutlined,
    HeartTwoTone,
    BugOutlined,
    ScheduleOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { callLogout } from 'config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isMobile } from 'react-device-detect';
import type { MenuProps } from 'antd';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { hasAnyAdminPermission, hasModulePermission } from '@/config/permission';

const { Content, Footer, Sider } = Layout;



const LayoutAdmin = () => {
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');
    const user = useAppSelector(state => state.account.user);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const canViewCompany = hasModulePermission(user, 'COMPANY');
    const canViewUser = hasModulePermission(user, 'USER');
    const canViewJob = hasModulePermission(user, 'JOB');
    const canViewResume = hasModulePermission(user, 'RESUME');
    const canViewPermission = hasModulePermission(user, 'PERMISSION');
    const canViewRole = hasModulePermission(user, 'ROLE');
    const canViewDashboard = hasAnyAdminPermission(user);

    useEffect(() => {
        setActiveMenu(location.pathname)
    }, [location])

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && +res.statusCode === 200) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/')
        }
    }

    const items: MenuProps['items'] = [
        canViewDashboard ? {
            label: <Link to='/admin'>Dashboard</Link>,
            key: '/admin',
            icon: <AppstoreOutlined />
        } : null,
        canViewCompany ? {
            label: <Link to='/admin/company'>Company</Link>,
            key: '/admin/company',
            icon: <BankOutlined />,
        } : null,
        canViewUser ? {
            label: <Link to='/admin/user'>User</Link>,
            key: '/admin/user',
            icon: <UserOutlined />
        } : null,
        canViewJob ? {
            label: <Link to='/admin/job'>Job</Link>,
            key: '/admin/job',
            icon: <ScheduleOutlined />
        } : null,
        canViewResume ? {
            label: <Link to='/admin/resume'>Resume</Link>,
            key: '/admin/resume',
            icon: <AliwangwangOutlined />
        } : null,
        canViewPermission ? {
            label: <Link to='/admin/permission'>Permission</Link>,
            key: '/admin/permission',
            icon: <ApiOutlined />
        } : null,
        canViewRole ? {
            label: <Link to='/admin/role'>Role</Link>,
            key: '/admin/role',
            icon: <ExceptionOutlined />
        } : null,

    ].filter(Boolean) as MenuProps['items'];

    if (isMobile) {
        items.push({
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
            icon: <LogoutOutlined />
        })
    }

    const itemsDropdown = [
        {
            label: <Link to={'/'}>Trang chủ</Link>,
            key: 'home',
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
        },
    ];

    return (
        <>
            <Layout
                style={{ minHeight: '100vh' }}
                className="layout-admin"
            >
                {!isMobile ?
                    <Sider
                        theme='light'
                        collapsible
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}>
                        <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
                            <BugOutlined />  ADMIN
                        </div>
                        <Menu
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={items}
                            onClick={(e) => setActiveMenu(e.key)}
                        />
                    </Sider>
                    :
                    <Menu
                        selectedKeys={[activeMenu]}
                        items={items}
                        onClick={(e) => setActiveMenu(e.key)}
                        mode="horizontal"
                    />
                }

                <Layout>
                    {!isMobile &&
                        <div className='admin-header' style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                            <Button
                                type="text"
                                icon={collapsed ? React.createElement(MenuUnfoldOutlined) : React.createElement(MenuFoldOutlined)}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />

                            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                <Space style={{ cursor: "pointer" }}>
                                    Welcome {user?.name}
                                    <Avatar> {user?.name?.substring(0, 2)?.toUpperCase()} </Avatar>

                                </Space>
                            </Dropdown>
                        </div>
                    }
                    <Content style={{ padding: '15px' }}>
                        <Outlet />
                    </Content>
                    {/* <Footer style={{ padding: 10, textAlign: 'center' }}>
                        React Typescript series Nest.JS &copy; Hỏi Dân IT - Made with <HeartTwoTone />
                    </Footer> */}
                </Layout>
            </Layout>

        </>
    );
};

export default LayoutAdmin;