import { ActionDTO, ActionListDTO } from '../qnatk/src';

export const UserLocationAction: ActionListDTO = {
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
    returnModel: false,
  } as ActionDTO,
};
