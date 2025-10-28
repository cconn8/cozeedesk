import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { ScanUploadDto } from './dto/scan-upload.dto';
import { ConfirmExtractionDto, RejectExtractionDto } from './dto/confirm-extraction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, CurrentUser } from '../auth/decorators/user.decorator';
import { StorageService } from '../storage/storage.service';
import { ExtractionQueueService } from '../extraction/services/extraction-queue.service';
import { FeedbackService } from '../extraction/services/feedback.service';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly storageService: StorageService,
    private readonly extractionQueueService: ExtractionQueueService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @Post()
  create(@Body() createCaseDto: CreateCaseDto, @User() user: CurrentUser) {
    // Ensure tenantId comes from JWT token for security
    const caseData = { ...createCaseDto, tenantId: user.tenantId };
    return this.casesService.create(caseData);
  }

  @Get()
  findAll(@User() user: CurrentUser, @Query('search') search?: string) {
    return this.casesService.findAll(user.tenantId, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: CurrentUser) {
    return this.casesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @User() user: CurrentUser,
  ) {
    return this.casesService.update(id, user.tenantId, updateCaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: CurrentUser) {
    return this.casesService.remove(id, user.tenantId);
  }

  /**
   * NEW: Upload scanned document and start extraction
   */
  @Post('upload-scan')
  @UseInterceptors(FileInterceptor('file'))
  async uploadScan(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ScanUploadDto,
    @User() user: CurrentUser,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PNG, JPG, and PDF allowed.');
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 20MB limit');
    }

    // Ensure tenantId comes from JWT token for security (Phase 1 pattern)
    const tenantId = user.tenantId;

    // Upload original to GCS
    const originalUrl = await this.storageService.uploadOriginal(file, tenantId);

    // Create case with "processing" status (following Phase 1 create pattern)
    const caseData = {
      tenantId,
      title: 'Processing...',
      type: 'Unknown',
      status: 'processing' as const,
      createdBy: user.email,
      originalScanUrl: originalUrl,
      templateId: dto.templateId,
      extractedFields: {},
      paymentStatus: 'pending',
      createdAt: new Date(),
    };

    const caseRecord = await this.casesService.create(caseData);

    // Add extraction job to queue
    const job = await this.extractionQueueService.addJob({
      caseId: caseRecord._id.toString(),
      tenantId,
      fileUrl: originalUrl,
      mimeType: file.mimetype,
      templateId: dto.templateId,
      templateMode: dto.templateMode || 'flexible',
    });

    // Return immediately (following Phase 1 response format)
    return {
      success: true,
      data: {
        caseId: caseRecord._id,
        jobId: job._id,
        status: 'processing',
      },
      message: 'Scan uploaded successfully. Extraction in progress...',
    };
  }

  /**
   * NEW: Get verification data for a case
   */
  @Get(':id/verify')
  async getVerificationData(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const caseRecord = await this.casesService.findOne(id, user.tenantId);
    
    if (caseRecord.status !== 'pending_verification') {
      throw new BadRequestException('Case is not pending verification');
    }

    // Get signed URL for original scan (expires in 1 hour)
    let signedUrl = null;
    if (caseRecord.originalScanUrl) {
      signedUrl = await this.storageService.getSignedUrl(
        caseRecord.originalScanUrl,
        3600,
      );
    }

    return {
      success: true,
      data: {
        case: caseRecord,
        originalScanUrl: signedUrl,
        extractionMetadata: caseRecord.extractionMetadata,
      },
    };
  }

  /**
   * NEW: Confirm extraction with optional corrections
   */
  @Patch(':id/confirm-extraction')
  async confirmExtraction(
    @Param('id') id: string,
    @Body() dto: ConfirmExtractionDto,
    @User() user: CurrentUser,
  ) {
    const caseRecord = await this.casesService.findOne(id, user.tenantId);

    // Log feedback if corrections were made
    if (dto.corrections && Object.keys(dto.corrections).length > 0) {
      await this.feedbackService.logCorrections({
        caseId: id,
        tenantId: user.tenantId,
        userId: user.email,
        originalExtraction: caseRecord.extractedFields,
        userCorrections: dto.corrections.extractedFields || dto.corrections,
      });
    }

    // Determine the title to use
    let finalTitle = caseRecord.title; // Use existing suggested title by default
    if (dto.corrections?.selectedTitleField && dto.corrections?.extractedFields) {
      const selectedFieldValue = dto.corrections.extractedFields[dto.corrections.selectedTitleField];
      if (selectedFieldValue) {
        finalTitle = selectedFieldValue;
      }
    }

    // Update case with corrections and activate (following Phase 1 update pattern)
    const updateData = {
      extractedFields: dto.corrections?.extractedFields || caseRecord.extractedFields,
      title: finalTitle,
      status: 'active' as const,
    };

    await this.casesService.update(id, user.tenantId, updateData);

    return {
      success: true,
      message: 'Case confirmed and activated',
    };
  }

  /**
   * NEW: Reject extraction (user will enter data manually)
   */
  @Post(':id/reject-extraction')
  async rejectExtraction(
    @Param('id') id: string,
    @Body() dto: RejectExtractionDto,
    @User() user: CurrentUser,
  ) {
    await this.casesService.update(id, user.tenantId, {
      status: 'rejected' as const,
      extractionMetadata: {
        rejectionReason: dto.reason,
        ...dto.metadata,
      },
    });

    return {
      success: true,
      message: 'Extraction rejected. Please use manual entry.',
    };
  }
}
