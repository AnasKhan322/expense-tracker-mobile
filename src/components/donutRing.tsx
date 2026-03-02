import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  size: number;
  stroke: number;
  progress: number; // 0..1 income %
  incomePct: number;
  expensePct: number;
};

export default function DonutRing({
  size,
  stroke,
  progress,
  incomePct,
  expensePct,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          stroke="#1b1b1b"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />

        {/* Progress ring */}
        <Circle
          stroke="#9DFF3A"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center Content */}
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "900",
            fontSize: 20,
            textAlign: "center",
          }}
        >
          {incomePct}%
        </Text>

        <Text
          style={{
            color: "#9a9a9a",
            fontWeight: "700",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          Income
        </Text>

        <Text
          style={{
            color: "white",
            fontWeight: "900",
            fontSize: 16,
            marginTop: 6,
          }}
        >
          {expensePct}%
        </Text>

        <Text
          style={{
            color: "#9a9a9a",
            fontWeight: "700",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          Expense
        </Text>
      </View>
    </View>
  );
}
