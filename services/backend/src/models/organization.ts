import { BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { Course } from './course'
import { CourseProvider } from './courseProvider'
import { ProgrammeModule } from './programmeModule'
import { SISStudyRight } from './SISStudyRight'
import { Studyright } from './studyright'

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @HasMany(() => ProgrammeModule, { foreignKey: 'organization_id' })
  programmeModules: ProgrammeModule[]

  @HasMany(() => Organization, { foreignKey: 'parent_id', as: 'children' })
  children: Organization[]

  @HasMany(() => SISStudyRight, { foreignKey: 'facultyCode', sourceKey: 'code' })
  SISStudyRights: SISStudyRight[]

  @HasMany(() => Studyright, { foreignKey: 'facultyCode', sourceKey: 'code' })
  studyrights: Studyright[]

  @BelongsToMany(() => Course, () => CourseProvider, 'organizationcode')
  courses: Course[]

  @Column(DataType.STRING)
  code: string

  @Column(DataType.STRING)
  name: object

  @Column(DataType.STRING)
  parent_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
