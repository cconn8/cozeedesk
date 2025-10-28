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
import { UpdateCaseWithExtractionDto } from './dto/update-case-with-extraction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, CurrentUser } from '../auth/decorators/user.decorator';
import { StorageService } from '../storage/storage.service';
import { ExtractionQueueService } from '../extraction/services/extraction-queue.service';
import { FeedbackService } from '../extraction/services/feedback.service';
import { TemplatesService } from '../templates/templates.service';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly storageService: StorageService,
    private readonly extractionQueueService: ExtractionQueueService,
    private readonly feedbackService: FeedbackService,
    private readonly templatesService: TemplatesService,
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
      throw new BadRequestException('Case is not ready for verification');
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
   * Save case with extracted data after user verification
   * Simplified workflow: no accept/reject, just save the final data
   */
  @Patch(':id/save-extraction')
  async saveExtraction(
    @Param('id') id: string,
    @Body() dto: UpdateCaseWithExtractionDto,
    @User() user: CurrentUser,
  ) {
    console.log(`[CasesController:saveExtraction] Processing case ${id} for tenant ${user.tenantId}`);
    
    const caseRecord = await this.casesService.findOne(id, user.tenantId);

    if (caseRecord.status !== 'pending_verification') {
      console.log(`[CasesController:saveExtraction] Invalid status: ${caseRecord.status}`);
      throw new BadRequestException('Case is not ready for saving');
    }

    // Log feedback if corrections were made from original extraction
    if (dto.extractedFields) {
      const originalFields = caseRecord.extractedFields || {};
      const corrections: Record<string, string> = {};
      
      // Find fields that were changed
      Object.keys(dto.extractedFields).forEach(key => {
        if (dto.extractedFields![key] !== originalFields[key]) {
          corrections[key] = dto.extractedFields![key];
        }
      });

      if (Object.keys(corrections).length > 0) {
        console.log(`[CasesController:saveExtraction] Logging ${Object.keys(corrections).length} field corrections`);
        await this.feedbackService.logCorrections({
          caseId: id,
          tenantId: user.tenantId,
          userId: user.email,
          originalExtraction: originalFields,
          userCorrections: corrections,
        });
      }
    }

    // Create template if requested
    if (dto.saveAsTemplate && dto.extractedFields) {
      console.log(`[CasesController:saveExtraction] Creating template: ${dto.saveAsTemplate.name}`);
      
      await this.templatesService.create({
        tenantId: user.tenantId,
        name: dto.saveAsTemplate.name,
        type: dto.saveAsTemplate.type,
        extractedFieldKeys: Object.keys(dto.extractedFields),
        titleField: dto.saveAsTemplate.titleField,
        createdBy: user.userId,
      });
    }

    // Update case with final data and activate
    const updateData = {
      extractedFields: dto.extractedFields || caseRecord.extractedFields,
      title: dto.title || caseRecord.title,
      status: 'active' as const,
    };

    console.log(`[CasesController:saveExtraction] Activating case with title: ${updateData.title}`);
    await this.casesService.update(id, user.tenantId, updateData);

    return {
      success: true,
      message: 'Case saved and activated successfully',
    };
  }

  /**
   * Discard extracted data and remove case
   * This replaces the "reject" functionality with a simple delete
   */
  @Delete(':id/discard')
  async discardCase(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    console.log(`[CasesController:discardCase] Discarding case ${id} for tenant ${user.tenantId}`);
    
    const caseRecord = await this.casesService.findOne(id, user.tenantId);

    // Only allow discarding of processing or pending_verification cases
    if (!['processing', 'pending_verification'].includes(caseRecord.status || '')) {
      throw new BadRequestException('Can only discard cases that are processing or pending verification');
    }

    // Remove the case entirely
    await this.casesService.remove(id, user.tenantId);

    return {
      success: true,
      message: 'Case discarded successfully',
    };
  }
}
