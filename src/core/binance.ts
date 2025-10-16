/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 *@description: 币安自动化
 *@author: tetap
 *@date-time: 2025-10-15 16:20:56
 */
import { AssistsXAsync } from "assistsx-js";

export const sleepToMs = (sleep: number) =>
  new Promise((resolve) => setTimeout(resolve, sleep));

// 获取当前Alpha代币名称
export const getAlpha = async () => {
  const alphas = await AssistsXAsync.findById(`com.binance.dev:id/2131441246`);
  if (!alphas.length) throw new Error("未找到alpha代币，请进入交易页面");
  const alpha = alphas[0];
  const text = alpha.text;
  return text;
};

// 获取当前Alpha代币ID
export const getAlphaId = async (api: string = "https://www.binance.com") => {
  const alpha = await getAlpha();
  api = api.lastIndexOf("/") === api.length - 1 ? api.slice(0, -1) : api;
  const listRequest = await fetch(
    `${api}/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list`
  );
  const list = (await listRequest.json()).data as {
    alphaId: string;
    symbol: string;
    mulPoint: number;
  }[];
  const cur = list.find((c) => c.symbol === alpha);
  if (!cur) throw new Error("未找到alpha代币ID，请联系开发者");
  return { symbol: `${cur.alphaId}USDT`, mul: cur.mulPoint };
};

export const jumpToBuy = async () => {
  const buy = (await AssistsXAsync.findByText("买入", {}))[0];
  return await buy.clickNodeByGesture({
    clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
  });
};

export const jumpToSell = async () => {
  const sell = (await AssistsXAsync.findByText("卖出", {}))[0];
  return await sell.clickNodeByGesture({
    clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
  });
};

// 获取余额
export const getBalance = async () => {
  await jumpToBuy();
  const el = await AssistsXAsync.findById("com.binance.dev:id/2131448176");
  if (!el.length) throw new Error("未找到余额，请进入交易页面");
  const text = el[0].text;
  return text.replace(" USDT", "");
};

// 设置卖出数量
export const setSellLimitTotal = async () => {
  const view = (
    await AssistsXAsync.findById("com.binance.dev:id/ks_amount")
  )[0];
  // 点击最右侧
  const bound = view.boundsInScreen;
  // 点击右侧
  await AssistsXAsync.clickByGesture(
    bound.right - 8,
    bound.top + bound.height / 2,
    Math.floor(Math.random() * (80 - 30 + 1)) + 30
  );
};

// 设置买入数量
export const setLimitTotal = async (value: string) => {
  const priceParent = (
    await AssistsXAsync.findById("com.binance.dev:id/2131431440")
  )[0];
  const group = priceParent.findByTags("android.view.ViewGroup")[0];
  const priceElm = group.findById("com.binance.dev:id/et_value")[0];
  await priceElm.clickNodeByGesture({ clickDuration: 30 });
  const inputParent = priceElm.findById("com.binance.dev:id/2131431761")[0];
  const input = inputParent.findById("com.binance.dev:id/2131431181")[0];
  input.setNodeText(value);
  await AssistsXAsync.back();
};

// 判断是否有需要卖出
export const getIsSell = async () => {
  await jumpToSell();
  await setSellLimitTotal();
  const priceParent = (
    await AssistsXAsync.findById("com.binance.dev:id/2131431440")
  )[0];
  if (!priceParent) throw new Error("未找到价格，请进入交易页面");
  const group = priceParent.findByTags("android.view.ViewGroup")[0];
  if (!group) throw new Error("未找到价格，请进入交易页面");
  const priceElm = group.findById("com.binance.dev:id/et_value")[0];
  if (!priceElm) throw new Error("未找到价格，请进入交易页面");
  const inputParent = priceElm.findById("com.binance.dev:id/2131431761")[0];
  if (!inputParent) return false;
  const input = inputParent.findById("com.binance.dev:id/2131431181")[0];
  if (!input) return false;
  if (parseFloat(input.text) >= 1) return true;
  return false;
};

export interface Trade {
  T: number; // 时间戳
  p: string; // 价格
  q: string; // 成交量
  m: boolean; // 是否卖方主动
}

// 获取价格
export const getPrice = async (symbol: string, api: string) => {
  api = api.lastIndexOf("/") === api.length - 1 ? api.slice(0, -1) : api;
  const request = await fetch(
    `${api}/bapi/defi/v1/public/alpha-trade/agg-trades?symbol=${symbol}&limit=1`
  );
  const json = (await request.json()) as { data: Trade[] };
  const cur = json.data[json.data.length - 1];
  return cur.p;
};

// 设置价格
export const setPrice = async (value: string) => {
  const priceParent = (
    await AssistsXAsync.findById("com.binance.dev:id/et_price")
  )[0];
  const group = priceParent.findByTags("android.view.ViewGroup")[0];
  const priceElm = group.findById("com.binance.dev:id/et_value")[0];
  const inputParent = priceElm.findById("com.binance.dev:id/2131431761")[0];
  const input = inputParent.findById("com.binance.dev:id/2131431181")[0];
  input.setNodeText(value);
};

