import { proxy, useSnapshot } from "valtio";
import { storage } from "./storage";
import { merge } from "lodash-es";

export type ITodayNoMulDealStorage = Record<string, string>;

export const TodayNoMulDealStorage = proxy<ITodayNoMulDealStorage>({});

export const useTodayNoMulDealStorage = () => useSnapshot(TodayNoMulDealStorage);

export const setTodayNoMulDealStorage = (data: ITodayNoMulDealStorage) => {
  merge(TodayNoMulDealStorage, data, {});
  storage.todayNoMulDeal.set(data);
};

export const initTodayNoMulDealStorage = () => {
  const data = storage.todayNoMulDeal.get() as Record<string, string>;
  console.log("data", data);
  if (!data) return;
  setTodayNoMulDealStorage(data);
};

export const updateTodayNoMulDealStorage = (day: string, value: string) => {
  let val = TodayNoMulDealStorage[day];
  if (val) {
    val = (Number(val) + Number(value)).toString();
  } else {
    val = value;
  }
  TodayNoMulDealStorage[day] = val;
  storage.todayNoMulDeal.set(TodayNoMulDealStorage);
};
