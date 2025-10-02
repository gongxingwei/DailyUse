import { MFADevice } from '@dailyuse/domain-server';
import { prisma } from '../../../../../config/prisma';
import type { IMFADeviceRepository } from '@dailyuse/domain-server';
import { AuthenticationContracts } from '@dailyuse/contracts';

type MFADevicePersistenceDTO = AuthenticationContracts.MFADevicePersistenceDTO;

export class PrismaMFADeviceRepository implements IMFADeviceRepository {
  async save(device: MFADevice): Promise<void> {
    const deviceData = device.toDatabase();

    await prisma.mFADevice.upsert({
      where: { uuid: device.uuid },
      update: {
        type: deviceData.type,
        name: deviceData.name,
        secretKey: deviceData.secretKey,
        phoneNumber: deviceData.phoneNumber,
        emailAddress: deviceData.emailAddress,
        isVerified: deviceData.isVerified === 1,
        isEnabled: deviceData.isEnabled === 1,
        lastUsedAt: deviceData.lastUsedAt ? new Date(deviceData.lastUsedAt) : null,
        verificationAttempts: deviceData.verificationAttempts,
        maxAttempts: deviceData.maxAttempts,
      },
      create: {
        uuid: deviceData.uuid,
        accountUuid: deviceData.accountUuid,
        type: deviceData.type,
        name: deviceData.name,
        secretKey: deviceData.secretKey,
        phoneNumber: deviceData.phoneNumber,
        emailAddress: deviceData.emailAddress,
        isVerified: deviceData.isVerified === 1,
        isEnabled: deviceData.isEnabled === 1,
        createdAt: new Date(deviceData.createdAt),
        lastUsedAt: deviceData.lastUsedAt ? new Date(deviceData.lastUsedAt) : null,
        verificationAttempts: deviceData.verificationAttempts,
        maxAttempts: deviceData.maxAttempts,
      },
    });
  }

  async findById(deviceUuid: string): Promise<MFADevicePersistenceDTO | null> {
    const deviceData = await prisma.mFADevice.findUnique({
      where: { uuid: deviceUuid },
    });

    if (!deviceData) {
      return null;
    }

    return this.mapToPersistenceDTO(deviceData);
  }

  async findByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findEnabledByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isEnabled: true,
        isVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToPersistenceDTO(data));
  }

  async findVerifiedByAccountUuid(accountUuid: string): Promise<MFADevicePersistenceDTO[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        isVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToPersistenceDTO(data));
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

  async findByAccountUuidAndType(
    accountUuid: string,
    deviceType: string,
  ): Promise<MFADevicePersistenceDTO[]> {
    const devicesData = await prisma.mFADevice.findMany({
      where: {
        accountUuid,
        type: deviceType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return devicesData.map((data) => this.mapToPersistenceDTO(data));
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

  /**
   * 将数据库原始数据映射为持久化 DTO
   * 仅负责数据格式转换，不包含业务逻辑
   */
  private mapToPersistenceDTO(data: any): MFADevicePersistenceDTO {
    return {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      type: data.type,
      name: data.name,
      secretKey: data.secretKey,
      phoneNumber: data.phoneNumber,
      emailAddress: data.emailAddress,
      isVerified: data.isVerified ? 1 : 0,
      isEnabled: data.isEnabled ? 1 : 0,
      createdAt: data.createdAt.getTime(),
      lastUsedAt: data.lastUsedAt ? data.lastUsedAt.getTime() : undefined,
      verificationAttempts: data.verificationAttempts || 0,
      maxAttempts: data.maxAttempts || 5,
    };
  }
}
