import { ActionListDTO } from '../qnatk/src';
import { SoSEventAction } from './sos-event.action';
import { UserAction } from './user.action';
import { AdminAction } from './admin.action';
import { NewsAction } from './news.action';
import { UserLocationAction } from './userLocation.action';
import { PointsRulesEntityAction } from './pointRulesEntity.action';
import { CommunityPostAction } from './communityPost.action';
import { AclEntityActions } from './AclEntityActions-action';
import { AclRolesActions } from './aclRoles.action';
import { TempOtpsAction } from './tempOtps.action';
import { SuggestionAction } from './suggestion.action';
export const ModelActions: Record<string, ActionListDTO> = {
  SosEvent: SoSEventAction,
  User: UserAction,
  Admin: AdminAction,
  News: NewsAction,
  UserLocation: UserLocationAction,
  PointsRulesEntity: PointsRulesEntityAction,
  CommunityPost: CommunityPostAction,
  AclEntityActions: AclEntityActions,
  AclRoles: AclRolesActions,
  TempOtps: TempOtpsAction,
  Suggestion: SuggestionAction,
};
