import { useLayoutEffect, useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import { useLogger } from "./hooks/useLogger";
import { cn } from "./lib/utils";
import { OrderMode } from "./components/mode/order";
import { ReverseMode } from "./components/mode/reverse";
import {
  initTodayDealStorage,
  useTodayDealStorage,
} from "./store/today-deal-storage";
import dayjs from "dayjs";
import {
  initTodayNoMulDealStorage,
  useTodayNoMulDealStorage,
} from "./store/today-no-mul-deal-storage";
import type { IOptions } from "./components/mode/type";
import { AssistsX } from "assistsx-js";

function App() {
  const [runing, setRuning] = useState(false);
  const [options, setOptions] = useState<IOptions>(null!);
  const { render, appendLog, clearLogger } = useLogger();

  const todayDealStore = useTodayDealStorage();

  const todayNoMulDealStore = useTodayNoMulDealStorage();

  // 开始余额
  const [startBalance, setStartBalance] = useState("");
  // 当前余额
  const [currentBalance, setCurrentBalance] = useState("");
  // 损耗
  const loss = useMemo(() => {
    const b1 = currentBalance.replace(/,/g, "");
    const b2 = startBalance.replace(/,/g, "");
    return Number(b1) - Number(b2);
  }, [currentBalance, startBalance]);

  const todayDeal = useMemo(() => {
    const day = dayjs().utc().format("YYYY-MM-DD");
    return todayDealStore[day] ?? "0";
  }, [todayDealStore]);

  const todayNoMulDeal = useMemo(() => {
    const day = dayjs().utc().format("YYYY-MM-DD");
    return todayNoMulDealStore[day] ?? "0";
  }, [todayNoMulDealStore]);

  useLayoutEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const options = {
      mode: (searchParams.get("mode") || "reverse") as "reverse" | "order", // 运行类型
      minDiscount: searchParams.get("minDiscount") || "0.3", // 最低折扣 %
      maxDiscount: searchParams.get("maxDiscount") || "1", // 最高折扣 %
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
    appendLog("版本号: v1.0.2", "success");
    appendLog(
      `当前模式: ${options.mode === "order" ? "限价单" : "反向订单"}`,
      "success"
    );
    initTodayDealStorage();
    initTodayNoMulDealStorage();
    setOptions(options);
    AssistsX.launchApp("com.binance.dev");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-screen h-screen px-2 flex flex-col">
      <div className="flex-none pt-2">
        <div className="text-xs">
          <div>
            <div>
              当日积分交易额:
              <b className={cn("ml-1 text-green-500")}> {todayDeal}</b>
            </div>
            <div>
              当日交易额:
              <b className={cn("ml-1 text-green-500")}> {todayNoMulDeal}</b>
            </div>
          </div>
          <div>
            操作损耗:
            <b
              className={cn(
                "ml-1",
                loss > 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {" "}
              {loss}
            </b>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between py-2 flex-none">
        <div className="text-sm">日志输出</div>
        <div>
          <Button size={"sm"} onClick={clearLogger}>
            清空日志
          </Button>
        </div>
      </div>

      {render}

      {options?.mode === "order" && (
        <OrderMode
          setCurrentBalance={setCurrentBalance}
          setRuning={setRuning}
          setStartBalance={setStartBalance}
          startBalance={startBalance}
          runing={runing}
          appendLog={appendLog}
          options={options}
        />
      )}

      {options?.mode === "reverse" && (
        <ReverseMode
          setCurrentBalance={setCurrentBalance}
          setRuning={setRuning}
          setStartBalance={setStartBalance}
          startBalance={startBalance}
          runing={runing}
          appendLog={appendLog}
          options={options}
        />
      )}
    </div>
  );
}

export default App;
