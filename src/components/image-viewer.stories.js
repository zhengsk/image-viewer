import React from 'react';

import ImageViewer from './image-viewer';

export default {
  component: ImageViewer,
  title: 'ImageViewer',
};

const Template = args => <ImageViewer {...args} />;

export const Default = Template.bind({
  src: 'https://hbimg.huaban.com/27ccbcac7eea8602187d307900a1a25a17a0a5831329e8-Ue5B5g',
});

Default.args = {
  src: 'https://hbimg.huaban.com/27ccbcac7eea8602187d307900a1a25a17a0a5831329e8-Ue5B5g',
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