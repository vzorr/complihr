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
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('documents')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.create(createDocumentDto);
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true })) employeeId?: number,
    @Query('documentType') documentType?: string,
  ) {
    const result = await this.documentsService.findAll(
      page,
      limit,
      employeeId,
      documentType,
    );
    return {
      ...result,
      data: result.data.map((doc) =>
        plainToInstance(DocumentResponseDto, doc, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findByPublicId(publicId);
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.updateByPublicId(
      publicId,
      updateDocumentDto,
    );
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async remove(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.documentsService.removeByPublicId(publicId);
    return { message: 'Document deleted successfully' };
  }

  @Post(':publicId/verify')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async verify(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Request() req,
  ): Promise<DocumentResponseDto> {
    const verifierId = req.user.id;
    const document = await this.documentsService.verify(publicId, verifierId);
    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
    });
  }
}
