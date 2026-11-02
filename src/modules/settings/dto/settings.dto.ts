import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** The radius can be set between these, in km. */
export const MIN_BROWSE_RADIUS_KM = 1;
export const MAX_BROWSE_RADIUS_KM = 100;

export class AppSettingsDto {
  /**
   * Customers see offers from branches this close to them, in km.
   * @example 25
   */
  browseRadiusKm: number;
}

export class UpdateAppSettingsDto {
  /** @example 25 */
  @IsOptional()
  @IsInt()
  @Min(MIN_BROWSE_RADIUS_KM)
  @Max(MAX_BROWSE_RADIUS_KM)
  browseRadiusKm?: number;
}
