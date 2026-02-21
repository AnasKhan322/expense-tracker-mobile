import { Pressable, Text, View } from "react-native";

export default function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#111",
        borderRadius: 14,
        padding: 4,
        gap: 6,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: active ? "#9DFF3A" : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "800",
                color: active ? "#111" : "#bbb",
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
