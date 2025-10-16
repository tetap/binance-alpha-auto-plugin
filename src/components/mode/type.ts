import { extend } from "dayjs";
import utc from "dayjs/plugin/utc";

extend(utc);

export interface IPanelProps {
  setCurrentBalance: (balance: string) => void;
  startBalance: string;
  setStartBalance: (balance: string) => void;
  runing: boolean;
  setRuning: (runing: boolean) => void;
  appendLog: (msg: string, type: "success" | "error" | "info") => void;
  options: IOptions;
}

export interface IOptions {
  mode: "reverse" | "order";
  minDiscount: string;
  maxDiscount: string;
  runType: "sum" | "price";
  runNum: string;
  runPrice: string;
  timeout: string;
  orderAmountMode: "Fixed" | "Random";
  amount: string;
  minAmount: string;
  maxAmount: string;
  minSleep: string;
  maxSleep: string;
  api: string;
  secret: string;
}
