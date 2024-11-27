import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
  BeforeUpdate,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './User';
@Table
export class EventSummery extends Model {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({ defaultValue: 0 })
  totalPoints: number;

  @Column({ defaultValue: 0 })
  dailyPoints: number;

  @Column({ defaultValue: 0 })
  weeklyPoints: number;

  @Column({ defaultValue: 0 })
  monthlyPoints: number;

  @Column({ defaultValue: 0 })
  quarterlyPoints: number;

  @Column({ defaultValue: 0 })
  halfYearlyPoints: number;

  @Column({ defaultValue: 0 })
  yearlyPoints: number;

  @Column({ defaultValue: 0 })
  day: number;

  @Column({ defaultValue: 0 })
  week: number;

  @Column({ defaultValue: 0 })
  month: number;

  @Column({ defaultValue: 0 })
  year: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BeforeCreate
  @BeforeUpdate
  static setTimeValues(instance: EventSummery) {
    const now = new Date();
    // Set day (1-31)
    instance.day = now.getDate();
    // Set week (1-53)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    instance.week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    // Set month (1-12)
    instance.month = now.getMonth() + 1;
    // Set year
    instance.year = now.getFullYear();
  }
}
