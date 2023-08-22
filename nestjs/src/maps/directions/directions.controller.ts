import { Controller, Query } from '@nestjs/common';
import { DirectionsService } from './directions.service';

@Controller('directions')
export class DirectionsController {
  constructor(private directionsService: DirectionsService) {}

  getDirections(
    @Query('originId') originId: string,
    @Query('destinationId') destinationId: string,
  ) {
    
  }
}
