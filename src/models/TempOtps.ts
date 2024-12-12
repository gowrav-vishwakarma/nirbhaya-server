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
    otp: number;
  
    @Column({
      type: DataType.BOOLEAN,
    })
    isSend: boolean;
  
    @CreatedAt
    @Column({
      type: DataType.DATE,
      defaultValue: DataType.NOW,
    })
    createdAt: Date;

    @UpdatedAt
    @Column({
      type: DataType.DATE,
      defaultValue: DataType.NOW,
    })
    updatedAt: Date;
  }
  