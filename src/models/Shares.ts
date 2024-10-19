import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
} from 'sequelize-typescript';
import { Incident } from './Incident'; // Assuming Incident model exists
import { User } from './User'; // Assuming User model exists

@Table({
  tableName: 'Shares', // Specify the table name as 'Shares'
  timestamps: true, // Disable automatic createdAt/updatedAt fields
})
export class Share extends Model<Share> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Incident)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  incidentId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  // Associations
  @BelongsTo(() => Incident)
  incident: Incident;

  @BelongsTo(() => User)
  user: User;
}
