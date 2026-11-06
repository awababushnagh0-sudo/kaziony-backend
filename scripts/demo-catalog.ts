/**
 * Fills Tripoli with stores and offers to look at: 10 stores (bakeries,
 * sweets, cafés) with photos, logos and covers, and 63 offers covering what
 * a card can show (short and long titles, small and big discounts, a few
 * pieces or no limit, one left, a per-customer limit). Most offers last
 * weeks; a few end within hours for "ending soon". Run it again to put every
 * offer back: full quantities and end times counted from now.
 *
 *   npm run db:seed && npm run db:catalog
 *
 * Photos come from prisma/demo-photos (see its CREDITS.md) and are copied
 * into UPLOADS_DIR/demo. Replaces every claim on these stores. Development
 * only: refused unless DEV_AUTH_ENABLED=true outside production.
 */
import 'dotenv/config';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  City,
  OfferStatus,
  OfferType,
  PrismaClient,
} from '../src/generated/prisma/client.js';

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

const PHOTOS_DIR = join(import.meta.dirname, '../prisma/demo-photos');
const UPLOADS_DIR = process.env['UPLOADS_DIR'] ?? './uploads';
/** Under the uploads folder, apart from what partners upload. */
const DEMO_FOLDER = 'demo';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (msFromNow: number) => new Date(now + msFromNow);

/** 1 LD = 1000 dirhams; offer prices are rounded to a quarter dinar. */
const DIRHAMS_PER_LD = 1000;
const PRICE_STEP = 250;

/**
 * Cycled through by offer, so the cards differ from one to the next. Most
 * end in days or weeks so they stay up between runs; the short ones show
 * "ending soon" and its countdown.
 */
const DISCOUNTS = [30, 50, 20, 40, 15, 60, 25, 70, 35, 10];
const ENDS_IN = [
  40 * MINUTE,
  7 * DAY,
  21 * DAY,
  3 * HOUR,
  14 * DAY,
  30 * DAY,
  2 * DAY,
  10 * DAY,
  25 * DAY,
  5 * DAY,
];
const QUANTITIES = [10, 6, 20, 4, 12, 8, 15, 5];
const MAX_PER_USER = [null, 2, null, 1, 3];
const CLAIM_WINDOWS = [60, 30, 120, 45, 90];
/** Every this many offers has no piece limit. */
const UNLIMITED_EVERY = 3;
/** Every this many offers is down to its last piece. */
const LAST_PIECE_EVERY = 7;
/** Between one offer's posting and the next, for "newest". */
const POSTED_APART = 37 * MINUTE;

/** What a product is, by the kind of store, taken in turn. */
const DESCRIPTIONS: Record<StoreSpec['category'], string[]> = {
  bakery: [
    'من خبز اليوم، يُخبز صباحًا ويُباع قبل الإغلاق بسعر أقل. طازج ويصلح للتجميد.',
    'ما تبقى من إنتاج اليوم، بنفس الجودة. سخّنه في الفرن دقائق ليرجع مقرمشًا.',
    'مخبوز في فرننا اليوم. الكمية حسب ما تبقى، فاحجز قبل ما يخلص.',
  ],
  sweet: [
    'من إنتاج اليوم، تُحفظ في الثلاجة وتُؤكل خلال يومين.',
    'حلويات اليوم بنصف ما تستاهل: نفس الطعم، فقط لأننا نُحضّر طازجًا كل صباح.',
    'محضّرة اليوم في محلنا. قد تختلف الزينة حسب ما تبقى.',
  ],
  cafe: [
    'يُحضّر عند الاستلام. أخبر الموظف إن كنت تريده بدون سكر.',
    'من قائمة اليوم، بسعر خاص في آخر ساعات العمل.',
    'طازج من مطبخنا. يُقدّم للأخذ فقط.',
  ],
};

/**
 * Where to go and what to bring, by store in turn; null leaves the app's
 * own words.
 */
const PICKUP_INSTRUCTIONS = [
  'أظهر رمز الاستلام للكاشير عند المدخل وادفع نقدًا. يُفضّل إحضار كيس.',
  null,
  'توجّه إلى الكاونتر الخلفي وأظهر الرمز لأي موظف. الاستلام للأخذ فقط.',
];

/**
 * Stars as if customers had rated their pickups, [count, total] by store
 * in turn: some well rated, one not rated yet. The real ones come with
 * StoreRating rows; the demo only needs the store's totals.
 */
const RATINGS: [count: number, total: number][] = [
  [37, 170],
  [12, 51],
  [0, 0],
  [54, 243],
  [8, 31],
];

