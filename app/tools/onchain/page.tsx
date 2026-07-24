"use client";

import { useState } from "react";

// 체인별 설정: RPC(하나 막히면 다음), ETH 짝 토큰(WETH), 예시 토큰
const CHAINS: Record<
  string,
  { name: string; rpcs: string[]; weth: string; example: string; note: string; blockSec: number }
> = {
  base: {
    name: "Base",
    rpcs: [
      "https://base.llamarpc.com",
      "https://mainnet.base.org",
      "https://base.drpc.org",
      "https://base.publicnode.com",
    ],
    weth: "0x4200000000000000000000000000000000000006",
    example: "0xa72c048366469d407a2739bfa58b6f5542f2a435", // SPACEX
    note: "dexscreener.com에서 Base 밈코 주소 복사",
    blockSec: 2, // Base ≈ 2초/블록
  },
  robinhood: {
    name: "로빈훗",
    rpcs: ["https://rpc.mainnet.chain.robinhood.com/"],
    weth: "0x0bd7d308f8e1639fab988df18a8011f41eacad73", // WETH on Robinhood chain
    example: "0x020bfc650a365f8bb26819deaabf3e21291018b4", // CASHCAT
    note: "예: CASHCAT · GME(0xc2362aff…) · 활성 로빈훗 토큰",
    blockSec: 0.1, // 로빈훗 ≈ 100ms/블록 (Base보다 20배 빠름)
  },
};
let ACTIVE = CHAINS.base;
const TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

type LogItem = {
  topics: string[];
  data: string;
  address: string;
  transactionHash: string;
  blockNumber: string;
};
type Row = { w: string; pnl: number; spent: number; got: number; hold: number };

const pad = (a: string) => "0x" + a.slice(2).toLowerCase().padStart(64, "0");
const addrOf = (t: string) => "0x" + t.slice(-40).toLowerCase();

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  let lastErr: unknown;
  for (const ep of ACTIVE.rpcs) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || "rpc error");
      return j.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("모든 RPC 실패");
}

// 넓은 구간도 안 깨지게: 큰 청크로 시도하다 RPC가 거부하면(로그 1만 초과·범위 초과 등)
// 그 구간을 반으로 쪼개서 재시도. 체인·토큰 활성도에 상관없이 견고.
async function getLogs(
  address: string,
  fromB: number,
  toB: number,
  topics: (string | null)[]
): Promise<LogItem[]> {
  const out: LogItem[] = [];
  const MAXSPAN = 200000;
  async function fetchSpan(a: number, b: number): Promise<void> {
    try {
      const r = (await rpc("eth_getLogs", [
        { fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16), address, topics },
      ])) as LogItem[];
      out.push(...(r || []));
    } catch (e) {
      if (b - a <= 2000) return; // 더 못 쪼개면 포기
      const mid = Math.floor((a + b) / 2);
      await fetchSpan(a, mid);
      await fetchSpan(mid + 1, b);
    }
  }
  for (let b = fromB; b <= toB; b += MAXSPAN) {
    await fetchSpan(b, Math.min(b + MAXSPAN - 1, toB));
  }
  return out;
}

async function decimals(token: string): Promise<number> {
  try {
    const r = (await rpc("eth_call", [
      { to: token, data: "0x313ce567" },
      "latest",
    ])) as string;
    return parseInt(r, 16) || 18;
  } catch {
    return 18;
  }
}
async function symbol(token: string): Promise<string> {
  try {
    const r = (await rpc("eth_call", [
      { to: token, data: "0x95d89b41" },
      "latest",
    ])) as string;
    const raw = r.slice(2);
    const len = parseInt(raw.slice(64, 128), 16);
    const hex = raw.slice(128, 128 + len * 2);
    return decodeURIComponent(hex.replace(/(..)/g, "%$1")).trim() || "?";
  } catch {
    return "?";
  }
}

