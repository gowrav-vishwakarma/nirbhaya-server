import { Column, HasMany, Model, Table } from 'sequelize-typescript';
import AclRolePermissions from './AclRolePermissions';
@Table({
  tableName: 'q_entity_actions',
  timestamps: false,
})
export default class AclEntityActions extends Model<AclEntityActions> {
  @Column
  BaseModel: string;

  @Column
  Action: string;

  @Column
  appName: string;

  @HasMany(() => AclRolePermissions, 'entity_action_id')
  permissions: AclRolePermissions[];
}
