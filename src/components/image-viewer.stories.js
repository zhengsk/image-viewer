import React from 'react';

import ImageViewer from './image-viewer';

export default {
  component: ImageViewer,
  title: 'ImageViewer',
};

const Template = args => <ImageViewer {...args} />;

export const Default = Template.bind({
  src: 'https://gd-hbimg.huaban.com/2d2024f66eb38ff770f2d29aedd935ab03eb94194e322-hWH3rf',
});

Default.args = {
  src: 'https://gd-hbimg.huaban.com/2d2024f66eb38ff770f2d29aedd935ab03eb94194e322-hWH3rf',
  task: {
    title: 'Test Task',
    state: 'TASK_INBOX',
    updatedAt: new Date(2021, 0, 1, 9, 0),
  },
};

export const Pinned = Template.bind({});
Pinned.args = {
  task: {
    ...Default.args.task,
    state: 'TASK_PINNED',
  },
};

export const Archived = Template.bind({});
Archived.args = {
  task: {
    ...Default.args.task,
    state: 'TASK_ARCHIVED',
  },
};