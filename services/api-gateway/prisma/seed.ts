import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OmniTrack database...');

  // Create a demo venue
  const venue = await prisma.venue.create({
    data: {
      name: 'OmniTrack Demo Hospital',
      tenantId: 'default-tenant',
      address: '123 Medical Center Dr, San Francisco, CA 94102',
      metadata: { type: 'hospital', timezone: 'America/Los_Angeles' },
      floors: {
        create: [
          {
            name: 'Ground Floor',
            level: 0,
            minX: 0, minY: 0, maxX: 200, maxY: 150,
            zones: {
              create: [
                {
                  name: 'Emergency Room',
                  type: 'area',
                  geometry: { type: 'Polygon', coordinates: [[0, 0], [80, 0], [80, 60], [0, 60], [0, 0]] },
                  capacity: 30,
                },
                {
                  name: 'Reception',
                  type: 'area',
                  geometry: { type: 'Polygon', coordinates: [[80, 0], [200, 0], [200, 40], [80, 40], [80, 0]] },
                  capacity: 15,
                },
              ],
            },
          },
          {
            name: 'First Floor',
            level: 1,
            minX: 0, minY: 0, maxX: 200, maxY: 150,
            zones: {
              create: [
                {
                  name: 'ICU',
                  type: 'restricted',
                  geometry: { type: 'Polygon', coordinates: [[0, 0], [100, 0], [100, 75], [0, 75], [0, 0]] },
                  capacity: 10,
                },
                {
                  name: 'Ward A',
                  type: 'room',
                  geometry: { type: 'Polygon', coordinates: [[100, 0], [200, 0], [200, 75], [100, 75], [100, 0]] },
                  capacity: 20,
                },
              ],
            },
          },
        ],
      },
    },
    include: { floors: { include: { zones: true } } },
  });

  console.log(`Created venue: ${venue.name} with ${venue.floors.length} floors`);

  const groundFloor = venue.floors.find(f => f.level === 0)!;
  const firstFloor = venue.floors.find(f => f.level === 1)!;

  // Create demo assets
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'Wheelchair #1',
        type: 'equipment',
        deviceId: 'device-wc-001',
        tenantId: 'default-tenant',
        venueId: venue.id,
        status: 'active',
        metadata: { model: 'Standard', serialNumber: 'WC-2024-001' },
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Infusion Pump #3',
        type: 'equipment',
        deviceId: 'device-ip-003',
        tenantId: 'default-tenant',
        venueId: venue.id,
        status: 'active',
        metadata: { model: 'Alaris 8100', serialNumber: 'IP-2024-003' },
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Nurse Badge - Sarah',
        type: 'badge',
        deviceId: 'device-badge-sarah',
        tenantId: 'default-tenant',
        venueId: venue.id,
        status: 'active',
        metadata: { department: 'Emergency', employeeId: 'EMP-1001' },
      },
    }),
    prisma.asset.create({
      data: {
        name: 'Supply Cart #7',
        type: 'cart',
        deviceId: 'device-cart-007',
        tenantId: 'default-tenant',
        venueId: venue.id,
        status: 'active',
        metadata: { contents: 'Medical supplies' },
      },
    }),
  ]);

  console.log(`Created ${assets.length} assets`);

  // Create device twins with positions
  const twins = await Promise.all([
    prisma.deviceTwin.create({
      data: {
        deviceId: 'device-wc-001',
        tenantId: 'default-tenant',
        vendor: 'cisco',
        assetId: assets[0].id,
        venueId: venue.id,
        floorId: groundFloor.id,
        x: 25.3, y: 30.1, z: 0,
        battery: 85,
        lastSeen: new Date(),
      },
    }),
    prisma.deviceTwin.create({
      data: {
        deviceId: 'device-ip-003',
        tenantId: 'default-tenant',
        vendor: 'aruba',
        assetId: assets[1].id,
        venueId: venue.id,
        floorId: firstFloor.id,
        x: 45.7, y: 22.8, z: 0,
        battery: 92,
        lastSeen: new Date(),
      },
    }),
    prisma.deviceTwin.create({
      data: {
        deviceId: 'device-badge-sarah',
        tenantId: 'default-tenant',
        vendor: 'cisco',
        assetId: assets[2].id,
        venueId: venue.id,
        floorId: groundFloor.id,
        x: 55.2, y: 15.4, z: 0,
        battery: 67,
        lastSeen: new Date(),
      },
    }),
    prisma.deviceTwin.create({
      data: {
        deviceId: 'device-cart-007',
        tenantId: 'default-tenant',
        vendor: 'generic',
        assetId: assets[3].id,
        venueId: venue.id,
        floorId: groundFloor.id,
        x: 120.0, y: 20.5, z: 0,
        battery: 100,
        lastSeen: new Date(),
      },
    }),
  ]);

  console.log(`Created ${twins.length} device twins`);

  // Create some demo alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        type: 'battery',
        severity: 'warning',
        status: 'active',
        assetId: assets[2].id,
        venueId: venue.id,
        message: 'Low battery on Nurse Badge - Sarah (67%)',
        details: { currentLevel: 67, threshold: 70 },
      },
    }),
    prisma.alert.create({
      data: {
        type: 'geofence',
        severity: 'critical',
        status: 'active',
        assetId: assets[0].id,
        venueId: venue.id,
        zone: 'ICU',
        message: 'Wheelchair #1 entered restricted zone: ICU',
        details: { zoneType: 'restricted' },
      },
    }),
  ]);

  console.log(`Created ${alerts.length} demo alerts`);
  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