// 提交
export const callSubmit = async (timeout: number) => {
  const btn = (
    await AssistsXAsync.findById("com.binance.dev:id/2131429052")
  )[0];
  await btn.clickNodeByGesture({
    clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
    offsetX: Math.floor(Math.random() * (10 - 5 + 1)) + 10,
    offsetY: Math.floor(Math.random() * (10 - 5 + 1)) + 10,
  });

  let time = 0;
  const sleep = 100;
  let isNext = false;
  while (true) {
    if (time >= timeout) {
      break;
    }
    time += sleep;
    const parent = (
      await AssistsXAsync.findById("com.binance.dev:id/2131430772")
    )[0];
    if (parent) {
      const group = parent.findByTags("android.view.ViewGroup")?.[0];
      if (group) {
        const btn = group.findById("com.binance.dev:id/btn_confirm")?.[0];
        if (btn) {
          isNext = await btn.clickNodeByGesture({
            clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
            offsetX: Math.floor(Math.random() * (10 - 5 + 1)) + 10,
            offsetY: Math.floor(Math.random() * (10 - 5 + 1)) + 10,
          });
        }
      }
    }
    await sleepToMs(sleep);
  }
  if (!isNext) {
    await AssistsXAsync.back();
    throw new Error("提交超时");
  }
};

// 二次验证
export const checkMfa = async (secret: string) => {
  await sleepToMs(2000);
  // 判断是否能拿到交易页面的一个组件？
  const priceParent = (
    await AssistsXAsync.findById("com.binance.dev:id/2131431440")
  )[0];
  if (priceParent) return true;
  while (true) {
    let nodes = await AssistsXAsync.findByTags("android.widget.LinearLayout");
    const nodeC = nodes[0];
    const childrens = nodeC.getNodes();
    const check =
      childrens.find((c) => c.text.includes("验证您的身份")) ||
      childrens.find((c) => c.viewId.includes("android.gms"));
    if (check) {
      await AssistsXAsync.back();
      await sleepToMs(300);
      nodes = await AssistsXAsync.getAllNodes();
      await sleepToMs(1000);
    }
    // 判断是否验证
    nodes = await AssistsXAsync.getAllNodes();
    const next = nodes.find((c) => c.text === "我的通行密钥无法使用");
    if (next && next.text === "我的通行密钥无法使用") {
      await next.clickNodeByGesture({
        clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
      });
      await sleepToMs(300);
    }
    const code = (window as any).otplib.authenticator.generate(secret);
    nodes = await AssistsXAsync.getAllNodes();
    const input = nodes.find((c) => c.className === "android.widget.EditText");
    if (input) {
      input.setNodeText(code);
      await sleepToMs(1000);
      return true;
    }
  }
};

