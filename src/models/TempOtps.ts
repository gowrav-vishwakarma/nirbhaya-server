import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'tempOTPS',
  timestamps: true,
})
export class TempOtps extends Model<TempOtps> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
  })
  mobile: string;

  @Column({
    type: DataType.NUMBER,
  })
  otp: string;

  @Column({
    type: DataType.BOOLEAN,
  })
  isSend: boolean;
}
