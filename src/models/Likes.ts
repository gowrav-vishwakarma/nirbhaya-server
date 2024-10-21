import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  Unique,
} from 'sequelize-typescript';
import { Incident } from './Incident'; // Assuming Incident model exists
import { User } from './User'; // Assuming User model exists

@Table({
  tableName: 'Likes', // Table name in the database
  timestamps: true, // No automatic createdAt/updatedAt fields
  indexes: [
    {
      unique: true,
      fields: ['incidentId', 'userId'], // Composite unique key
    },
  ],
})
export class Like extends Model<Like> {
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