async function analyze(
  chainKey: string,
  token: string,
  hours: number,
  onProgress: (s: string) => void
): Promise<{ rows: Row[]; pool: string; sym: string; price: number }> {
  ACTIVE = CHAINS[chainKey];
  token = token.toLowerCase();
  onProgress("토큰 정보 읽는 중…");
  const [dec, sym] = await Promise.all([decimals(token), symbol(token)]);
  const latest = parseInt((await rpc("eth_blockNumber", [])) as string, 16);
  // 시간 → 블록 수 (체인 블록 속도로 환산). 로빈훗은 100ms라 같은 시간이라도 블록이 훨씬 많음.
  const windowBlocks = Math.round((hours * 3600) / ACTIVE.blockSec);
  const fromB = Math.max(0, latest - windowBlocks);

  onProgress("토큰 거래 기록 긁는 중…");
  const tokLogs = (await getLogs(token, fromB, latest, [TRANSFER])).filter(
    (l) => l.data && l.data !== "0x"
  );
  if (tokLogs.length === 0)
    throw new Error("이 구간에 거래가 없어요. 선택한 체인의 토큰이 맞는지, 활발한 토큰인지 확인해보세요.");

  // 풀 = 가장 자주 등장하는 주소
  const freq: Record<string, number> = {};
  for (const l of tokLogs) {
    freq[addrOf(l.topics[1])] = (freq[addrOf(l.topics[1])] || 0) + 1;
    freq[addrOf(l.topics[2])] = (freq[addrOf(l.topics[2])] || 0) + 1;
  }
  const pool = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

  onProgress("ETH 흐름 맞추는 중…");
  const wethIn = await getLogs(ACTIVE.weth, fromB, latest, [TRANSFER, null, pad(pool)]); // 풀로 들어옴
  const wethOut = await getLogs(ACTIVE.weth, fromB, latest, [TRANSFER, pad(pool)]); // 풀에서 나감
  const wIn: Record<string, number> = {};
  const wOut: Record<string, number> = {};
  for (const l of wethIn)
    wIn[l.transactionHash] = (wIn[l.transactionHash] || 0) + Number(BigInt(l.data)) / 1e18;
  for (const l of wethOut)
    wOut[l.transactionHash] = (wOut[l.transactionHash] || 0) + Number(BigInt(l.data)) / 1e18;

  // tx별 토큰 흐름 모으기
  const byTx: Record<string, { froms: Set<string>; tos: Set<string>; out: number; in: number }> = {};
  const scale = Math.pow(10, dec);
  for (const l of tokLogs) {
    const f = addrOf(l.topics[1]);
    const t = addrOf(l.topics[2]);
    const amt = Number(BigInt(l.data)) / scale;
    const g = (byTx[l.transactionHash] ??= { froms: new Set(), tos: new Set(), out: 0, in: 0 });
    g.froms.add(f);
    g.tos.add(t);
    if (f === pool) g.out += amt; // 풀에서 토큰 나감 = 매수
    if (t === pool) g.in += amt; // 풀로 토큰 들어옴 = 매도
  }

  const W: Record<string, { spent: number; got: number; bought: number; sold: number }> = {};
  let price = 0;
  for (const [h, g] of Object.entries(byTx)) {
    if (g.out > 0 && (wIn[h] || 0) > 0) {
      // 매수: 최종 보유자 = to 중에 from에 없는 지갑(풀·라우터 제외)
      const buyer = [...g.tos].find((a) => a !== pool && !g.froms.has(a));
      if (!buyer) continue;
      const d = (W[buyer] ??= { spent: 0, got: 0, bought: 0, sold: 0 });
      d.bought += g.out;
      d.spent += wIn[h];
      price = wIn[h] / g.out;
    } else if (g.in > 0 && (wOut[h] || 0) > 0) {
      // 매도: 최초 판매자 = from 중에 to에 없는 지갑
      const seller = [...g.froms].find((a) => a !== pool && !g.tos.has(a));
      if (!seller) continue;
      const d = (W[seller] ??= { spent: 0, got: 0, bought: 0, sold: 0 });
      d.sold += g.in;
      d.got += wOut[h];
      price = wOut[h] / g.in;
    }
  }

  const rows: Row[] = Object.entries(W).map(([w, d]) => {
    const hold = d.bought - d.sold;
    return { w, pnl: d.got - d.spent + hold * price, spent: d.spent, got: d.got, hold };
  });
  rows.sort((a, b) => b.pnl - a.pnl);
  return { rows, pool, sym, price };
}

