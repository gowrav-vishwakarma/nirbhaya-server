import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'GovPincodeData',
  timestamps: true,
})
export class GovPincodeData extends Model<GovPincodeData> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER.UNSIGNED)
  id: number;

  @Column(DataType.STRING(255))
  circlename: string;

  @Column(DataType.STRING(255))
  regionname: string;

  @Column(DataType.STRING(255))
  divisionname: string;

  @Column(DataType.STRING(255))
  officename: string;

  @Index('gov_pincode_data_pincode')
  @Column(DataType.STRING(255))
  pincode: string;

  @Column(DataType.STRING(255))
  officetype: string;

  @Column(DataType.STRING(255))
  delivery: string;

  @Column(DataType.STRING(255))
  district: string;

  @Column(DataType.STRING(255))
  statename: string;

  @Column(DataType.STRING(255))
  latitude: string;

  @Column(DataType.STRING(255))
  longitude: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date;
}
