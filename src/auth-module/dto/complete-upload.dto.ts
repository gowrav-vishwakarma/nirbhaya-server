export class CompleteUploadDto {
  sosEventId: number;
  fileName: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}
