import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormContextEvent } from './form-context.entity';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(FormContextEvent)
    private readonly formContextRepo: Repository<FormContextEvent>,
  ) {}

  async captureContext(payload: Record<string, any>) {
    const email =
      typeof payload.email === 'string'
        ? payload.email.trim().toLowerCase()
        : '';

    if (!email) {
      return { ok: true, skipped: true, reason: 'missing_email' };
    }

    await this.formContextRepo.save(
      this.formContextRepo.create({
        email,
        utmSource:
          typeof payload.utm_source === 'string' ? payload.utm_source : null,
        utmMedium:
          typeof payload.utm_medium === 'string' ? payload.utm_medium : null,
        utmCampaign:
          typeof payload.utm_campaign === 'string'
            ? payload.utm_campaign
            : null,
        utmTerm: typeof payload.utm_term === 'string' ? payload.utm_term : null,
        utmContent:
          typeof payload.utm_content === 'string' ? payload.utm_content : null,
        pageUrl: typeof payload.pageUrl === 'string' ? payload.pageUrl : null,
        referrer:
          typeof payload.referrer === 'string' ? payload.referrer : null,
        submittedAt:
          typeof payload.timestamp === 'string'
            ? new Date(payload.timestamp)
            : new Date(),
        source: typeof payload.source === 'string' ? payload.source : null,
        rawPayload: payload,
      }),
    );

    return { ok: true };
  }
}