export default function OnchainTool() {
  const [chain, setChain] = useState("base");
  const [token, setToken] = useState(CHAINS.base.example);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState("");
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Awaited<ReturnType<typeof analyze>> | null>(null);

  function switchChain(key: string) {
    setChain(key);
    setToken(CHAINS[key].example);
    setRes(null);
    setErr("");
  }

  async function run() {
    setErr("");
    setRes(null);
    if (!/^0x[0-9a-fA-F]{40}$/.test(token.trim())) {
      setErr("0x로 시작하는 40자리 토큰 주소를 넣어주세요.");
      return;
    }
    setBusy(true);
    try {
      const r = await analyze(chain, token.trim(), hours, setProg);
      setRes(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "실패했어요. 잠시 후 다시 시도해보세요.");
    } finally {
      setBusy(false);
      setProg("");
    }
  }

  const winners = res ? res.rows.filter((r) => r.pnl > 0).length : 0;
  const chip = (bg: string, c: string): React.CSSProperties => ({
    background: bg, color: c, padding: "0.1rem 0.5rem", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600,
  });

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.4rem" }}>온체인 손익 조회기</h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 0.4rem", lineHeight: 1.7 }}>
        토큰 주소를 넣으면, 그 코인을 사고판 지갑들의 손익을 계산합니다. Base와 로빈훗 체인 지원, 브라우저에서 직접 온체인을 조회해요.
      </p>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.78rem", color: "#6b7280", marginBottom: "1.1rem", lineHeight: 1.6 }}>
        학습·실험용 근사 도구입니다. 투자 조언이 아니며, 최근 구간만 보고 봇은 완벽히 걸러지지 않습니다. 자세한 원리는 <a href="/posts/onchain-reading-3-who-won" style={{ color: "#111" }}>온체인 읽기 3편</a> 참고.
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <select value={chain} onChange={(e) => switchChain(e.target.value)}
          style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600 }}>
          {Object.entries(CHAINS).map(([k, c]) => (
            <option key={k} value={k}>{c.name}</option>
          ))}
        </select>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="0x… (토큰 주소)"
          spellCheck={false}
          style={{ flex: "1 1 300px", padding: "0.5rem 0.7rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", fontFamily: "monospace" }}
        />
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))}
          style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem" }}>
          <option value={6}>최근 6시간</option>
          <option value={24}>최근 1일</option>
          <option value={72}>최근 3일 (느림)</option>
        </select>
        <button onClick={run} disabled={busy}
          style={{ padding: "0.5rem 1.1rem", border: "none", borderRadius: 8, background: busy ? "#9ca3af" : "#111", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: busy ? "default" : "pointer" }}>
          {busy ? "조회 중…" : "조회"}
        </button>
      </div>
      <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: "0 0 1rem" }}>
        {CHAINS[chain].note}
      </p>

      {prog && <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>⏳ {prog}</p>}
      {err && <p style={{ fontSize: "0.85rem", color: "#b91c1c" }}>⚠️ {err}</p>}

      {res && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.5rem 0 1rem" }}>
            <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}>
              <b>{res.sym}</b> · 매매 지갑 <b>{res.rows.length}</b>
            </span>
            <span style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}>
              플러스 <b style={{ color: winners ? "#15803d" : "#b91c1c" }}>{winners}</b> / {res.rows.length}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "0.82rem", width: "100%" }}>
              <thead>
                <tr>
                  {["지갑", "손익(ETH)", "냄", "받음", "보유(M)"].map((h) => (
                    <th key={h} style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem", background: "#f9fafb", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.rows.slice(0, 40).map((r) => (
                  <tr key={r.w}>
                    <td style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem", fontFamily: "monospace" }}>
                      {r.pnl > 0 ? "🟢" : "🔴"} {r.w.slice(0, 8)}…{r.w.slice(-4)}
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem", fontWeight: 700, color: r.pnl > 0 ? "#15803d" : "#b91c1c" }}>
                      {r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(4)}
                    </td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem" }}>{r.spent.toFixed(3)}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem" }}>{r.got.toFixed(3)}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "0.3rem 0.6rem" }}>{(r.hold / 1e6).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.8rem", lineHeight: 1.6 }}>
            보통 <b>사고 판</b> 지갑만 플러스이고, <b>사서 홀드</b>는 물려 있습니다. 보유가 음수인 지갑은 조회 구간 이전부터 들고 있던 경우예요.
          </p>
        </div>
      )}
    </div>
  );
}
