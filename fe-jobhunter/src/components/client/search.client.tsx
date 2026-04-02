import { Button, Col, Form, Row, Select, Space, Typography } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST, SKILLS_LIST } from '@/config/utils';
import { ProForm } from '@ant-design/pro-components';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from 'styles/client.module.scss';
import { callFetchAllSkill } from '@/config/api';
import { ISkill } from '@/types/backend';
import { useState } from 'react';

const SearchClient = () => {
    const [optionsSkills, setOptionsSkills] = useState(SKILLS_LIST);
    const optionsLocations = LOCATION_LIST;
    const [form] = Form.useForm();
    const [searchParams, setSearchParams] = useSearchParams();
    const watchedSkills: string[] = Form.useWatch('skills', form) || [];

    useEffect(() => {
        const fetchSkills = async () => {
            const res = await callFetchAllSkill('page=1&size=100&sort=updatedAt,desc');
            const skillResult = res?.data?.result || [];
            if (skillResult.length > 0) {
                const mapped = skillResult
                    .filter((item: ISkill) => item?.name)
                    .map((item: ISkill) => ({
                        label: item.name as string,
                        value: (item.name as string).toUpperCase(),
                    }));
                setOptionsSkills(mapped);
            }
        };

        fetchSkills();
    }, []);

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

    const hotSkillTags = optionsSkills.slice(0, 8);

    const handleSelectHotSkill = (skillValue: string) => {
        const currentSkills: string[] = form.getFieldValue('skills') || [];
        if (currentSkills.includes(skillValue)) {
            form.setFieldValue('skills', currentSkills.filter((item) => item !== skillValue));
            return;
        }
        form.setFieldValue('skills', [...currentSkills, skillValue]);
    };

    return (
        <ProForm
            className={styles.searchHero}
            form={form}
            onFinish={onFinish}
            submitter={
                {
                    render: () => <></>
                }
            }
        >
            <Row gutter={[20, 20]}>
                <Col span={24}>
                    <Typography.Title level={2} className={styles.heroTitle}>
                        Việc Làm IT Cho Developer "Chất"
                    </Typography.Title>
                </Col>
                <Col span={24} md={5}>
                    <ProForm.Item name="location">
                        <Select
                            mode="multiple"
                            allowClear
                            showArrow={false}
                            maxTagCount={1}
                            style={{ width: '100%' }}
                            className={styles.heroInput}
                            placeholder={
                                <>
                                    <EnvironmentOutlined /> Tất cả thành phố
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsLocations}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={24} md={14}>
                    <ProForm.Item
                        name="skills"
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            showArrow
                            maxTagCount={2}
                            style={{ width: '100%' }}
                            className={styles.heroInput}
                            placeholder={
                                <>
                                    <SearchOutlined /> Nhập từ khóa theo kỹ năng, chức vụ, công ty...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsSkills}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={24} md={5}>
                    <Button className={styles.heroSearchBtn} type='primary' block onClick={() => form.submit()}>
                        <SearchOutlined /> Tìm Kiếm
                    </Button>
                </Col>

                <Col span={24}>
                    <div className={styles.hotSkillRow}>
                        <Typography.Text className={styles.hotSkillLabel}>Mọi người đang tìm kiếm:</Typography.Text>
                        <Space size={[8, 10]} wrap>
                            {hotSkillTags.map((skill) => {
                                const isActive = watchedSkills.includes(String(skill.value));
                                return (
                                    <button
                                        type="button"
                                        key={String(skill.value)}
                                        onClick={() => handleSelectHotSkill(String(skill.value))}
                                        className={isActive ? styles.hotSkillChipActive : styles.hotSkillChip}
                                    >
                                        {String(skill.label)}
                                    </button>
                                );
                            })}
                        </Space>
                    </div>
                </Col>
            </Row>
        </ProForm>
    )
}
export default SearchClient;