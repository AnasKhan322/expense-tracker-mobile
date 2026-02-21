import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export default function Donut({
  size = 220,
  stroke = 22,
  income,
  expense,
}: {
  size?: number;
  stroke?: number;
  income: number;
  expense: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const totalFlow = clamp(income) + clamp(expense);
  const incomePct = totalFlow === 0 ? 0 : clamp(income) / totalFlow;
  const expensePct = totalFlow === 0 ? 0 : clamp(expense) / totalFlow;

  const incomeDash = c * incomePct;
  const expenseDash = c * expensePct;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* base ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#222"
          strokeWidth={stroke}
          fill="none"
        />
        {/* income arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#34C759"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${incomeDash} ${c - incomeDash}`}
          strokeLinecap="butt"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
        {/* expense arc starts after income */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FF453A"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${expenseDash} ${c - expenseDash}`}
          strokeLinecap="butt"
          rotation={-90 + 360 * incomePct}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </View>
  );
}
