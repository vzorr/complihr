import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationSettings } from './entities/organization-settings.entity';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

@Injectable()
export class OrganizationSettingsService {
  constructor(
    @InjectRepository(OrganizationSettings)
    private readonly organizationSettingsRepository: Repository<OrganizationSettings>,
  ) {}

  async get(organizationId: number = 1): Promise<OrganizationSettings> {
    let settings = await this.organizationSettingsRepository.findOne({
      where: { organizationId },
    });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = this.organizationSettingsRepository.create({
        organizationId,
      });
      settings = await this.organizationSettingsRepository.save(settings);
    }

    return settings;
  }

  async update(
    updateDto: UpdateOrganizationSettingsDto,
    organizationId: number = 1,
  ): Promise<OrganizationSettings> {
    let settings = await this.organizationSettingsRepository.findOne({
      where: { organizationId },
    });

    if (!settings) {
      settings = this.organizationSettingsRepository.create({
        organizationId,
        ...updateDto,
      });
    } else {
      Object.assign(settings, updateDto);
    }

    return await this.organizationSettingsRepository.save(settings);
  }

  async incrementSequence(
    sequenceField: string,
    organizationId: number = 1,
  ): Promise<number> {
    const settings = await this.get(organizationId);

    if (!settings.hasOwnProperty(sequenceField)) {
      throw new NotFoundException(`Sequence field ${sequenceField} not found`);
    }

    // Increment the sequence
    (settings as any)[sequenceField] = ((settings as any)[sequenceField] || 0) + 1;

    await this.organizationSettingsRepository.save(settings);

    return (settings as any)[sequenceField];
  }
}
