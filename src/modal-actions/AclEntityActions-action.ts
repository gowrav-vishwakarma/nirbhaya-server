import { ActionDTO, ActionListDTO } from 'src/qnatk/src';

export const AclEntityActions: ActionListDTO = {
  updateActions: {
    name: 'updateActions',
    mode: 'NoRecord',
    hideInAcl: true,
  } as ActionDTO,
  togglePermission: {
    name: 'togglePermission',
    mode: 'NoRecord',
    hideInAcl: true,
  } as ActionDTO,
};
