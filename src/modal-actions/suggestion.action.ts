import { ActionDTO, ActionListDTO } from '../qnatk/src';

export const SuggestionAction: ActionListDTO = {
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
  delete: {
    name: 'delete',
    label: 'Delete',
    icon: 'delete',
    description: 'Delete Member',
    mode: 'SingleRecord',
    loadBy: 'id',
    ui: {
      mode: 'form',
      title: 'Delete Member',
      message: 'Delete Member ?',
      cancelLabel: 'Cancel',
      okLabel: 'Save',
    },
    returnModel: false,
  },
};
