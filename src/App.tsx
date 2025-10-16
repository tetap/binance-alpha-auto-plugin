import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { useLogger } from "./hooks/useLogger";
import {
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
  sleepToMs,
} from "./core/binance";
import { cn } from "./lib/utils";
import { floor } from "lodash-es";
import { AssistsX } from "assistsx-js";

interface IOptions {
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

function App() {
  const [runing, setRuning] = useState(false);
  const stopRef = useRef(false);
  const optionRef = useRef<IOptions>(null);
  const { render, appendLog, clearLogger } = useLogger();
  // 开始余额
  const [startBalance, setStartBalance] = useState("");
  // 当前余额
  const [currentBalance, setCurrentBalance] = useState("");
  // 损耗
  const loss = useMemo(() => {
    const b1 = currentBalance.replace(/,/g, "");
    const b2 = startBalance.replace(/,/g, "");
    console.log(b1, b2);
    return Number(b1) - Number(b2);
  }, [currentBalance, startBalance]);

  useLayoutEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const options = {
      runType: (searchParams.get("runType") || "sum") as "sum" | "price", // 运行类型
      runNum: searchParams.get("runNum") || "30", // 运行模式 sum 次数
      runPrice: searchParams.get("runPrice") || "65536", // 运行模式 运行到指定金额
      timeout: searchParams.get("timeout") || "2", // 订单超时时间
      orderAmountMode: (searchParams.get("orderAmountMode") || "Random") as
        | "Fixed"
        | "Random", // 固定金额 随机金额
      amount: searchParams.get("amount") || "100", // 固定金额模式下金额
      minAmount: searchParams.get("minAmount") || "120", // 随机金额模式下 最低随机金额
      maxAmount: searchParams.get("maxAmount") || "150", // 随机金额模式下 最高随机金额
      minSleep: searchParams.get("minSleep") || "2", // 最小时间延迟
      maxSleep: searchParams.get("maxSleep") || "3", // 最大时间延迟
      api: searchParams.get("api") || "https://www.binance.com", // api地址
      secret: searchParams.get("secret") || "", // mfa 密钥
    };
    appendLog("启动成功，请进入App交易页面操作", "success");
    optionRef.current = options;
    AssistsX.launchApp('com.binance.dev')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async () => {
    if (!optionRef.current) return appendLog("请检查当前环境是否正确", "error");
    if (runing) {
      stopRef.current = true;
      return appendLog("正在停止中，请等待本轮结束", "error");
    }
    setRuning(true);
    stopRef.current = false;
    const options = optionRef.current;
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
        if (!startBalance) setStartBalance(balance);
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

        await checkOrder("买单", timeout * 1000); // 监听订单

        appendLog(`限价买单已成交 ${buyPrice} - ${amount}`, "success");

        // await sleepToMs(sleepTime);
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
      if (!startBalance) setStartBalance(balance);
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
    <div className="w-screen h-screen px-2 flex flex-col">
      <div className="flex items-center justify-between py-2 flex-none">
        <div>日志输出</div>
        <div>
          <Button onClick={clearLogger}>清空日志</Button>
        </div>
      </div>

      {render}

      <div className="flex-none flex items-center justify-between py-2 text-xs">
        <div></div>
        <div>
          <div>
            操作损耗:
            <b className={cn(loss > 0 ? "text-green-500" : "text-red-500")}>
              {" "}
              {loss}
            </b>
          </div>
        </div>
      </div>

      <div className="flex-none pb-2">
        <Button className="w-full" onClick={run}>
          {runing ? "终止执行" : "开始执行"}
        </Button>
      </div>
    </div>
  );
}

export default App;
