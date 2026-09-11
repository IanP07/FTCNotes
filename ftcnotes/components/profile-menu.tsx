import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

type AccountAction = "signOut" | "delete";

export default function ProfileMenu() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { width, height } = useWindowDimensions();
  const anchor = useRef<View>(null);
  const inFlight = useRef(false);
  const accountDeleted = useRef(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [pending, setPending] = useState<AccountAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuWidth = Math.min(260, width - 32);
  const textColor = isDark ? "#EFECD7" : "#111827";
  const deleteColor = isDark ? "#FCA5A5" : "#B91C1C";

  const openMenu = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    anchor.current?.measureInWindow((x, y, avatarWidth, avatarHeight) => {
      setPosition({
        top: Math.max(16, Math.min(y + avatarHeight + 8, height - 260)),
        left: Math.max(16, Math.min(x + avatarWidth - menuWidth, width - menuWidth - 16)),
      });
      setError(null);
      setVisible(true);
    });
  };

  const closeMenu = () => {
    if (!inFlight.current) setVisible(false);
  };

  const handleAction = async (action: AccountAction) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(action);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    
    try {
      if (action === "delete" && !accountDeleted.current) {
        const token = await getToken();
        const response = await fetch("https://inp.pythonanywhere.com/api/delete-user", {
          method: "DELETE",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete account: ${response.status}`);
        }
        accountDeleted.current = true;
      }

      await signOut();
      if (action === "delete") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setVisible(false);
      if (action === "delete") {
        router.replace("/");
      } else {
        router.push("/");
      }
    } catch (cause) {
      console.log(`Error performing account action (${action}):`, cause);
      setError(
        accountDeleted.current
          ? "Your account was deleted, but sign out failed. Please try signing out again."
          : action === "delete"
            ? "Could not delete your account. Please try again."
            : "Could not sign out. Please try again.",
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };

  return (
    <View ref={anchor} collapsable={false}>
      <Pressable
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        accessibilityState={{ expanded: visible }}
        hitSlop={8}
        style={({ pressed }) => [styles.avatarRing, { opacity: pressed ? 0.7 : 1 }]}
      >
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Feather name="user" size={24} color="#111827" />
          </View>
        )}
      </Pressable>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={closeMenu}>
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Close account menu"
            disabled={pending !== null}
          />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={closeMenu}
            style={[
              styles.menu,
              position,
              { width: menuWidth, backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: pending !== null, busy: pending === "signOut" }}
              disabled={pending !== null}
              onPress={() => handleAction("signOut")}
              style={({ pressed }) => [styles.option, { opacity: pressed || pending ? 0.6 : 1 }]}
            >
              {pending === "signOut" ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Feather name="log-out" size={20} color={textColor} />
              )}
              <Text style={[styles.label, { color: textColor }]}>Sign out</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: isDark ? "#374151" : "#E5E7EB" }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              accessibilityState={{ disabled: pending !== null, busy: pending === "delete" }}
              disabled={pending !== null}
              onPress={() => handleAction("delete")}
              style={({ pressed }) => [styles.option, { opacity: pressed || pending ? 0.6 : 1 }]}
            >
              {pending === "delete" ? (
                <ActivityIndicator size="small" color={deleteColor} />
              ) : (
                <Feather name="trash-2" size={20} color={deleteColor} />
              )}
              <Text style={[styles.label, { color: deleteColor }]}>Delete account</Text>
            </Pressable>
            {error && (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { color: deleteColor }]}>
                {error}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dea300",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.15)" },
  menu: {
    position: "absolute",
    borderRadius: 14,
    padding: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 8,
  },
  label: { fontSize: 16, fontWeight: "500" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  error: { fontSize: 14, lineHeight: 20, padding: 14 },
});
