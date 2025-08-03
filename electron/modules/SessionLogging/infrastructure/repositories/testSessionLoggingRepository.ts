import { SqliteSessionLoggingRepository } from "./sqliteSessionLoggingRepository";
import { SessionLog } from "../../domain/aggregates/sessionLog";
import { IPLocation } from "../../domain/valueObjects/ipLocation";
import { OperationType, OperationStatus } from "@common/modules/sessionLog/types/sessionLog";

// 创建仓库实例
const repo = new SqliteSessionLoggingRepository();

async function test() {
  // 构造一个 SessionLog 实体
  const ipLocation = new IPLocation({
    ipAddress: "127.0.0.1",
    country: "China",
    region: "Beijing",
    city: "Beijing",
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: "Asia/Shanghai",
    isp: "ChinaNet"
  });

  const sessionLog = new SessionLog({
    accountUuid: "test-account-uuid",
    operationType: OperationType.LOGIN,
    operationStatus: OperationStatus.SUCCESS,
    deviceInfo: "test-device",
    ipLocation,
    userAgent: "test-agent"
  });

  // 保存
  await repo.save(sessionLog);
  console.log("Saved sessionLog:", sessionLog);

  // 查询
  const found = await repo.findById(sessionLog.uuid);
  console.log("Found by id:", found);

  // 查询所有
  const all = await repo.findByAccountUuid("test-account-uuid");
  console.log("All by accountUuid:", all);

  // 删除
  await repo.delete(sessionLog.uuid);
  console.log("Deleted sessionLog:", sessionLog.uuid);
}

test().catch(console.error);