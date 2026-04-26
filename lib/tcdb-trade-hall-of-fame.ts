import "server-only";

import {
  listTcdbTradeHallOfFameInductionsFromDb,
  listTcdbTradeHallOfFamersFromDb,
  type TcdbTradeHallOfFameInduction,
  type TcdbTradeHallOfFamer,
} from "@/lib/tcdb-trade-hall-of-fame-db";

export type { TcdbTradeHallOfFameInduction, TcdbTradeHallOfFamer };

export async function listTcdbTradeHallOfFamers(): Promise<
  TcdbTradeHallOfFamer[]
> {
  return listTcdbTradeHallOfFamersFromDb();
}

export async function listTcdbTradeHallOfFameInductions(): Promise<
  TcdbTradeHallOfFameInduction[]
> {
  return listTcdbTradeHallOfFameInductionsFromDb();
}
