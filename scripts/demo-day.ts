/**
 * Fills the demo store with a day of activity, timed from now: customers on
 * their way, pickups and no-shows today, and a month of history. Reservations
 * only last an hour, so run it again whenever you need fresh ones.
 *
 *   npm run db:seed && npm run db:demo
 *
 * Replaces every claim of the demo store. Development only: refused unless
 * DEV_AUTH_ENABLED=true outside production.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ClaimStatus,
  OfferStatus,
  OfferType,
  type Prisma,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client.js';
import { generateClaimCode } from '../src/common/utils/claim-code.js';
import { DEMO } from '../prisma/demo-ids.js';

if (
  process.env['DEV_AUTH_ENABLED'] !== 'true' ||
  process.env['NODE_ENV'] === 'production'
) {
  console.error('Development only: set DEV_AUTH_ENABLED=true.');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// Libya is UTC+2 all year (no daylight saving).
const LIBYA_OFFSET = 2 * HOUR;

const now = Date.now();
const at = (msFromNow: number) => new Date(now + msFromNow);
const minutesSinceLibyaMidnight = Math.floor(
  ((now + LIBYA_OFFSET) % DAY) / MINUTE,
);

const CUSTOMERS = [
  'سارة المصراتي',
  'أحمد الطرابلسي',
  'يوسف الزوي',
  'مريم الورفلي',
  'علي الشريف',
  'هدى القماطي',
  'خالد بن عمران',
  'فاطمة الككلي',
  'محمد السويحلي',
  'نور الزنتاني',
];

const OFFERS = {
  kunafa: {
    productId: '01990000-0000-7000-8000-000000000023',
    offerId: '01990000-0000-7000-8000-000000000033',
    title: 'بوكس كنافة بالقشطة',
    originalPrice: '12.500',
    offerPrice: '7.500',
    type: OfferType.LIMITED,
    totalQuantity: 10,
    endsIn: 5 * HOUR,
    viewCount: 142,
  },
  croissant: {
    productId: '01990000-0000-7000-8000-000000000024',
    offerId: '01990000-0000-7000-8000-000000000034',
    title: 'كرواسون باللوز — 4 حبات',
    originalPrice: '7.000',
    offerPrice: '4.000',
    type: OfferType.LIMITED,
    totalQuantity: 6,
    endsIn: 3 * HOUR,
    viewCount: 88,
  },
  coffee: {
    productId: '01990000-0000-7000-8000-000000000025',
    offerId: '01990000-0000-7000-8000-000000000035',
    title: 'قهوة تركية + قطعة بسبوسة',
    originalPrice: '6.000',
    offerPrice: '4.000',
    type: OfferType.UNLIMITED,
    totalQuantity: null,
    endsIn: 8 * HOUR,
    viewCount: 61,
  },
};
type OfferKey = keyof typeof OFFERS | 'baklava';

async function main() {
  const owner = await prisma.user.findUnique({
    where: { phone: DEMO.ownerPhone },
  });
  if (!owner) {
    console.error('Run `npm run db:seed` first: the demo store is missing.');
    process.exit(1);
  }

  const customers: { id: string }[] = [];
  for (const [i, name] of CUSTOMERS.entries()) {
    const email = `customer${i + 1}@demo.local`;
    customers.push(
      await prisma.user.upsert({
        where: { email },
        update: { name },
        create: { email, name, role: UserRole.CUSTOMER },
      }),
    );
  }

  await prisma.claim.deleteMany({ where: { offer: { storeId: DEMO.storeId } } });

  const offerIds: Record<OfferKey, string> = {
    kunafa: OFFERS.kunafa.offerId,
    croissant: OFFERS.croissant.offerId,
    coffee: OFFERS.coffee.offerId,
    baklava: DEMO.baklavaOfferId,
  };
  const branches = [DEMO.branchAndalusId, DEMO.branchBenAshourId];
  for (const offer of Object.values(OFFERS)) {
    const product = {
      title: offer.title,
      regularPrice: offer.originalPrice,
    };
    await prisma.product.upsert({
      where: { id: offer.productId },
      update: product,
      create: { id: offer.productId, storeId: DEMO.storeId, ...product },
    });
    const data = {
      title: offer.title,
      originalPrice: offer.originalPrice,
      offerPrice: offer.offerPrice,
      type: offer.type,
      totalQuantity: offer.totalQuantity,
      remainingQuantity: offer.totalQuantity,
      startsAt: at(-6 * HOUR),
      endsAt: at(offer.endsIn),
      viewCount: offer.viewCount,
      status: OfferStatus.ACTIVE,
    };
    await prisma.offer.upsert({
      where: { id: offer.offerId },
      update: data,
      create: {
        id: offer.offerId,
        storeId: DEMO.storeId,
        productId: offer.productId,
        ...data,
        branches: { create: branches.map((branchId) => ({ branchId })) },
      },
    });
  }
  // The month of history is on the baklava, which has no piece limit.
  await prisma.offer.update({
    where: { id: DEMO.baklavaOfferId },
    data: { startsAt: at(-31 * DAY), endsAt: at(3 * DAY), viewCount: 930 },
  });

  const claims: Prisma.ClaimCreateManyInput[] = [];
  let next = 0;
  const customer = () => customers[next++ % customers.length]!.id;
  const claim = (
    offer: OfferKey,
    status: ClaimStatus,
    createdAt: Date,
    quantity = 1,
  ) => {
    const expiresAt = new Date(createdAt.getTime() + HOUR);
    claims.push({
      offerId: offerIds[offer],
      userId: customer(),
      code: generateClaimCode(),
      quantity,
      status,
      createdAt,
      expiresAt,
      ...(status === ClaimStatus.REDEEMED && {
        redeemedAt: new Date(createdAt.getTime() + 25 * MINUTE),
        redeemedById: owner.id,
        redeemedBranchId: DEMO.branchAndalusId,
      }),
    });
  };

  // On their way: an hour to come, so one made 48 minutes ago is due in 12.
  // Most are on the offers without a piece limit, so the limited ones keep
  // only a few pieces left.
  const onTheWay: [OfferKey, number, number?][] = [
    ['baklava', 56],
    ['croissant', 48],
    ['coffee', 39, 2],
    ['baklava', 27],
    ['coffee', 20],
    ['kunafa', 13, 2],
    ['baklava', 8, 2],
    ['coffee', 2, 3],
  ];
  for (const [offer, minutesAgo, quantity] of onTheWay) {
    claim(offer, ClaimStatus.RESERVED, at(-minutesAgo * MINUTE), quantity);
  }

  // Earlier today, spread from midnight (Libya time) until an hour ago.
  const todaySpan = Math.max(minutesSinceLibyaMidnight - 90, 10);
  const earlierToday = (i: number, of: number) =>
    at(-(90 + Math.floor((todaySpan * i) / of)) * MINUTE);
  const today: [OfferKey, ClaimStatus][] = [
    ...Array<[OfferKey, ClaimStatus]>(5).fill(['kunafa', ClaimStatus.REDEEMED]),
    ...Array<[OfferKey, ClaimStatus]>(4).fill([
      'croissant',
      ClaimStatus.REDEEMED,
    ]),
    ['coffee', ClaimStatus.EXPIRED],
    ['coffee', ClaimStatus.EXPIRED],
  ];
  today.forEach(([offer, status], i) =>
    claim(offer, status, earlierToday(i, today.length)),
  );

  // The last 29 days: a steady trickle, a no-show now and then.
  for (let day = 1; day <= 29; day++) {
    const pickups = 6 + ((day * 7) % 6);
    for (let i = 0; i < pickups; i++) {
      claim('baklava', ClaimStatus.REDEEMED, at(-day * DAY - i * 40 * MINUTE));
    }
    if (day % 3 === 0) {
      claim('baklava', ClaimStatus.EXPIRED, at(-day * DAY - 5 * HOUR));
    }
  }

  await prisma.claim.createMany({ data: claims });

  // What's left of each limited offer after today's reservations and pickups.
  for (const key of ['kunafa', 'croissant'] as const) {
    const taken = claims
      .filter(
        (c) => c.offerId === offerIds[key] && c.status !== ClaimStatus.EXPIRED,
      )
      .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
    await prisma.offer.update({
      where: { id: offerIds[key] },
      data: { remainingQuantity: OFFERS[key].totalQuantity - taken },
    });
  }

  console.log(
    `Demo day: ${claims.length} claims for the demo store, ` +
      `${onTheWay.length} on their way.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
