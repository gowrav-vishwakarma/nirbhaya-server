import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table
export class PointsRulesEntity extends Model<PointsRulesEntity> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column
  name: string;

  @Column
  actionType: string;

  @Column
  points: number;

  @Column({
    type: DataType.JSON,
  })
  conditions: JSON;

  @Column
  frequency: string; // ONCE, DAILY, WEEKLY, MONTHLY

  @Column
  isActive: boolean;
}
