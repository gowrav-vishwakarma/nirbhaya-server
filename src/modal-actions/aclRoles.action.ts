import { ActionDTO, ActionListDTO } from 'src/qnatk/src';

export const AclRolesActions: ActionListDTO = {
  updatePermissions: {
    name: 'updatePermissions',
    mode: 'NoRecord',
    hideInAcl: true,
  } as ActionDTO,
  edit: {
    name: 'edit',
    label: 'Edit',
    icon: 'edit',
    description: 'Edit Affiliate',
    mode: 'SingleRecord',
    loadBy: 'id',
    returnModel: false,
  } as ActionDTO,
};
