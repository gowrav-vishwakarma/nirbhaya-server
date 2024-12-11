import { ActionDTO, ActionListDTO } from '../qnatk/src';

export const AdminAction: ActionListDTO = {
  addNew: {
    name: 'addNew',
    mode: 'NoRecord',
    label: 'Add New',
    icon: 'add',
    iconColor: 'red',
    returnModel: false,
  } as ActionDTO,
  edit: {
    name: 'edit',
    label: 'Edit',
    icon: 'edit',
    description: 'Edit Member',
    mode: 'SingleRecord',
    loadBy: 'id',
    returnModel: false,
  } as ActionDTO,
  changePassword: {
    name: 'changePassword',
    label: 'changePassword',
    icon: 'password',
    description: 'change password',
    mode: 'SingleRecord',
    loadBy: 'id',
    ui: {
      mode: 'confirmation',
      title: 'Change Password',
      message: 'Change Password ?',
      cancelLabel: 'Cancel',
      okLabel: 'Save',
    },
    returnModel: false,
  },
};
