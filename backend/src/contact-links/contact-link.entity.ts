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
import { SyncSource } from '../common/enums/sync.enums';

@Entity('contact_links')
@Unique(['installationId', 'wixContactId'])
@Unique(['installationId', 'hubspotContactId'])
export class ContactLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  installationId: string;

  @ManyToOne(() => Installation, (installation) => installation.contactLinks, {
    onDelete: 'CASCADE',
  })
  installation: Installation;

  @Column({ type: 'text' })
  wixContactId: string;

  @Column({ type: 'text' })
  hubspotContactId: string;

  @Column({
    type: 'enum',
    enum: SyncSource,
    nullable: true,
  })
  lastSource: SyncSource | null;

  @Column({ type: 'text', nullable: true })
  lastCorrelationId: string | null;

  @Column({ type: 'text', nullable: true })
  lastPayloadHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastWixUpdatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastHubspotUpdatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
