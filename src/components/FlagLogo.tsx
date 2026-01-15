
interface FlagLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// 5-pointed star path centered at origin with radius 1
const STAR_PATH = "M0,-1 L0.224,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,-0.118 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.224,-0.309 Z";

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <path
      d={STAR_PATH}
      fill="white"
      transform={`translate(${cx}, ${cy}) scale(${r})`}
    />
  );
}

// SVG American flag matching the emoji appearance
function AmericanFlagSVG({ className }: { className?: string }) {
  // Official US flag proportions: 1.9:1, using 247x130 for precision
  const width = 247;
  const height = 130;
  const stripeHeight = height / 13;
  const cantonWidth = 98.8; // 40% of width
  const cantonHeight = 7 * stripeHeight; // 7 stripes tall
  const starRadius = 4.1;

  // Star positions: 9 rows alternating 6 and 5 stars
  const stars: { cx: number; cy: number }[] = [];
  const starRows = 9;
  const starColsOdd = 6;
  const starColsEven = 5;
  const hSpacingOdd = cantonWidth / (starColsOdd + 1);
  const hSpacingEven = cantonWidth / (starColsEven + 1);
  const vSpacing = cantonHeight / (starRows + 1);

  for (let row = 0; row < starRows; row++) {
    const isOddRow = row % 2 === 0;
    const cols = isOddRow ? starColsOdd : starColsEven;
    const hSpacing = isOddRow ? hSpacingOdd : hSpacingEven;
    for (let col = 0; col < cols; col++) {
      stars.push({
        cx: hSpacing * (col + 1),
        cy: vSpacing * (row + 1),
      });
    }
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      {/* 13 stripes alternating red and white */}
      <rect width={width} height={height} fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect
          key={i}
          y={i * stripeHeight}
          width={width}
          height={stripeHeight}
          fill="white"
        />
      ))}
      {/* Blue canton */}
      <rect width={cantonWidth} height={cantonHeight} fill="#3C3B6E" />
      {/* 50 stars */}
      {stars.map((star, i) => (
        <Star key={i} cx={star.cx} cy={star.cy} r={starRadius} />
      ))}
    </svg>
  );
}

export function FlagLogo({ size = "md", className = "" }: FlagLogoProps) {
  const svgSizeClasses = {
    sm: "w-5 h-3.5",
    md: "w-6 h-4",
    lg: "w-7 h-5",
  };

  // Always use SVG for consistent rendering across all platforms
  // Flag emojis don't render properly on many systems (showing "US" instead)
  return (
    <span
      className={`inline-flex items-center ${className}`}
      role="img"
      aria-label="American flag"
    >
      <AmericanFlagSVG className={svgSizeClasses[size]} />
    </span>
  );
}
