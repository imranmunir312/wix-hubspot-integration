import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Installation } from '../../installations/installation.entity';

type WixCreateAccessTokenResponse = {
  accessToken?: {
    value?: string;
    expiresAt?: string;
  };
};

@Injectable()
export class WixAuthService {
  async createAppAccessToken(installation: Installation): Promise<string> {
    if (!installation.wixInstanceId) {
      throw new BadRequestException('Missing wixInstanceId on installation');
    }

    const response = await axios.post<WixCreateAccessTokenResponse>(
      'https://www.wixapis.com/oauth2/access',
      {
        grantType: 'client_credentials',
        instanceId: installation.wixInstanceId,
      },
      {
        auth: {
          username: process.env.WIX_APP_ID!,
          password: process.env.WIX_APP_SECRET!,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const token = response.data.accessToken?.value;
    if (!token) {
      throw new BadRequestException('Wix did not return an app access token');
    }

    return token;
  }
}
