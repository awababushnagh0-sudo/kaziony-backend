import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** A service area's radius can be set between these, in km. */
export const MIN_SERVICE_AREA_RADIUS_KM = 1;
export const MAX_SERVICE_AREA_RADIUS_KM = 100;

/** Where Kaziony works, as customers' apps see it. */
export class BrowseAreaDto {
  /** @example "طرابلس" */
  nameAr: string;

  /** @example "Tripoli" */
  nameEn: string;

  /** The circle's center. @example 32.85 */
  latitude: number;

  /** @example 13.18 */
  longitude: number;

  /** @example 30 */
  radiusKm: number;
}

/** A service area as the dashboard edits it. */
export class ServiceAreaDto extends BrowseAreaDto {
  /** @example "0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b" */
  id: string;

  /** Off: customers there can't browse until it's back on. */
  isActive: boolean;
}

export class CreateServiceAreaDto {
  /** @example "طرابلس" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nameAr: string;

  /** @example "Tripoli" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nameEn: string;

  /** @example 32.85 */
  @IsLatitude()
  latitude: number;

  /** @example 13.18 */
  @IsLongitude()
  longitude: number;

  /** @example 30 */
  @IsInt()
  @Min(MIN_SERVICE_AREA_RADIUS_KM)
  @Max(MAX_SERVICE_AREA_RADIUS_KM)
  radiusKm: number;

  /** Defaults to on. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceAreaDto extends PartialType(CreateServiceAreaDto) {}
