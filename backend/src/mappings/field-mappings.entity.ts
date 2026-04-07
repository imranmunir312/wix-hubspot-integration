import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Installation } from '../installations/installation.entity';
import { SyncDirection, TransformType } from '../common/enums/mapping.enums';

@Entity('field_mappings')
@Unique(['installationId', 'wixFieldKey', 'hubspotPropertyName'])
export class FieldMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  installationId: string;

  @ManyToOne(() => Installation, (installation) => installation.fieldMappings, {
    onDelete: 'CASCADE',
  })
  installation: Installation;

  @Column({ type: 'text' })
  wixFieldKey: string;

  @Column({ type: 'text' })
  hubspotPropertyName: string;

  @Column({
    type: 'enum',
    enum: SyncDirection,
  })
  direction: SyncDirection;

  @Column({
    type: 'enum',
    enum: TransformType,
    default: TransformType.NONE,
  })
  transformType: TransformType;

  @Column({ type: 'text', nullable: true })
  defaultValue?: string;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
