import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const materialsToInsert: any[] = [
      {
        name: "Dekton Estándar",
        code: "MAT-DK-01",
        type: "Dekton",
        description: "Superficie ultracompacta. Material principal referenciado en el catálogo de defectos (IE-17-86) con inspección visual a 70cm y ángulo de 45º."
      },
      {
        name: "Silestone",
        code: "MAT-SIL-01",
        type: "Silestone",
        description: "Superficie mineral híbrida. Incluido bajo las especificaciones corporativas del documento SGI Cosentino."
      },
      {
        name: "Sensa",
        code: "MAT-SEN-01",
        type: "Sensa",
        description: "Piedra natural con protección exclusiva. Incluido bajo las especificaciones corporativas del documento SGI Cosentino."
      }
    ];

    try {
      for (const material of materialsToInsert) {
        const existing = await strapi.documents('api::material.material').findMany({
          filters: { code: material.code },
        });

        if (!existing || existing.length === 0) {
          strapi.log.info(`Inserting ${material.name}...`);
          await strapi.documents('api::material.material').create({
            data: material,
            status: 'published'
          });
        }
      }

      // Automatically give public permissions to the frontend endpoints
      try {
        const publicRole = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: 'public' } });

        if (publicRole) {
          const permissionsToCreate = [
            { action: 'api::defect.defect.find' },
            { action: 'api::defect.defect.findOne' },
            { action: 'api::defect.defect.create' },
            { action: 'api::defect.defect.update' },
            { action: 'api::batch.batch.find' },
            { action: 'api::batch.batch.findOne' },
            { action: 'api::piece.piece.find' },
            { action: 'api::piece.piece.findOne' },
            { action: 'api::piece.piece.create' },
            { action: 'api::piece.piece.update' },
            { action: 'api::material.material.find' },
            { action: 'api::material.material.findOne' },
            { action: 'api::production-line.production-line.find' },
            { action: 'plugin::upload.content-api.upload' },
            { action: 'api::stat.stat.find' },
            { action: 'api::alert.alert.find' }
          ];

          for (const p of permissionsToCreate) {
            const exists = await strapi.db
              .query('plugin::users-permissions.permission')
              .findOne({ where: { action: p.action, role: publicRole.id } });

            if (!exists) {
              await strapi.db
                .query('plugin::users-permissions.permission')
                .create({ data: { action: p.action, role: publicRole.id } });
            }
          }
          strapi.log.info('Public permissions automatically configured.');
        }
      } catch (err) {
        strapi.log.error('Failed to set public permissions:', err);
      }

      // Automatically create a sample batch if no batches exist
      try {
        const existingBatches = await strapi.documents('api::batch.batch').findMany({ limit: 1 });
        if (!existingBatches || existingBatches.length === 0) {
          strapi.log.info('No batches found. Creating a default batch.');
          
          // Find a material to link
          const materials = await strapi.documents('api::material.material').findMany({ limit: 1 });
          const materialId = materials && materials.length > 0 ? materials[0].id : null;

          await strapi.documents('api::batch.batch').create({
            data: {
              idBatch: `LOTE-${new Date().getFullYear()}-001`,
              status: 'Producción',
              piece_count: 0,
              ...(materialId ? { material: materialId } : {}),
            },
            status: 'published'
          });
          strapi.log.info('Default batch created successfully.');
        }
      } catch (err) {
        strapi.log.error('Failed to create default batch:', err);
      }

      // Automatically create sample defect types if none exist
      try {
        const existingDefects = await strapi.documents('api::defect.defect').findMany({ limit: 1 });
        if (!existingDefects || existingDefects.length === 0) {
          strapi.log.info('No defects found. Creating default defect types.');
          
          const defectTypesToInsert = [
            { type: 'Micro-fisura', severity: 'Low', desc: 'Fisura superficial casi invisible' },
            { type: 'Rotura', severity: 'High', desc: 'Rotura completa de la pieza' },
            { type: 'Mancha', severity: 'Medium', desc: 'Decoloración o mancha en la superficie' },
            { type: 'Arañazo', severity: 'Low', desc: 'Marca superficial debida a la manipulación' }
          ];

          for (const defect of defectTypesToInsert) {
            await strapi.documents('api::defect.defect').create({
              data: {
                defect_type: defect.type,
                severity: defect.severity,
                description: defect.desc,
                stat: 'not reviewed',
                location_x: 0,
                location_y: 0,
              },
              status: 'published'
            });
          }
          strapi.log.info('Default defect types created successfully.');
        }
      } catch (err) {
        strapi.log.error('Failed to create default defects:', err);
      }
    } catch (e) {
      strapi.log.error('Failed to seed materials', e);
    }
  },
};
