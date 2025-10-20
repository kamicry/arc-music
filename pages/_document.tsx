import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <script
            // 在指定域名上静默拦截 Next.js 开发环境的 HMR WebSocket，避免生产环境代理返回 403 导致控制台报错
            dangerouslySetInnerHTML={{
              __html: `(() => {
  try {
    if (typeof window === 'undefined') return;
    var OriginalWebSocket = window.WebSocket;
    if (!OriginalWebSocket) return;

    var isTargetDomain = /(^|\.)music\.miku0\.dpdns\.org$/i.test(window.location.hostname);
    if (!isTargetDomain) return;

    var HMR_PATH_RE = /\/_next\/webpack-hmr(?:$|[/?#])/;

    function SilentWebSocket(url, protocols) {
      try {
        var u = String(url || '');
        if (HMR_PATH_RE.test(u)) {
          // 创建一个最小可用的 WebSocket 假对象，避免实际发起网络请求
          var noop = function () {};
          var fake = {
            url: u,
            readyState: 3, // CLOSED
            bufferedAmount: 0,
            extensions: '',
            protocol: '',
            binaryType: 'blob',
            close: noop,
            send: noop,
            addEventListener: noop,
            removeEventListener: noop,
            dispatchEvent: function () { return false; },
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
          };
          // 模拟一个异步的关闭事件，防止调用方一直等待
          setTimeout(function () {
            try {
              if (typeof fake.onclose === 'function') {
                fake.onclose({ code: 1006, reason: 'HMR disabled on production domain', wasClean: false });
              }
            } catch (_) {}
          }, 0);
          return fake;
        }
      } catch (_) {}
      return new OriginalWebSocket(url, protocols);
    }
    try { SilentWebSocket.prototype = OriginalWebSocket.prototype; } catch (_) {}
    window.WebSocket = SilentWebSocket;
  } catch (_) {}
})();`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
