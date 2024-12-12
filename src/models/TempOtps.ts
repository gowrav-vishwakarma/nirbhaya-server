import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    DataType,
    CreatedAt,
    Unique,
    UpdatedAt
  } from 'sequelize-typescript';
  import { Incident } from './Incident'; // Assuming Incident model exists
  
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
    mobile: number;
  
    @Column({
      type: DataType.NUMBER,
    })
    otp: number;
  
    @Column({
      type: DataType.BOOLEAN,
    })
    isSend: boolean;
  }
  