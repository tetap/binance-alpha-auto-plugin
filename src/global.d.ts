
// 扩展 Window 接口
declare global {
  interface Window {
    onAccessibilityEvent: (event: never) => void;
  }
}

// 确保这个文件被视为模块
export {};
