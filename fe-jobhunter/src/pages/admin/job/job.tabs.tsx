import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import JobPage from './job';
import SkillPage from './skill';

const JobTabs = () => {
    const onChange = (key: string) => {
        // console.log(key);
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Quản lý việc làm',
            children: <JobPage />,
        },
        {
            key: '2',
            label: 'Quản lý kỹ năng',
            children: <SkillPage />,
        },

    ];
    return (
        <div>
            <Tabs
                defaultActiveKey="1"
                items={items}
                onChange={onChange}
            />

        </div>
    );
}

export default JobTabs;