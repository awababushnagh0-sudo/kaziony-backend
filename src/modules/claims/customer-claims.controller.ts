import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../../common/auth/auth-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/enums.js';
import { ClaimsService, MAX_ACTIVE_RESERVATIONS } from './claims.service.js';
import {
  CreateClaimDto,
  CustomerClaimDto,
  CustomerClaimListDto,
  ListMyClaimsQueryDto,
  RateClaimDto,
} from './dto/customer-claims.dto.js';

@ApiTags('Claims')
@ApiBearerAuth()
@Roles(UserRole.CUSTOMER)
@Controller()
export class CustomerClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  @Post('offers/:offerId/claim')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Claim an offer',
    description:
      'Takes `quantity` pieces (default 1) with one code, within the ' +
      "offer's `maxPerUser`. LIMITED offers hold them until `expiresAt` " +
      '(the claim window). ' +
      `A customer can hold ${MAX_ACTIVE_RESERVATIONS} reservations at once; ` +
      'every 3rd missed pickup blocks claiming for 7 days. ' +
      'UNLIMITED offers just give a code valid until the offer ends.',
  })
  claim(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClaimDto,
  ): Promise<CustomerClaimDto> {
    return this.claims.claim(user.id, offerId, dto.quantity ?? 1);
  }

  @Get('me/claims')
  @ApiOperation({ summary: 'My claims (newest first, or active ones)' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: ListMyClaimsQueryDto,
  ): Promise<CustomerClaimListDto> {
    return this.claims.list(user.id, query);
  }

  @Get('me/claims/:claimId')
  @ApiOperation({ summary: 'One claim, with the code for the QR' })
  getClaim(
    @CurrentUser() user: AuthUser,
    @Param('claimId', ParseUUIDPipe) claimId: string,
  ): Promise<CustomerClaimDto> {
    return this.claims.get(user.id, claimId);
  }

  @Post('me/claims/:claimId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel a reservation I can't pick up",
    description: 'Gives the pieces back. Cancelling in time is not a no-show.',
  })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('claimId', ParseUUIDPipe) claimId: string,
  ): Promise<CustomerClaimDto> {
    return this.claims.cancel(user.id, claimId);
  }

  @Post('me/claims/:claimId/rating')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rate the store after picking up',
    description:
      'Once per pickup. 409 with error "NotPickedUp" before it was picked ' +
      'up, "AlreadyRated" the second time.',
  })
  rate(
    @CurrentUser() user: AuthUser,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: RateClaimDto,
  ): Promise<CustomerClaimDto> {
    return this.claims.rate(user.id, claimId, dto.stars);
  }
}