interface StoreSpec {
  name: string;
  category: 'bakery' | 'sweet' | 'cafe';
  cover: string;
  logo: string;
  branches: { name: string; area: string; latitude: number; longitude: number }[];
  /** A photo in prisma/demo-photos/products, the title, the regular price. */
  products: [photo: string, title: string, price: string][];
}

const STORES: StoreSpec[] = [
  {
    name: 'مخبز السرايا',
    category: 'bakery',
    cover: 'bakery-shelves',
    logo: 'croissants',
    branches: [
      { name: 'الظهرة', area: 'Dahra', latitude: 32.893, longitude: 13.196 },
      { name: 'قرقارش', area: 'Gargaresh', latitude: 32.853, longitude: 13.105 },
    ],
    products: [
      ['croissants', 'كرواسون بالزبدة — 6 حبات', '9.000'],
      ['sourdough', 'خبز العجينة المخمّرة', '6.500'],
      ['rolls', 'خبز صغير للفطور (10 حبات)', '4.000'],
      [
        'bread-basket',
        'سلة مخبوزات اليوم: خبز وكرواسون وفطائر مشكلة بسعر خاص قبل الإغلاق',
        '15.000',
      ],
      ['rye-loaves', 'خبز الشعير', '5.000'],
      ['sliced-bread', 'خبز توست أسمر', '3.500'],
      ['pastry-plates', 'فطائر بالجبنة والزعتر', '7.000'],
    ],
  },
  {
    name: 'فرن الحارة',
    category: 'bakery',
    cover: 'dough',
    logo: 'sourdough',
    branches: [
      {
        name: 'سوق الجمعة',
        area: 'Souq Al Juma',
        latitude: 32.894,
        longitude: 13.226,
      },
    ],
    products: [
      ['sliced-bread', 'خبز التنور', '2.500'],
      ['rye-loaves', 'كعك بالسمسم', '6.000'],
      ['croissants', 'كرواسون بالشوكولاتة', '8.000'],
      ['rolls', 'بريوش', '5.500'],
      ['sourdough', 'خبز فرنسي (باقيت) — 3 حبات', '3.000'],
    ],
  },
  {
    name: 'مخبز الأصيل',
    category: 'bakery',
    cover: 'bread-basket',
    logo: 'rolls',
    branches: [
      { name: 'عين زارة', area: 'Ain Zara', latitude: 32.818, longitude: 13.236 },
      { name: 'الهضبة', area: 'Al Hadba', latitude: 32.84, longitude: 13.19 },
    ],
    products: [
      ['bread-basket', 'مخبوزات مشكلة', '12.000'],
      ['croissants', 'كرواسون باللوز', '10.000'],
      ['sourdough', 'خبز بالحبوب الكاملة', '7.000'],
      ['rolls', 'صمون', '2.000'],
      ['sliced-bread', 'خبز سندويش', '3.000'],
    ],
  },
  {
    name: 'حلويات الزهراء',
    category: 'sweet',
    cover: 'pink-cupcakes',
    logo: 'raspberry-cake',
    branches: [
      { name: 'بن عاشور', area: 'Ben Ashour', latitude: 32.879, longitude: 13.203 },
      {
        name: 'النوفليين',
        area: 'Al Nofliyin',
        latitude: 32.888,
        longitude: 13.214,
      },
    ],
    products: [
      ['raspberry-cake', 'كيكة التوت', '18.000'],
      ['tiramisu', 'تيراميسو — قطعتين', '12.000'],
      ['chocolate-cake', 'كيكة الشوكولاتة الكاملة (8 أشخاص)', '45.000'],
      ['strawberry-cups', 'كاسات الفراولة بالكريمة', '10.000'],
      ['berry-pies', 'تارت التوت', '14.000'],
      ['pink-cupcakes', 'كب كيك الفانيلا — 6 حبات', '15.000'],
      ['brownies', 'براونيز', '9.000'],
      ['strawberry-crepes', 'كريب بالفراولة والقشطة', '11.000'],
    ],
  },
  {
    name: 'شوكولاتة نوار',
    category: 'sweet',
    cover: 'chocolates',
    logo: 'chocolates',
    branches: [
      {
        name: 'ميدان الشهداء',
        area: 'Martyrs Square',
        latitude: 32.896,
        longitude: 13.181,
      },
    ],
    products: [
      ['chocolates', 'علبة شوكولاتة فاخرة (16 قطعة)', '35.000'],
      ['chocolate-parfait', 'كوب شوكولاتة بالأوريو', '9.500'],
      ['oreo-cupcakes', 'كب كيك أوريو', '12.000'],
      ['brownies', 'براونيز بالبندق', '10.000'],
      ['chocolate-cupcakes', 'كب كيك شوكولاتة — 4 حبات', '11.000'],
      ['berry-popsicles', 'آيس كريم توت على عصا', '4.000'],
    ],
  },
  {
    name: 'كيك آند مور',
    category: 'sweet',
    cover: 'chocolate-cupcakes',
    logo: 'mint-cupcakes',
    branches: [
      {
        name: 'حي الأندلس',
        area: 'Hay Al Andalus',
        latitude: 32.87,
        longitude: 13.12,
      },
      { name: 'السياحية', area: 'Siyahiya', latitude: 32.862, longitude: 13.09 },
    ],
    products: [
      ['mint-cupcakes', 'كب كيك بالنعناع', '13.000'],
      ['donuts', 'دونات مشكلة — 6 حبات', '12.000'],
      ['cookies', 'كوكيز بالشوكولاتة', '8.000'],
      ['chocolate-chip-cookies', 'كوكيز كبيرة — علبة 12', '18.000'],
      ['muffins', 'مافن بالتوت', '9.000'],
      ['raspberry-cake', 'تشيز كيك التوت', '16.000'],
      ['tiramisu', 'تيراميسو', '7.000'],
    ],
  },
  {
    name: 'حلويات الفرناج',
    category: 'sweet',
    cover: 'chocolate-cake',
    logo: 'donuts',
    branches: [
      { name: 'الفرناج', area: 'Al Furnaj', latitude: 32.83, longitude: 13.225 },
    ],
    products: [
      ['donuts', 'دونات بالشوكولاتة', '6.000'],
      ['berry-pies', 'فطيرة التفاح', '10.000'],
      ['strawberry-cups', 'مهلبية بالفراولة', '5.000'],
      ['chocolate-cake', 'شريحة كيكة شوكولاتة', '4.500'],
      ['cookies', 'معمول — علبة نص كيلو', '20.000'],
    ],
  },
  {
    name: 'مقهى الميدان',
    category: 'cafe',
    cover: 'street-cafe',
    logo: 'latte-art',
    branches: [
      {
        name: 'ميدان الشهداء',
        area: 'Martyrs Square',
        latitude: 32.8955,
        longitude: 13.182,
      },
    ],
    products: [
      ['lattes', 'لاتيه + كرواسون', '9.000'],
      ['latte-art', 'كابتشينو', '5.000'],
      ['black-coffee', 'قهوة أمريكانو', '4.000'],
      ['orange-juice', 'عصير برتقال طازج', '6.000'],
      ['pancakes', 'بان كيك بالعسل', '12.000'],
      ['french-toast', 'فرنش توست بالموز والتوت', '14.000'],
    ],
  },
  {
    name: 'كافيه ركن القهوة',
    category: 'cafe',
    cover: 'coffee-bar',
    logo: 'black-coffee',
    branches: [
      { name: 'فشلوم', area: 'Fashloum', latitude: 32.89, longitude: 13.206 },
      {
        name: 'زاوية الدهماني',
        area: 'Zawiyat Al Dahmani',
        latitude: 32.885,
        longitude: 13.2,
      },
    ],
    products: [
      ['black-coffee', 'قهوة مختصة V60', '8.000'],
      ['lattes', 'آيس لاتيه', '7.000'],
      ['toasted-sandwich', 'ساندويتش تونة محمص', '9.000'],
      ['chicken-bowl', 'بول دجاج مشوي', '16.000'],
      ['salad', 'سلطة سيزر', '12.000'],
      [
        'brunch-plate',
        'فطور كامل لشخصين: بيض وجبنة وزيتون وخبز وعصير برتقال',
        '30.000',
      ],
      ['orange-juice', 'عصير برتقال وجزر', '6.500'],
    ],
  },
  {
    name: 'مقهى الشط',
    category: 'cafe',
    cover: 'cafe-hall',
    logo: 'pizza',
    branches: [
      { name: 'قرقارش', area: 'Gargaresh', latitude: 32.855, longitude: 13.11 },
      { name: 'أبو سليم', area: 'Abu Salim', latitude: 32.851, longitude: 13.181 },
    ],
    products: [
      ['pizza', 'بيتزا مارغريتا وسط', '18.000'],
      ['pizza-slices', 'بيتزا خضار — عائلية', '28.000'],
      ['burger', 'برجر لحم مع بطاطا', '22.000'],
      ['veggie-bowl', 'بول خضار وحمص', '14.000'],
      ['food-spread', 'عشاء مشكل لأربعة أشخاص', '60.000'],
      ['toasted-sandwich', 'ساندويتش حلوم', '10.000'],
      ['salad', 'سلطة يونانية', '11.000'],
    ],
  },
];

