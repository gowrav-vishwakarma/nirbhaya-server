export class VolunteerNearbyResponseDto {
  id: number;
  profession: string;
  location: {
    type: string;
    coordinates: number[];
  };
}
