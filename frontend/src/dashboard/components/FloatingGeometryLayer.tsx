export default function FloatingGeometryLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden dashboard-grid-bg" aria-hidden="true">
      <div className="floating-math-object sphere left-[5%] top-20 h-28 w-28" />
      <div className="floating-math-object plane right-[7%] top-28 h-28 w-40 rotate-6" />
      <div className="floating-math-object bottom-28 left-[18%] h-24 w-24 rotate-45" />
      <div className="vector-field bottom-20 right-[16%]" />
      <div className="matrix-field left-[8%] top-[48%] hidden md:block">
        {"[ 1  0  λ ]\n[ 0  σ  μ ]\n[ ∇  x  y ]"}
      </div>
      <div className="matrix-field right-[10%] bottom-[38%] hidden lg:block">
        {"P(A|B) = P(B|A)P(A) / P(B)\nargmin f(θ) + λ||θ||²"}
      </div>
    </div>
  );
}