/** A fixed id per row, so running again updates instead of adding. */
const KIND = { store: 1, branch: 2, product: 3, offer: 4 } as const;
const fixedId = (kind: keyof typeof KIND, n: number) =>
  `01990000-0000-7000-8001-${String(KIND[kind]).padStart(2, '0')}${String(n).padStart(10, '0')}`;

/** [regular] less [percent], rounded to a quarter dinar, as "4.500". */
function discounted(regular: string, percent: number): string {
  const [whole, fraction = ''] = regular.split('.');
  const dirhams =
    Number(whole) * DIRHAMS_PER_LD + Number(fraction.padEnd(3, '0'));
  const off = Math.round((dirhams * (100 - percent)) / 100 / PRICE_STEP);
  const price = Math.max(off, 1) * PRICE_STEP;
  return `${Math.floor(price / DIRHAMS_PER_LD)}.${String(price % DIRHAMS_PER_LD).padStart(3, '0')}`;
}

const cycle = <T>(values: readonly T[], i: number): T =>
  values[i % values.length]!;

async function copyPhotos() {
  for (const folder of ['products', 'thumbs', 'covers']) {
    await cp(join(PHOTOS_DIR, folder), join(UPLOADS_DIR, DEMO_FOLDER, folder), {
      recursive: true,
    });
  }
}

