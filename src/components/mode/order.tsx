import {
  sleepToMs,
  backSell,
  callSubmit,
  checkMarketStable,
  checkMfa,
  checkOrder,
  getAlphaId,
  getBalance,
  getPrice,
  setLimitTotal,
  setPrice,
} from "@/core/binance";
import { Button } from "../ui/button";
import { useRef } from "react";
import { updateTodayDealStorage } from "@/store/today-deal-storage";
import { updateTodayNoMulDealStorage } from "@/store/today-no-mul-deal-storage";
import dayjs, { extend } from "dayjs";
import utc from "dayjs/plugin/utc";
import { floor } from "lodash-es";

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

extend(utc);

export const OrderMode = ({
  setCurrentBalance,
  setStartBalance,
  runing,
  setRuning,
  appendLog,
  options,
}: IPanelProps) => {
  const stopRef = useRef(false);
  const startStartBalance = useRef(false);

  const run = async () => {
    if (runing) {
      stopRef.current = true;
      return appendLog("正在停止中，请等待本轮结束", "error");
    }
    setRuning(true);
    stopRef.current = false;
    const api = options.api;

    try {
      const { symbol, mul } = await getAlphaId(api);
      appendLog(`获取到货币id: ${symbol} 积分乘数: ${mul}`, "info");

      const runType = options.runType;

      let runNum = options.runNum ? Number(options.runNum) : 1; // 运行次数

      // const runPrice = options.runPrice ? Number(options.runPrice) : 1; // 运行金额

      if (runType === "price") {
        runNum = Number.MAX_VALUE;
      }

      const timeout = options.timeout ? Number(options.timeout) : 1; // 下单超时时间

      const minSleep = options.maxSleep ? Number(options.minSleep) : 1;

      const maxSleep = options.maxSleep ? Number(options.maxSleep) : 5;

      for (let i = 0; i < runNum; i++) {
        const day = dayjs().utc().format("YYYY-MM-DD");

        if (stopRef.current) {
          appendLog("执行中止", "error");
          break;
        }
        const sleepTime =
          Math.floor(Math.random() * (maxSleep - minSleep + 1) + minSleep) *
          1000;
        // 随机等待时长
        await sleepToMs(sleepTime);

        appendLog(`当前轮次: ${i + 1} 随机等待时长${sleepTime}ms`, "info");

        // #region 兜底策略
        // 前往卖出
        await backSell(api, symbol, options.secret, appendLog, timeout);
        // #endregion 兜底策略

        // #region 获取余额
        const balance = await getBalance();
        appendLog(`当前余额: ${balance}`, "info");
        if (!balance) throw new Error("获取余额失败");

        await sleepToMs(1000);
        if (!startStartBalance.current) {
          startStartBalance.current = true;
          setStartBalance(balance);
        }
        setCurrentBalance(balance);
        // #endregion 获取余额

        // #region 买入流程
        const stable = await checkMarketStable(api, symbol);

        if (!stable.stable) {
          appendLog(stable.message, "error");
          i--;
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
          continue;
        } else {
          appendLog(stable.message, "success");
        }

        let buyPrice = await getPrice(symbol, api);

        appendLog(`获取到买入价格: ${buyPrice}`, "info");

        buyPrice =
          stable.trend === "上涨趋势"
            ? (Number(buyPrice) + Number(buyPrice) * 0.0001).toString()
            : buyPrice; // 调整买入价

        await setPrice(buyPrice);

        // 计算买入金额
        const amount =
          options.orderAmountMode === "Fixed"
            ? options.amount
            : floor(
                (Number(options.maxAmount) - Number(options.minAmount)) *
                  Math.random() +
                  Number(options.minAmount),
                2
              ).toString();
        // 设置买入金额
        await setLimitTotal(amount);

        await callSubmit(timeout * 1000);

        await checkMfa(options.secret);

        await checkOrder((timeout - 2) * 1000); // 监听订单

        updateTodayDealStorage(day, (Number(amount) * mul).toString());

        updateTodayNoMulDealStorage(day, amount);

        appendLog(`限价买单已成交 ${buyPrice} - ${amount}`, "success");
        // #endregion 买入流程

        // #region 使用兜底卖出即可
        await backSell(api, symbol, options.secret, appendLog, timeout);

        await sleepToMs(sleepTime);
        // #endregion 使用兜底卖出即可
      }

      // #region 兜底策略
      // 前往卖出
      await backSell(api, symbol, options.secret, appendLog, timeout);
      // #endregion 兜底策略

      await sleepToMs(0);

      // #region 获取余额
      const balance = await getBalance();
      appendLog(`当前余额: ${balance}`, "info");
      if (!balance) throw new Error("获取余额失败");
      if (!startStartBalance.current) {
        startStartBalance.current = true;
        setStartBalance(balance);
      }
      setCurrentBalance(balance);
      // #endregion 获取余额

      appendLog("执行结束", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        appendLog(error.message, "error");
      }
    }
    stopRef.current = false;
    setRuning(false);
  };

  return (
    <div className="flex-none pb-2 mt-2">
      <Button className="w-full" onClick={run}>
        {runing ? "终止执行" : "开始执行"}
      </Button>
    </div>
  );
};
