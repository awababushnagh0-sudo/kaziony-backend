import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.js';
import { pageMeta } from '../../common/dto/pagination.dto.js';
import type { LatLng } from '../../common/utils/geo.js';
import { ratingAverage } from '../../common/utils/rating.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UserRole } from '../../generated/prisma/enums.js';
import { StorageService } from '../../storage/storage.service.js';
import { toCategoryDto } from '../categories/categories.service.js';
import {
  liveOfferWhere,
  PublicOffersService,
  toBranchDto,
} from '../offers/public-offers.service.js';
import type {
  FollowedStoreDto,
  NearbyStoresQueryDto,
  PublicStoreDto,
  PublicStoreListDto,
  PublicStoreSummaryDto,
} from './dto/public-stores.dto.js';

// Stores are ranked by distance in memory, like offers. Plenty for the
// stores of one city; move it into SQL if the app outgrows this.
const MAX_STORES = 1000;

@Injectable()
export class PublicStoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly offers: PublicOffersService,
  ) {}

  /** Stores around the customer, closest first. */
  async nearby(query: NearbyStoresQueryDto): Promise<PublicStoreListDto> {
    const location = { latitude: query.lat, longitude: query.lng };
    const radius = await this.offers.radiusAround(location);
    const search = query.search?.trim();
    const stores = await this.prisma.store.findMany({
      where: {
        isActive: true,
        categoryId: query.categoryId,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
        branches: { some: { isActive: true } },
      },
      include: {
        category: true,
        branches: { where: { isActive: true } },
        _count: { select: { offers: { where: liveOfferWhere() } } },
      },
      take: MAX_STORES,
    });

    const ranked: PublicStoreSummaryDto[] = [];
    for (const store of stores) {
      const nearest = store.branches
        .map((branch) => toBranchDto(branch, location))
        .reduce((a, b) => (b.distanceKm! < a.distanceKm! ? b : a));
      if (nearest.distanceKm! > radius) continue;
      ranked.push({
        id: store.id,
        name: store.name,
        logoUrl: this.storage.url(store.logoUrl),
        coverUrl: this.storage.url(store.coverUrl),
        category: toCategoryDto(store.category),
        ratingAverage: ratingAverage(store.ratingTotal, store.ratingCount),
        ratingCount: store.ratingCount,
        nearestBranch: nearest,
        liveOfferCount: store._count.offers,
      });
    }
    ranked.sort(
      (a, b) => a.nearestBranch.distanceKm! - b.nearestBranch.distanceKm!,
    );

    const start = (query.page - 1) * query.pageSize;
    return {
      items: ranked.slice(start, start + query.pageSize),
      meta: pageMeta(query, ranked.length),
    };
  }

  async get(
    storeId: string,
    location: LatLng | undefined,
    viewer: AuthUser | undefined,
  ): Promise<PublicStoreDto> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, isActive: true },
      include: {
        category: true,
        branches: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        _count: { select: { followers: true } },
      },
    });
    if (!store) throw new NotFoundException('Store not found');

    const branches = store.branches.map((branch) =>
      toBranchDto(branch, location),
    );
    if (location) branches.sort((a, b) => a.distanceKm! - b.distanceKm!);

    const isCustomer = viewer?.role === UserRole.CUSTOMER;
    const follow = isCustomer
      ? await this.prisma.follow.findUnique({
          where: { userId_storeId: { userId: viewer.id, storeId } },
        })
      : null;

    return {
      id: store.id,
      name: store.name,
      logoUrl: this.storage.url(store.logoUrl),
      coverUrl: this.storage.url(store.coverUrl),
      phone: store.phone,
      email: store.email,
      facebookUrl: store.facebookUrl,
      instagramUrl: store.instagramUrl,
      pickupInstructions: store.pickupInstructions,
      category: toCategoryDto(store.category),
      ratingAverage: ratingAverage(store.ratingTotal, store.ratingCount),
      ratingCount: store.ratingCount,
      branches,
      followerCount: store._count.followers,
      isFollowing: isCustomer ? follow !== null : null,
      offers: await this.offers.liveForStore(storeId, location),
    };
  }

  /** Safe to call twice. */
  async follow(userId: string, storeId: string): Promise<void> {
    const store = await this.prisma.store.count({
      where: { id: storeId, isActive: true },
    });
    if (store === 0) throw new NotFoundException('Store not found');
    await this.prisma.follow.upsert({
      where: { userId_storeId: { userId, storeId } },
      update: {},
      create: { userId, storeId },
    });
  }

  /** Safe to call twice. */
  async unfollow(userId: string, storeId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { userId, storeId } });
  }

  async followed(userId: string): Promise<FollowedStoreDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: { userId, store: { isActive: true } },
      include: {
        store: {
          include: {
            category: true,
            _count: { select: { offers: { where: liveOfferWhere() } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(({ store, createdAt }) => ({
      id: store.id,
      name: store.name,
      logoUrl: this.storage.url(store.logoUrl),
      category: toCategoryDto(store.category),
      ratingAverage: ratingAverage(store.ratingTotal, store.ratingCount),
      ratingCount: store.ratingCount,
      liveOfferCount: store._count.offers,
      followedAt: createdAt,
    }));
  }
}
