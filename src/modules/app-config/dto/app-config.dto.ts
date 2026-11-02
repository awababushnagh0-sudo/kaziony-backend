import { BrowseAreaDto } from '../../settings/dto/service-area.dto.js';

export class AppVersionDto {
  /**
   * Older versions must update before they can be used.
   * @example "1.0.0"
   */
  minVersion: string;
}

export class SupportContactDto {
  /**
   * To call.
   * @example "+218910000000"
   */
  phone: string;

  /**
   * For a WhatsApp chat link (wa.me): international, digits only.
   * @example "218910000000"
   */
  whatsapp: string;

  /** @example "support@kaziony.ly" */
  email: string;

  /**
   * When the team answers, in Arabic.
   * @example "السبت إلى الخميس، 9 صباحًا إلى 5 مساءً"
   */
  hoursAr: string;

  /**
   * When the team answers, in English.
   * @example "Saturday to Thursday, 9 am to 5 pm"
   */
  hoursEn: string;
}

export class BrowseConfigDto {
  /**
   * Customers see offers from branches this close to them, in km.
   * @example 25
   */
  radiusKm: number;

  /**
   * Where Kaziony works: customers browse from a point inside one of
   * these, or `GET /offers` answers 400 `OutsideServiceArea`.
   */
  areas: BrowseAreaDto[];
}

export class AppConfigDto {
  partner: AppVersionDto;
  customer: AppVersionDto;
  admin: AppVersionDto;

  /** How to reach our team (forgotten passwords, adding a store, help). */
  support: SupportContactDto;

  /** How the customer app browses offers. */
  browse: BrowseConfigDto;
}
