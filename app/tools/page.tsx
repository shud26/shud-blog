import { TOOLS } from "@/lib/tools";

export const metadata = { title: "만든 도구 — shud.log" };

export default function ToolsPage() {
  return (
    <div className="toc wide">
      <div>
        <h1>만든 도구</h1>
        <p className="lead">직접 쓰려고 만든 것들. 숫자는 매일 자동으로 갱신돼요.</p>
      </div>
      <div className="tools">
        {TOOLS.map((t) => (
          <a key={t.href} href={t.href} className="tool">
            <span className="ic" style={{ background: t.color }} aria-hidden="true">{t.mark}</span>
            <span className="tx"><span className="name">{t.name}</span><span className="d">{t.desc}</span></span>
          </a>
        ))}
      </div>
    </div>
  );
}
