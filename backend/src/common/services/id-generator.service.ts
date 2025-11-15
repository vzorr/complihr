import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

export interface IdPattern {
  pattern: string; // e.g., "EMP{YEAR}{SEQUENCE:5}"
  sequenceType: string; // e.g., "employee"
}

@Injectable()
export class IdGeneratorService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generate next business ID based on pattern
   *
   * Pattern Tokens:
   * - {YEAR} - Current year (2024)
   * - {YY} - Two-digit year (24)
   * - {MONTH} - Current month (01-12)
   * - {MM} - Two-digit month (01-12)
   * - {DAY} - Current day (01-31)
   * - {YYYYMMDD} - Full date (20240315)
   * - {SEQUENCE:N} - Auto-increment sequence padded to N digits
   * - {ORG} - Organization code
   * - {DEPT} - Department code
   *
   * Examples:
   * - "EMP{YEAR}{SEQUENCE:5}" → EMP202400001
   * - "PAY{YEAR}{MONTH}{SEQUENCE:4}" → PAY2024030001
   * - "{ORG}-EMP-{YY}{SEQUENCE:4}" → ACME-EMP-240001
   * - "LV{YYYYMMDD}{SEQUENCE:3}" → LV20240315001
   */
  async generateId(
    organizationId: number,
    pattern: string,
    sequenceType: string,
    context?: {
      orgCode?: string;
      deptCode?: string;
      customDate?: Date;
    },
  ): Promise<string> {
    const date = context?.customDate || new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Determine if sequence is monthly or yearly
    const isMonthlySequence = pattern.includes('{MONTH}') || pattern.includes('{MM}');

    // Get next sequence value
    const sequenceValue = await this.getNextSequenceValue(
      organizationId,
      sequenceType,
      year,
      isMonthlySequence ? month : null,
    );

    // Replace tokens
    let result = pattern;

    // Date tokens
    result = result.replace(/{YEAR}/g, year.toString());
    result = result.replace(/{YY}/g, year.toString().slice(-2));
    result = result.replace(/{MONTH}/g, month.toString().padStart(2, '0'));
    result = result.replace(/{MM}/g, month.toString().padStart(2, '0'));
    result = result.replace(/{DAY}/g, day.toString().padStart(2, '0'));
    result = result.replace(/{DD}/g, day.toString().padStart(2, '0'));
    result = result.replace(
      /{YYYYMMDD}/g,
      `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`,
    );

    // Context tokens
    if (context?.orgCode) {
      result = result.replace(/{ORG}/g, context.orgCode);
    }
    if (context?.deptCode) {
      result = result.replace(/{DEPT}/g, context.deptCode);
    }

    // Sequence token - {SEQUENCE:5} means 5-digit padded sequence
    const sequenceMatch = result.match(/{SEQUENCE:(\d+)}/);
    if (sequenceMatch) {
      const padding = parseInt(sequenceMatch[1]);
      const paddedSequence = sequenceValue.toString().padStart(padding, '0');
      result = result.replace(/{SEQUENCE:\d+}/g, paddedSequence);
    }

    return result;
  }

  /**
   * Get next sequence value using database function
   */
  private async getNextSequenceValue(
    organizationId: number,
    sequenceType: string,
    year: number,
    month: number | null,
  ): Promise<number> {
    const query = `
      SELECT admin.get_next_sequence_value($1, $2, $3, $4) as next_value
    `;

    const result = await this.dataSource.query(query, [
      organizationId,
      sequenceType,
      year,
      month,
    ]);

    return result[0].next_value;
  }

  /**
   * Validate ID pattern
   */
  validatePattern(pattern: string): { valid: boolean; error?: string } {
    const validTokens = [
      '{YEAR}',
      '{YY}',
      '{MONTH}',
      '{MM}',
      '{DAY}',
      '{DD}',
      '{YYYYMMDD}',
      '{ORG}',
      '{DEPT}',
    ];

    // Check for SEQUENCE token with proper format
    const hasSequence = /{SEQUENCE:\d+}/.test(pattern);
    if (!hasSequence) {
      return {
        valid: false,
        error: 'Pattern must include {SEQUENCE:N} where N is the padding length',
      };
    }

    // Check for invalid tokens
    const tokens = pattern.match(/{[^}]+}/g) || [];
    for (const token of tokens) {
      if (!validTokens.includes(token) && !/{SEQUENCE:\d+}/.test(token)) {
        return {
          valid: false,
          error: `Invalid token: ${token}. Valid tokens are: ${validTokens.join(', ')}, {SEQUENCE:N}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Preview what IDs will look like with current pattern
   */
  previewPattern(pattern: string, count: number = 5): string[] {
    const previews: string[] = [];
    const date = new Date();

    for (let i = 1; i <= count; i++) {
      let preview = pattern;

      // Replace date tokens
      preview = preview.replace(/{YEAR}/g, date.getFullYear().toString());
      preview = preview.replace(/{YY}/g, date.getFullYear().toString().slice(-2));
      preview = preview.replace(/{MONTH}/g, (date.getMonth() + 1).toString().padStart(2, '0'));
      preview = preview.replace(/{MM}/g, (date.getMonth() + 1).toString().padStart(2, '0'));
      preview = preview.replace(/{DAY}/g, date.getDate().toString().padStart(2, '0'));
      preview = preview.replace(/{DD}/g, date.getDate().toString().padStart(2, '0'));

      // Replace YYYYMMDD
      const yyyymmdd = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      preview = preview.replace(/{YYYYMMDD}/g, yyyymmdd);

      // Replace organization/department (with examples)
      preview = preview.replace(/{ORG}/g, 'ACME');
      preview = preview.replace(/{DEPT}/g, 'HR');

      // Replace sequence
      const sequenceMatch = preview.match(/{SEQUENCE:(\d+)}/);
      if (sequenceMatch) {
        const padding = parseInt(sequenceMatch[1]);
        preview = preview.replace(/{SEQUENCE:\d+}/g, i.toString().padStart(padding, '0'));
      }

      previews.push(preview);
    }

    return previews;
  }
}
