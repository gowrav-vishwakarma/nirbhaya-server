import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'q_roles',
  timestamps: false,
})
export default class AclRoles extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    allowNull: false,
  })
  id: number;

  @Column
  name: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: { menus: [], routes: [] },
  })
  permissions: {
    menus: string[];
    routes: string[];
  };
}