export const checkOrder = async (timeout: number) => {
  let time = 0;
  const sleep = 300;
  let i = 0;
  while (true) {
    if (time >= timeout) {
      break;
    }
    const container = (
      await AssistsXAsync.findById("com.binance.dev:id/2131429833")
    )[0];
    if (!container) throw new Error("未找到订单页面(container)");
    container.scrollBackward();
    const parent = container.findById("com.binance.dev:id/2131440755")[0];
    if (!parent) throw new Error("未找到订单页面(parent)");
    const layout = parent.findByTags("android.widget.FrameLayout")[0];
    if (!layout) throw new Error("未找到订单页面(layout");
    const tab = layout.findById("com.binance.dev:id/2131441203")[0];
    if (!tab) throw new Error("未找到订单页面(tab)");
    const [tab1, tab2] = tab.getChildren();
    const curTab = i % 2 === 0 ? tab2 : tab1;
    await curTab.clickNodeByGesture({
      clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
    });
    await sleepToMs(sleep);
    const isok = await (async () => {
      const container = (
        await AssistsXAsync.findById("com.binance.dev:id/2131429833")
      )[0];
      const parent = container.findById("com.binance.dev:id/2131440755")[0];
      if (!parent) throw new Error("未找到订单页面");
      const layout = parent.findByTags("android.widget.FrameLayout")[0];
      if (!layout) throw new Error("未找到订单页面");
      const tab = layout.findById("com.binance.dev:id/2131441203")[0];
      if (!tab) throw new Error("未找到订单页面");
      const [tab1] = tab.getChildren();
      const text = tab1.text;
      const sizes = text.match(/\d+/g)?.map(Number);
      if (!sizes?.length) throw new Error("sizes is null");
      const size = sizes[0];
      if (size === 0) {
        return true;
      }
      return false;
    })();
    if (isok) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, sleep));
    i++;
    time += sleep;
  }
  // 最终兜底取消
  const cancelBtn = await AssistsXAsync.findById("com.binance.dev:id/tvCancel");
  // 无可取消订单 视为成功
  if (!cancelBtn.length) return true;
  const cancelAll = (await AssistsXAsync.findByText("撤销全部"))[0];
  if (cancelAll) {
    await cancelAll.clickNodeByGesture({
      clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const btn = (
      await AssistsXAsync.findById("com.binance.dev:id/2131428678")
    )[0];
    if (btn) {
      await btn.clickNodeByGesture({
        clickDuration: Math.floor(Math.random() * (80 - 30 + 1)) + 30,
      });
      throw new Error("订单超时");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("订单超时");
};

// 兜底卖出
export const backSell = async (
  api: string,
  symbol: string,
  secret: string,
  appendLog: (msg: string, type: "success" | "error" | "info") => void,
  timeout: number = 3
) => {
  while (true) {
    try {
      const isSell = await getIsSell();
      appendLog(`是否需要卖出：${isSell}`, "info");
      if (!isSell) return;
      const price = await getPrice(symbol, api); // 获取价格
      if (!price) throw new Error("获取价格失败");
      await jumpToSell();
      const sellPrice = (Number(price) - Number(price) * 0.00008).toString();
      await setPrice(sellPrice); // 设置价格
      await setSellLimitTotal(); // 设置卖出数量
      await callSubmit(timeout * 1000); // 提交
      await checkMfa(secret); // 二次验证
      await checkOrder((timeout - 2) * 1000); // 监听订单
      appendLog(`限价卖单已成交 ${sellPrice}`, "success");
      await sleepToMs(1000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        appendLog(error.message, "error");
      }
      await sleepToMs(1000);
    }
  }
};

// =====================
// Binance K线响应类型
// =====================
export interface AlphaKlineResponse {
  code: string;
  message: string | null;
  messageDetail: string | null;
  success: boolean;
  data: string[][];
}

// =====================
// 市场稳定性返回类型
// =====================
export interface MarketStabilityResult {
  symbol: string;
  interval: string;
  volatility: string; // 平均波动率
  slope: string; // 趋势斜率
  varVol: string; // 成交量波动系数
  stable: boolean; // 是否可刷分
  trend: "上涨趋势" | "下跌趋势" | "横盘震荡";
  message: string; // 可读提示
}

export const checkMarketStable = async (
  api: string,
  symbol: string, // ALPHA_175USDT
  interval = "1s",
  limit = 15
): Promise<MarketStabilityResult> => {
  api = api.lastIndexOf("/") === api.length - 1 ? api.slice(0, -1) : api;
  const url = `${api}/bapi/defi/v1/public/alpha-trade/klines?interval=${interval}&limit=${limit}&symbol=${symbol}`;
  const res = await fetch(url);
  const json: AlphaKlineResponse = await res.json();

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(`获取 ${symbol} 市场数据失败`);
  }

  const data = json.data;
  const closes = data.map((k) => parseFloat(k[4]));
  const highs = data.map((k) => parseFloat(k[2]));
  const lows = data.map((k) => parseFloat(k[3]));
  const opens = data.map((k) => parseFloat(k[1]));
  const volumes = data.map((k) => parseFloat(k[5]));

  // 平均波动率
  const volatility =
    highs.reduce((sum, h, i) => sum + (h - lows[i]) / opens[i], 0) /
    highs.length;

  // 成交量波动系数
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const varVol =
    Math.sqrt(
      volumes.map((v) => (v - avgVol) ** 2).reduce((a, b) => a + b, 0) /
        volumes.length
    ) / avgVol;

  // =====================
  // 滑动平均 + 加权 + 成交量确认
  // =====================
  const half = Math.floor(closes.length / 2);

  // 前半段普通平均
  const avgEarly = closes.slice(0, half).reduce((a, b) => a + b, 0) / half;

  // 后半段加权平均，最新K线权重更大
  const lateCloses = closes.slice(half);
  const lateWeights = lateCloses.map((_, i) => i + 1);
  const weightedLate =
    lateCloses.reduce((sum, price, i) => sum + price * lateWeights[i], 0) /
    lateWeights.reduce((a, b) => a + b, 0);

  // 均价斜率
  const slope = (weightedLate - avgEarly) / avgEarly;

  // 成交量确认
  const volEarly = volumes.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const volLate =
    volumes.slice(half).reduce((a, b) => a + b, 0) / (closes.length - half);
  const volRatio = volLate / volEarly;

  // 趋势方向（上下阈值分开）
  let trend: MarketStabilityResult["trend"] = "横盘震荡";
  const upThreshold = 0.0000025; // 上涨阈值
  const downThreshold = 0.000002; // 下跌阈值

  if (slope > upThreshold && volRatio > 0.8) trend = "上涨趋势";
  else if (slope < -downThreshold && volRatio > 0.8) trend = "下跌趋势";

  // 可刷分判断
  let stable = false;
  if (trend === "下跌趋势") {
    stable = volatility <= 0.0001;
  } else {
    stable = true;
  }

  const message = stable
    ? `✅ 可刷分（${trend} / 波动率:${volatility.toFixed(6)}）`
    : `⚠️ 暂不建议刷分（${trend} / 波动率:${volatility.toFixed(6)}）`;

  return {
    symbol,
    interval,
    volatility: volatility.toFixed(5),
    slope: slope.toFixed(7), // 保留更多小数
    varVol: varVol.toFixed(3),
    stable,
    trend,
    message,
  };
};
