import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function FloatingAddButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        right: 18,
        bottom: 22,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#9DFF3A",
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
      }}
    >
      <Ionicons name="add" size={30} color="#111" />
    </Pressable>
  );
}
