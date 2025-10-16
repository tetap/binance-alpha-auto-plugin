import { proxy, useSnapshot } from "valtio";
import { storage } from "./storage";
import { merge } from "lodash-es";

export type ITodayDealStorage = Record<string, string>;

export const TodayDealStorage = proxy<ITodayDealStorage>({});

export const useTodayDealStorage = () => useSnapshot(TodayDealStorage);

export const setTodayDealStorage = (data: ITodayDealStorage) => {
  merge(TodayDealStorage, data, {});
  storage.todayMulDeal.set(data);
};

export const initTodayDealStorage = () => {
  const data = storage.todayMulDeal.get() as Record<string, string>;
  console.log("data", data);
  if (!data) return;
  setTodayDealStorage(data);
};

export const updateTodayDealStorage = (day: string, value: string) => {
  let val = TodayDealStorage[day];
  if (val) {
    val = (Number(val) + Number(value)).toString();
  } else {
    val = value;
  }
  TodayDealStorage[day] = val;
  storage.todayMulDeal.set(TodayDealStorage);
};
