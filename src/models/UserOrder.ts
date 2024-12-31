import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';

export enum OrderStatus {
  PENDING = 'pending',
  USER_CANCELED = 'userCanceled',
  BUSINESS_CANCELED = 'businessCanceled',
  DELIVERED = 'delivered',
}

@Table({
  tableName: 'UserOrders',
})
export class UserOrder extends Model<UserOrder> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  businessUserId: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  order: any;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    defaultValue: OrderStatus.PENDING,
    allowNull: false,
  })
  status: OrderStatus;

  @BelongsTo(() => User, 'userId')
  user: User;

  @BelongsTo(() => User, 'businessUserId')
  businessUser: User;
}
