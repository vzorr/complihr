import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return (await this.documentRepository.save(document)) as unknown as Document;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    documentType?: string,
  ): Promise<{
    data: Document[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.employee', 'employee')
      .leftJoinAndSelect('document.verifiedBy', 'verifiedBy');

    if (employeeId) {
      queryBuilder.andWhere('document.employeeId = :employeeId', { employeeId });
    }

    if (documentType) {
      queryBuilder.andWhere('document.documentType = :documentType', { documentType });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('document.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { publicId },
      relations: ['employee', 'verifiedBy'],
    });

    if (!document) {
      throw new NotFoundException(`Document not found`);
    }

    return document;
  }

  async updateByPublicId(
    publicId: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<Document> {
    const document = await this.findByPublicId(publicId);
    Object.assign(document, updateDocumentDto);
    return await this.documentRepository.save(document);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const document = await this.findByPublicId(publicId);
    await this.documentRepository.remove(document);
  }

  async verify(publicId: string, verifierId: number): Promise<Document> {
    const document = await this.findByPublicId(publicId);
    document.isVerified = true;
    document.verifiedById = verifierId;
    document.verifiedAt = new Date();
    return await this.documentRepository.save(document);
  }
}
