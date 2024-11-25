import { ActionListDTO } from '../qnatk/src';
import { SoSEventAction } from './sos-event.action';
import { UserAction } from './user.action';
import { AdminAction } from './admin.action';
import { NewsAction } from './news.action';
export const ModelActions: Record<string, ActionListDTO> = {
  SosEvent: SoSEventAction,
  User: UserAction,
  Admin: AdminAction,
  News: NewsAction,
};
