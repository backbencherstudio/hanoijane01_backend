// external imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
// import express from 'express';
// internal imports
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { CustomExceptionFilter } from './common/exception/custom-exception.filter';
import { SojebStorage } from './common/lib/Disk/SojebStorage';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Handle raw body for webhooks
  // app.use('/payment/stripe/webhook', express.raw({ type: 'application/json' }));

  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  // Enable it, if special charactrers not encoding perfectly
  // app.use((req, res, next) => {
  //   // Only force content-type for specific API routes, not Swagger or assets
  //   if (req.path.startsWith('/api') && !req.path.startsWith('/api/docs')) {
  //     res.setHeader('Content-Type', 'application/json; charset=utf-8');
  //   }
  //   next();
  // });
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: false,
    prefix: '/public',
  });
  app.useStaticAssets(join(__dirname, '..', 'public/storage'), {
    index: false,
    prefix: '/storage',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new CustomExceptionFilter());

  // storage setup
  SojebStorage.config({
    driver: 'local',
    connection: {
      rootUrl: appConfig().storageUrl.rootUrl,
      publicUrl: appConfig().storageUrl.rootUrlPublic,
      // aws s3
      awsBucket: appConfig().fileSystems.s3.bucket,
      awsAccessKeyId: appConfig().fileSystems.s3.key,
      awsSecretAccessKey: appConfig().fileSystems.s3.secret,
      awsDefaultRegion: appConfig().fileSystems.s3.region,
      awsEndpoint: appConfig().fileSystems.s3.endpoint,
      minio: true,
      // google cloud storage
      gcpProjectId: appConfig().fileSystems.gcs.projectId,
      gcpKeyFile: appConfig().fileSystems.gcs.keyFile,
      gcpApiEndpoint: appConfig().fileSystems.gcs.apiEndpoint,
      gcpBucket: appConfig().fileSystems.gcs.bucket,
    },
  });

  // swagger
  const options = new DocumentBuilder()
    .setTitle(`${process.env.APP_NAME} api`)
    .setDescription(`${process.env.APP_NAME} api docs`)
    .setVersion('1.0')
    .addTag(`${process.env.APP_NAME}`)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
      displayOperationId: false,
      docExpansion: 'list',
    },
    customCss: `
      .swagger-ui .filter { display: none !important; }
      .swagger-ui .wrapper {
        max-width: 1460px !important;
      }
      .custom-swagger-search-wrapper {
        max-width: 1460px !important;
        margin: 20px auto 15px auto !important;
        box-sizing: border-box !important;
      }
      .custom-swagger-search-input {
        width: 100% !important;
        padding: 12px 18px !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 8px !important;
        outline: none !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        background: #ffffff !important;
        color: #0f172a !important;
        box-sizing: border-box !important;
      }
      .custom-swagger-search-input:focus {
        border-color: #1d4ed8 !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;
      }
    `,
    customJsStr: `
      (function() {
        function initCustomSearch() {
          const firstTagSection = document.querySelector('.swagger-ui .opblock-tag-section');
          if (!firstTagSection) {
            setTimeout(initCustomSearch, 200);
            return;
          }

          if (document.querySelector('.custom-swagger-search-input')) {
            return;
          }

          const container = firstTagSection.parentNode;
          const searchWrapper = document.createElement('div');
          searchWrapper.className = 'custom-swagger-search-wrapper';
          searchWrapper.innerHTML = '<input type="text" class="custom-swagger-search-input" placeholder="🔍 Search API path (e.g. /user/stats, /booking), summary, or module (case-insensitive)...">';

          container.insertBefore(searchWrapper, firstTagSection);

          const searchInput = searchWrapper.querySelector('input');

          searchInput.addEventListener('input', function(e) {
            const query = (e.target.value || '').toLowerCase().trim();
            const tagSections = document.querySelectorAll('.swagger-ui .opblock-tag-section');

            tagSections.forEach(function(tagSection) {
              const opblocks = tagSection.querySelectorAll('.opblock');
              let matchCountInTag = 0;

              opblocks.forEach(function(opblock) {
                const pathEl = opblock.querySelector('.opblock-summary-path');
                const methodEl = opblock.querySelector('.opblock-summary-method');
                const summaryEl = opblock.querySelector('.opblock-summary-description');
                const tagEl = tagSection.querySelector('.opblock-tag');

                const pathText = pathEl ? (pathEl.getAttribute('data-path') || pathEl.textContent || '') : '';
                const methodText = methodEl ? methodEl.textContent || '' : '';
                const summaryText = summaryEl ? summaryEl.textContent || '' : '';
                const tagText = tagEl ? tagEl.textContent || '' : '';

                const combined = (pathText + ' ' + methodText + ' ' + summaryText + ' ' + tagText).toLowerCase();

                if (!query || combined.indexOf(query) !== -1) {
                  opblock.style.display = '';
                  matchCountInTag++;
                } else {
                  opblock.style.display = 'none';
                }
              });

              if (!query || matchCountInTag > 0) {
                tagSection.style.display = '';
              } else {
                tagSection.style.display = 'none';
              }
            });
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initCustomSearch);
        } else {
          initCustomSearch();
        }
        setInterval(initCustomSearch, 1000);
      })();
    `,
  });
  // end swagger

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
