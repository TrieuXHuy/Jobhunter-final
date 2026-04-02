import { Card, Col, Row, Statistic } from "antd";
import CountUp from 'react-countup';

const DashboardPage = () => {
    const formatter = (value: number | string) => {
        return (
            <CountUp end={Number(value)} separator="," />
        );
    };

    return (
        <Row gutter={[20, 20]}>
            <Col span={24} md={8}>
                <Card title="Thống kê" bordered={false} >
                    <Statistic
                        title="Người dùng hoạt động"
                        value={112893}
                        formatter={formatter}
                    />

                </Card>
            </Col>
            <Col span={24} md={8}>
                <Card title="Thống kê" bordered={false} >
                    <Statistic
                        title="Người dùng hoạt động"
                        value={112893}
                        formatter={formatter}
                    />
                </Card>
            </Col>
            <Col span={24} md={8}>
                <Card title="Thống kê" bordered={false} >
                    <Statistic
                        title="Người dùng hoạt động"
                        value={112893}
                        formatter={formatter}
                    />
                </Card>
            </Col>

        </Row>
    )
}

export default DashboardPage;