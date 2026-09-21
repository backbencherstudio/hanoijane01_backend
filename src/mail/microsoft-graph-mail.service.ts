import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

@Injectable()
export class MicrosoftGraphMailService {
  private readonly client: Client;

  private readonly fromEmail = process.env.MAIL_FROM!;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.MICROSOFT_TENANT_ID!,
      process.env.MICROSOFT_CLIENT_ID!,
      process.env.MICROSOFT_CLIENT_SECRET!,
    );

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            'https://graph.microsoft.com/.default',
          );

          if (!token?.token) {
            throw new Error('Failed to obtain Microsoft Graph access token');
          }

          return token.token;
        },
      },
    });
  }

  async sendMail(params: {
    to: string | string[];
    subject: string;
    html: string;
  }) {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    await this.client.api(`/users/${this.fromEmail}/sendMail`).post({
      message: {
        subject: params.subject,

        body: {
          contentType: 'HTML',
          content: params.html,
        },

        toRecipients: recipients.filter(Boolean).map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      },

      saveToSentItems: true,
    });
  }
}
