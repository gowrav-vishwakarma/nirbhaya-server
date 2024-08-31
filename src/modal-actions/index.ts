import { ActionListDTO } from '../qnatk/src';
import { SoSEventAction } from './sos-event.action';
import { UserAction } from './user.action';

export const ModelActions: Record<string, ActionListDTO> = {
  SosEvent: SoSEventAction,
  User: UserAction,
};
