import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'system_configs',
  timestamps: true,
})
export class SystemConfig extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  key: string;

  @Column({
    type: DataType.TEXT,
  })
  value: string;
}