const photo = (folder: 'products' | 'thumbs' | 'covers', name: string) =>
  `${DEMO_FOLDER}/${folder}/${name}.jpg`;

async function main() {
  const categories = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );
  await copyPhotos();

  let branchCount = 0;
  let offerCount = 0;
  for (const [s, spec] of STORES.entries()) {
    const categoryId = categories.get(spec.category);
    if (!categoryId) {
      console.error('Run `npm run db:seed` first: the categories are missing.');
      process.exit(1);
    }
    const storeId = fixedId('store', s + 1);
    const store = {
      categoryId,
      name: spec.name,
      pickupInstructions: cycle(PICKUP_INSTRUCTIONS, s),
      ratingCount: cycle(RATINGS, s)[0],
      ratingTotal: cycle(RATINGS, s)[1],
      logoUrl: photo('thumbs', spec.logo),
      coverUrl: photo('covers', spec.cover),
      isActive: true,
    };
    await prisma.store.upsert({
      where: { id: storeId },
      update: store,
      create: { id: storeId, ...store },
    });
    await prisma.claim.deleteMany({ where: { offer: { storeId } } });

    const branchIds: string[] = [];
    for (const { name, area, latitude, longitude } of spec.branches) {
      const id = fixedId('branch', ++branchCount);
      const branch = {
        name,
        area,
        latitude,
        longitude,
        city: City.TRIPOLI,
        isActive: true,
      };
      await prisma.branch.upsert({
        where: { id },
        update: branch,
        create: { id, storeId, ...branch },
      });
      branchIds.push(id);
    }

    for (const [image, title, regularPrice] of spec.products) {
      const i = offerCount++;
      const productId = fixedId('product', i + 1);
      const product = {
        title,
        description: cycle(DESCRIPTIONS[spec.category], i),
        regularPrice,
        imagePath: photo('products', image),
        thumbPath: photo('thumbs', image),
        isArchived: false,
      };
      await prisma.product.upsert({
        where: { id: productId },
        update: product,
        create: { id: productId, storeId, ...product },
      });

      const limited = i % UNLIMITED_EVERY !== UNLIMITED_EVERY - 1;
      const total = cycle(QUANTITIES, i);
      const offerId = fixedId('offer', i + 1);
      const offer = {
        title,
        originalPrice: regularPrice,
        offerPrice: discounted(regularPrice, cycle(DISCOUNTS, i)),
        type: limited ? OfferType.LIMITED : OfferType.UNLIMITED,
        totalQuantity: limited ? total : null,
        remainingQuantity: limited
          ? i % LAST_PIECE_EVERY === 0
            ? 1
            : total
          : null,
        maxPerUser: cycle(MAX_PER_USER, i),
        claimWindowMinutes: cycle(CLAIM_WINDOWS, i),
        status: OfferStatus.ACTIVE,
        createdAt: at(-(i + 1) * POSTED_APART),
        startsAt: at(-(i + 1) * POSTED_APART),
        endsAt: at(cycle(ENDS_IN, i)),
      };
      await prisma.offer.upsert({
        where: { id: offerId },
        update: offer,
        create: {
          id: offerId,
          storeId,
          productId,
          ...offer,
          branches: { create: branchIds.map((branchId) => ({ branchId })) },
        },
      });
    }
  }

  console.log(
    `Catalog: ${STORES.length} stores, ${branchCount} branches, ${offerCount} offers; photos in ${join(UPLOADS_DIR, DEMO_FOLDER)}`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
