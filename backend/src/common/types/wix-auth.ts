import { Installation } from '../../installations/installation.entity';

export type WixOuterTokenPayload = {
  data?: string;
  iat?: number;
  exp?: number;
};

export type WixInnerTokenPayload = {
  instance?: {
    instanceId?: string;
    appDefId?: string;
    metaSiteId?: string;
    siteOwnerId?: string;
    expirationDate?: string;
    signDate?: string;
    uid?: string;
  };
};

export type AuthenticatedWixRequestContext = {
  instanceId: string;
  metaSiteId: string | null;
  installation: Installation;
};
