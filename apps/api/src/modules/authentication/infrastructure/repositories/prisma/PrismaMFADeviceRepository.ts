import { MFADevice } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { IMFADeviceRepository } from '@dailyuse/domain-server';

export class PrismaMFADeviceRepository implements IMFADeviceRepository {
  async save(device: MFADevice): Promise<void> {
    const deviceData = {
      uuid: device.uuid,
      accountUuid: device.accountUuid,
      type: device.type,
      name: device.name,
      secretKey: device.secretKey,
      phoneNumber: device.phoneNumber,
      emailAddress: device.emailAddress,
      isVerified: device.isVerified,
      isEnabled: device.isEnabled,
      createdAt: device.createdAt,
      lastUsedAt: device.lastUsedAt,
    };

    await prisma.mFADevice.upsert({
      where: { uuid: device.uuid },
      update: deviceData,
      create: deviceData,
    });
  }

  async findById(deviceUuid: string): Promise<MFADevice | null> {
    const deviceData = await prisma.mFADevice.findUnique({
      where: { uuid: deviceUuid },
    });

    if (!deviceData) {
      return null;
    }

    return this.mapToDevice(deviceData);
  }

  async findByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToDevice(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToDevice(data));
  }

  async findEnabledByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isEnabled: true,
        isVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToDevice(data));
  }

  async findVerifiedByAccountUuid(accountUuid: string): Promise<MFADevice[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToDevice(data));
  }

  async existsEnabledByAccountUuid(accountUuid: string): Promise<boolean> {
    const count = await prisma.mFADevice.count({
      where: {
        accountUuid,
        isEnabled: true,
        isVerified: true,
      },
    });

    return count > 0;
  }

  async findByAccountUuidAndType(accountUuid: string, deviceType: string): Promise<MFADevice[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        type: deviceType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToDevice(data));
  }

  async delete(deviceUuid: string): Promise<void> {
    await prisma.mFADevice.delete({
      where: { uuid: deviceUuid },
    });
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    await prisma.mFADevice.deleteMany({
      where: { accountUuid },
    });
  }

  private mapToDevice(data: any): MFADevice {
    // Create device using fromDatabase method which matches the structure
    const device = new MFADevice({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      type: data.type,
      name: data.name,
      maxAttempts: data.maxAttempts || 5,
    });

    // Set all properties that were loaded from database
    (device as any)._secretKey = data.secretKey;
    (device as any)._phoneNumber = data.phoneNumber;
    (device as any)._emailAddress = data.emailAddress;
    (device as any)._isVerified = data.isVerified;
    (device as any)._isEnabled = data.isEnabled;
    (device as any)._verificationAttempts = data.verificationAttempts || 0;
    (device as any)._createdAt = data.createdAt;
    (device as any)._lastUsedAt = data.lastUsedAt;

    return device;
  }
}
