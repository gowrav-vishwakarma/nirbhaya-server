import { ActionDTO, ActionListDTO } from '../qnatk/src';

export const CommunityPostAction: ActionListDTO = {
  addNew: {
    name: 'addNew',
    mode: 'NoRecord',
    label: 'Add New',
    icon: 'add',
    iconColor: 'red',
    returnModel: true,
    loadBy: 'id',
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
  delete: {
    name: 'delete',
    label: 'Delete',
    icon: 'delete',
    description: 'Delete Record',
    mode: 'SingleRecord',
    loadBy: 'id',
    returnModel: false,
  } as ActionDTO,
};
