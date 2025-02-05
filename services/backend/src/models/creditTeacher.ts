import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript'

import { Credit } from './credit'
import { Teacher } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit_teacher',
  tableName: 'credit_teachers',
})
export class CreditTeacher extends Model<InferAttributes<CreditTeacher>> {
  @ForeignKey(() => Credit)
  @Column(DataType.STRING)
  credit_id!: string

  @ForeignKey(() => Teacher)
  @Column(DataType.STRING)
  teacher_id!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
