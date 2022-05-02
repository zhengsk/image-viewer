import React from 'react';

import ImageViewer from './image-viewer';

export default {
  component: ImageViewer,
  title: 'ImageViewer',
};

const Template = args => <ImageViewer {...args} />;

export const Default = Template.bind({
  src: 'https://hbimg.huaban.com/732e600f77172480ae0fef98102fd3937e7070609dd0d3-UPF8Jn',
});

Default.args = {
  src: 'https://hbimg.huaban.com/732e600f77172480ae0fef98102fd3937e7070609dd0d3-UPF8Jn',
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