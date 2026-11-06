import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  PageMetaDto,
  PaginationQueryDto,
} from '../../../common/dto/pagination.dto.js';
import { CategoryDto } from '../../categories/dto/category.dto.js';
import {
  PublicBranchDto,
  PublicOfferDto,
} from '../../offers/dto/public-offers.dto.js';

export class NearbyStoresQueryDto extends PaginationQueryDto {
  /**
   * Where the customer is (or the place they set on the map), inside a
   * service area: 400 with error "OutsideServiceArea".
   * @example 32.8872
   */
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  /** @example 13.1913 */
  @Type(() => Number)
  @IsLongitude()
  lng: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Search store names. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

/** A store in a list: enough for its logo, name and how far it is. */
export class PublicStoreSummaryDto {
  id: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  category: CategoryDto;
  /** Average stars from customers' pickups, one decimal; null before the first. */
  ratingAverage: number | null;
  ratingCount: number;
  /** Its closest active branch. */
  nearestBranch: PublicBranchDto;
  liveOfferCount: number;
}

export class PublicStoreListDto {
  items: PublicStoreSummaryDto[];
  meta: PageMetaDto;
}

export class PublicStoreDto {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  email: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  /** Where to go in the shop, what to bring. */
  pickupInstructions: string | null;
  category: CategoryDto;
  /** Average stars from customers' pickups, one decimal; null before the first. */
  ratingAverage: number | null;
  ratingCount: number;

  /** Active branches, closest first when a location is sent. */
  branches: PublicBranchDto[];
  followerCount: number;
  /** Null when not logged in as a customer. */
  isFollowing: boolean | null;
  /** Offers live right now, ending soonest first. */
  offers: PublicOfferDto[];
}

export class FollowedStoreDto {
  id: string;
  name: string;
  logoUrl: string | null;
  category: CategoryDto;
  liveOfferCount: number;
  followedAt: Date;
}
