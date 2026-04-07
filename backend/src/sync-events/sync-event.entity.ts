import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Installation } from '../installations/installation.entity';
import { SyncSource, SyncStatus, EntityType } from '../common/enums/sync.enums';

@Entity('sync_events')
@Index(['installationId', 'entityType', 'entityId'])
@Index(['installationId', 'correlationId'])
export class SyncEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  installationId: string;

  @ManyToOne(() => Installation, (installation) => installation.syncEvents, {
    onDelete: 'CASCADE',
  })
  installation: Installation;

  @Column({
    type: 'enum',
    enum: SyncSource,
  })
  eventSource: SyncSource;

  @Column({ type: 'text' })
  eventType: string;

  @Column({
    type: 'enum',
    enum: EntityType,
  })
  entityType: EntityType;

  @Column({ type: 'text' })
  entityId: string;

  @Column({ type: 'text' })
  correlationId: string;

  @Column({ type: 'text', nullable: true })
  payloadHash: string | null;

  @Column({
    type: 'enum',
    enum: SyncStatus,
  })
  status: SyncStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payloadRedacted: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
