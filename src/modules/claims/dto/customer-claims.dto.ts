import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { PageMetaDto } from '../../../common/dto/pagination.dto.js';
import { OptionalBooleanQuery } from '../../../common/validation/decorators.js';
import { ClaimStatus, OfferType } from '../../../generated/prisma/enums.js';
import { PublicBranchDto } from '../../offers/dto/public-offers.dto.js';

/** Pieces one claim can take: a whole tray, not a wholesale order. */
export const MAX_CLAIM_QUANTITY = 100;

export class CreateClaimDto {
  /** Pieces to take with one code. Defaults to 1. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_CLAIM_QUANTITY)
  quantity?: number;
}

export class ListMyClaimsQueryDto extends PaginationQueryDto {
  /** true: only reservations that can still be used. */
  @OptionalBooleanQuery()
  active?: boolean;
}

export class CustomerClaimOfferDto {
  id: string;
  title: string;
  /** LD with 3 decimals */
  offerPrice: string;
  /** LD with 3 decimals */
  originalPrice: string;
  thumbUrl: string | null;
  @ApiProperty({ enum: OfferType, enumName: 'OfferType' })
  type: OfferType;
}

export class CustomerClaimStoreDto {
  id: string;
  name: string;
  logoUrl: string | null;
}

export class CustomerClaimDto {
  id: string;
  /** Show this as a QR code at the counter. */
  code: string;
  /** Pieces taken with this code. */
  quantity: number;
  /** What to pay in cash: offerPrice × quantity, LD with 3 decimals. */
  totalPrice: string;
  /** EXPIRED as soon as expiresAt passes, even before the cleanup job runs. */
  @ApiProperty({ enum: ClaimStatus, enumName: 'ClaimStatus' })
  status: ClaimStatus;
  /** Pick up and pay before this time. */
  expiresAt: Date;
  redeemedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  offer: CustomerClaimOfferDto;
  store: CustomerClaimStoreDto;
  /** Where it can be picked up. */
  branches: PublicBranchDto[];
  canCancel: boolean;
}

export class CustomerClaimListDto {
  items: CustomerClaimDto[];
  meta: PageMetaDto;
}
