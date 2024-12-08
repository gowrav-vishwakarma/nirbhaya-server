import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import AclRoles from './AclRoles';
import AclEntityActions from './AclEntityActions';

@Table({
  tableName: 'q_role_permissions',
  timestamps: false,
})
export default class AclRolePermissions extends Model {
  @ForeignKey(() => AclEntityActions)
  @Column
  entity_action_id: number;

  @BelongsTo(() => AclEntityActions, 'entity_action_id')
  entityAction: AclEntityActions;

  @ForeignKey(() => AclRoles)
  @Column
  role_id: number;

  @Column({
    defaultValue: 0,
  })
  status: number;

  @Column
  from_ips: string;
}
