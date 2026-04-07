import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FieldMapping } from '../mappings/field-mappings.entity';
import { ContactLink } from '../contact-links/contact-link.entity';
import { SyncEvent } from '../sync-events/sync-event.entity';
import { InstallationStatus } from '../common/enums/installation.enums';

@Entity('installations')
export class Installation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  wixSiteId: string;

  @Column({ type: 'text', unique: true })
  wixInstanceId: string;

  @Column({ type: 'text', nullable: true, unique: true })
  hubspotPortalId: string | null;

  @Column({ type: 'text', nullable: true })
  hubspotAccessTokenEnc: string | null;

  @Column({ type: 'text', nullable: true })
  hubspotRefreshTokenEnc: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  hubspotTokenExpiresAt: Date | null;

  @Column({
    type: 'enum',
    enum: InstallationStatus,
    default: InstallationStatus.DISCONNECTED,
  })
  status: InstallationStatus;

  @OneToMany(() => FieldMapping, (mapping) => mapping.installation)
  fieldMappings: FieldMapping[];

  @OneToMany(() => ContactLink, (link) => link.installation)
  contactLinks: ContactLink[];

  @OneToMany(() => SyncEvent, (event) => event.installation)
  syncEvents: SyncEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
