// Galerie 文字 Logo 方案
// 使用方式: <Logo variant="A" /> | <Logo variant="B" /> | <Logo variant="C" /> | <Logo variant="D" />

interface LogoProps {
  variant?: "A" | "B" | "C" | "D";
  className?: string;
}

export function Logo({ variant = "A", className }: LogoProps) {
  switch (variant) {
    case "A":
      return <LogoA className={className} />;
    case "B":
      return <LogoB className={className} />;
    case "C":
      return <LogoC className={className} />;
    case "D":
      return <LogoD className={className} />;
  }
}

/* ─────────────────────────────────────────────
 * 方案 A: 优雅衬线 + 字间距
 * 风格: 摄影杂志感，大写字母 + 宽字间距 + 细线装饰
 * ───────────────────────────────────────────── */
function LogoA({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className || ""}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-foreground">
        <rect x="2" y="4" width="20" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 16l5-4 3 2 4-5 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="text-xl tracking-[0.3em] font-light uppercase text-foreground">
        Galerie
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 方案 B: 现代无衬线 + 品牌色点缀
 * 风格: 简洁现代，首字母大写加粗 + 小写 + 底部彩色点缀线
 * ───────────────────────────────────────────── */
function LogoB({ className }: { className?: string }) {
  return (
    <div className={`inline-flex flex-col items-start ${className || ""}`}>
      <span className="text-xl text-foreground">
        <span className="font-bold">G</span>
        <span className="font-light tracking-wide">alerie</span>
      </span>
      <div className="mt-0.5 h-[2px] w-full rounded-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 方案 C: 竖线分隔 + 副标题
 * 风格: 品牌感强，主标题 + 竖线 + 小字副标题，适合管理后台
 * ───────────────────────────────────────────── */
function LogoC({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className || ""}`}>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        Galerie
      </span>
      <div className="h-4 w-px bg-border" />
      <span className="text-xs font-normal tracking-widest uppercase text-muted">
        Photo
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 方案 D: 手写签名风
 * 风格: 艺术感、个性化，使用手写字体渲染
 * ───────────────────────────────────────────── */
function LogoD({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block text-2xl text-foreground ${className || ""}`}
      style={{
        fontFamily: "'Allura', 'Great Vibes', 'Dancing Script', 'Segoe Script', 'Apple Chancery', 'Snell Roundhand', cursive",
        fontWeight: 400,
        letterSpacing: "0.02em",
      }}
    >
      Galerie
    </span>
  );
}
