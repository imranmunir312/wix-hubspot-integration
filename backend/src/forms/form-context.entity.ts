import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('form_context_events')
export class FormContextEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmSource: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmMedium: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmCampaign: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmTerm: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmContent: string | null;

  @Column({ type: 'text', nullable: true })
  pageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  referrer: string | null;

  @Column({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
