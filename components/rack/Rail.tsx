/** Chrome rail with a wall bracket + end cap at each end. Positioned by the parent. */
export default function Rail({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rail ${className ?? ""}`} style={style} aria-hidden="true">
      <div className="rail-tube" />
      <div className="rail-end l">
        <div className="rail-plate" />
        <div className="rail-cap" />
      </div>
      <div className="rail-end r">
        <div className="rail-plate" />
        <div className="rail-cap" />
      </div>
    </div>
  );
}
