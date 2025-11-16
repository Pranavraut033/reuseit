import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    // Preferred: load from a service account JSON file using require (simpler & reliable)
    const explicitPath = config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    const defaultPath = path.join(
      process.cwd(),
      'reuseit-a37ea-firebase-adminsdk-fbsvc-ed8913ca21.json',
    );
    const serviceAccountPath =
      explicitPath || (fs.existsSync(defaultPath) ? defaultPath : undefined);

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const raw = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(raw) as unknown as admin.ServiceAccount;
        return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } catch (e) {
        Logger.warn(
          `Service account file load failed at ${serviceAccountPath}: ${(e as Error).message}`,
        );
      }
    }

    // Fallback: individual env vars
    const projectId = config.get<string>('FIREBASE_PROJECT_ID');
    let privateKey = config.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
    if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
    if (projectId && privateKey && clientEmail) {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        } as admin.ServiceAccount),
      });
    }

    // Final fallback: application default credentials
    Logger.warn(
      'Firebase Admin using application default credentials (no service account file or env vars found).',
    );
    return admin.initializeApp({ credential: admin.credential.applicationDefault() });
  },
};

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [firebaseProvider],
  exports: ['FIREBASE_APP'],
})
export class FirebaseModule {}
