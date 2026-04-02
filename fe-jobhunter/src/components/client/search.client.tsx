import { Button, Col, Form, Row, Select } from 'antd';
import { EnvironmentOutlined, MonitorOutlined } from '@ant-design/icons';
import { LOCATION_LIST, SKILLS_LIST } from '@/config/utils';
import { ProForm } from '@ant-design/pro-components';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchClient = () => {
    const optionsSkills = SKILLS_LIST;
    const optionsLocations = LOCATION_LIST;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const skillsParam = searchParams.get('skills');
        const locationsParam = searchParams.get('locations');

        form.setFieldsValue({
            skills: skillsParam ? skillsParam.split(',').filter(Boolean) : [],
            location: locationsParam ? locationsParam.split(',').filter(Boolean) : [],
        });
    }, [searchParams, form]);

    const onFinish = async (values: any) => {
        const nextParams = new URLSearchParams(searchParams);
        const selectedSkills: string[] = (values?.skills || []).filter(Boolean);
        const selectedLocations: string[] = (values?.location || [])
            .filter((item: string) => item && item !== 'ALL');

        if (selectedSkills.length > 0) {
            nextParams.set('skills', selectedSkills.join(','));
        } else {
            nextParams.delete('skills');
        }

        if (selectedLocations.length > 0) {
            nextParams.set('locations', selectedLocations.join(','));
        } else {
            nextParams.delete('locations');
        }

        setSearchParams(nextParams);

    }

    return (
        <ProForm
            form={form}
            onFinish={onFinish}
            submitter={
                {
                    render: () => <></>
                }
            }
        >
            <Row gutter={[20, 20]}>
                <Col span={24}><h2>Việc Làm IT Cho Developer "Chất"</h2></Col>
                <Col span={24} md={16}>
                    <ProForm.Item
                        name="skills"
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            showArrow={false}
                            style={{ width: '100%' }}
                            placeholder={
                                <>
                                    <MonitorOutlined /> Tìm theo kỹ năng...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsSkills}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={12} md={4}>
                    <ProForm.Item name="location">
                        <Select
                            mode="multiple"
                            allowClear
                            showArrow={false}
                            style={{ width: '100%' }}
                            placeholder={
                                <>
                                    <EnvironmentOutlined /> Địa điểm...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsLocations}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={12} md={4}>
                    <Button type='primary' onClick={() => form.submit()}>Search</Button>
                </Col>
            </Row>
        </ProForm>
    )
}
export default SearchClient;