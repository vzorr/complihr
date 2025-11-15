import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClockEvent } from './entities/clock-event.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ClockEvent)
    private readonly clockEventRepository: Repository<ClockEvent>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepository: Repository<AttendanceRecord>,
  ) {}

  async clockIn(clockInDto: ClockInDto): Promise<ClockEvent> {
    // Check if employee already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingClockIn = await this.clockEventRepository.findOne({
      where: {
        employeeId: clockInDto.employeeId,
        eventType: 'clock_in',
        eventTimestamp: Between(today, tomorrow),
      },
      order: {
        eventTimestamp: 'DESC',
      },
    });

    if (existingClockIn) {
      // Check if already clocked out
      const existingClockOut = await this.clockEventRepository.findOne({
        where: {
          employeeId: clockInDto.employeeId,
          eventType: 'clock_out',
          eventTimestamp: Between(existingClockIn.eventTimestamp, tomorrow),
        },
      });

      if (!existingClockOut) {
        throw new BadRequestException('Employee already clocked in for today');
      }
    }

    const clockEvent = this.clockEventRepository.create({
      ...clockInDto,
      eventType: 'clock_in',
      eventTimestamp: new Date(),
    });

    const savedEvent = (await this.clockEventRepository.save(clockEvent)) as unknown as ClockEvent;

    // Create or update attendance record
    await this.updateAttendanceRecord(clockInDto.employeeId, today);

    return savedEvent;
  }

  async clockOut(clockOutDto: ClockOutDto): Promise<ClockEvent> {
    // Find the most recent clock-in for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastClockIn = await this.clockEventRepository.findOne({
      where: {
        employeeId: clockOutDto.employeeId,
        eventType: 'clock_in',
        eventTimestamp: Between(today, tomorrow),
      },
      order: {
        eventTimestamp: 'DESC',
      },
    });

    if (!lastClockIn) {
      throw new BadRequestException('No clock-in found for today');
    }

    // Check if already clocked out
    const existingClockOut = await this.clockEventRepository.findOne({
      where: {
        employeeId: clockOutDto.employeeId,
        eventType: 'clock_out',
        eventTimestamp: Between(lastClockIn.eventTimestamp, tomorrow),
      },
    });

    if (existingClockOut) {
      throw new BadRequestException('Employee already clocked out');
    }

    const clockEvent = this.clockEventRepository.create({
      ...clockOutDto,
      eventType: 'clock_out',
      eventTimestamp: new Date(),
    });

    const savedEvent = (await this.clockEventRepository.save(clockEvent)) as unknown as ClockEvent;

    // Update attendance record
    await this.updateAttendanceRecord(clockOutDto.employeeId, today);

    return savedEvent;
  }

  private async updateAttendanceRecord(
    employeeId: number,
    date: Date,
  ): Promise<void> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const tomorrow = new Date(dateOnly);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all clock events for the day
    const clockEvents = await this.clockEventRepository.find({
      where: {
        employeeId,
        eventTimestamp: Between(dateOnly, tomorrow),
      },
      order: {
        eventTimestamp: 'ASC',
      },
    });

    if (clockEvents.length === 0) {
      return;
    }

    // Find clock in and clock out
    const clockIn = clockEvents.find((e) => e.eventType === 'clock_in');
    const clockOut = clockEvents.find((e) => e.eventType === 'clock_out');

    let totalWorkMinutes: number | null = null;
    let attendanceStatus = 'present';

    if (clockIn && clockOut) {
      const workMs = clockOut.eventTimestamp.getTime() - clockIn.eventTimestamp.getTime();
      totalWorkMinutes = Math.floor(workMs / (1000 * 60));
      attendanceStatus = 'present';
    } else if (clockIn && !clockOut) {
      attendanceStatus = 'present'; // Still working
    }

    // Find or create attendance record
    let attendanceRecord = await this.attendanceRecordRepository.findOne({
      where: {
        employeeId,
        attendanceDate: dateOnly,
      },
    });

    if (!attendanceRecord) {
      attendanceRecord = this.attendanceRecordRepository.create({
        employeeId,
        attendanceDate: dateOnly,
      });
    }

    attendanceRecord.clockInTime = clockIn?.eventTimestamp || null;
    attendanceRecord.clockOutTime = clockOut?.eventTimestamp || null;
    attendanceRecord.totalWorkMinutes = totalWorkMinutes;
    attendanceRecord.attendanceStatus = attendanceStatus;

    await this.attendanceRecordRepository.save(attendanceRecord);
  }

  async getAttendanceRecords(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: AttendanceRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.attendanceRecordRepository
      .createQueryBuilder('attendance_record')
      .leftJoinAndSelect('attendance_record.employee', 'employee')
      .leftJoinAndSelect('attendance_record.approvedBy', 'approvedBy');

    if (employeeId) {
      queryBuilder.andWhere('attendance_record.employeeId = :employeeId', { employeeId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'attendance_record.attendanceDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attendance_record.attendanceDate', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAttendanceByPublicId(publicId: string): Promise<AttendanceRecord> {
    const record = await this.attendanceRecordRepository.findOne({
      where: { publicId },
      relations: ['employee', 'approvedBy'],
    });

    if (!record) {
      throw new NotFoundException(`Attendance record not found`);
    }

    return record;
  }

  async getTodayAttendance(employeeId: number): Promise<AttendanceRecord | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.attendanceRecordRepository.findOne({
      where: {
        employeeId,
        attendanceDate: today,
      },
      relations: ['employee'],
    });
  }

  async getClockStatus(employeeId: number): Promise<{
    isClockedIn: boolean;
    lastClockIn?: Date;
    lastClockOut?: Date;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastClockIn = await this.clockEventRepository.findOne({
      where: {
        employeeId,
        eventType: 'clock_in',
        eventTimestamp: Between(today, tomorrow),
      },
      order: {
        eventTimestamp: 'DESC',
      },
    });

    if (!lastClockIn) {
      return { isClockedIn: false };
    }

    const lastClockOut = await this.clockEventRepository.findOne({
      where: {
        employeeId,
        eventType: 'clock_out',
        eventTimestamp: Between(lastClockIn.eventTimestamp, tomorrow),
      },
      order: {
        eventTimestamp: 'DESC',
      },
    });

    return {
      isClockedIn: !lastClockOut,
      lastClockIn: lastClockIn.eventTimestamp,
      lastClockOut: lastClockOut?.eventTimestamp,
    };
  }
}
