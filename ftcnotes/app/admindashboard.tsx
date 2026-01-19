import React from "react";
import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser, useClerk } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";

const AdminDashboardScreen = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark"
      ? { background: "#111827", textColor: "#EFECD7" }
      : { background: "#F3F3F3", textColor: "#000000" };

  const backIcon =
    colorScheme === "dark"
      ? require("../assets/images/FTCNotesBackIconDark.png")
      : require("../assets/images/FTCNotesBackIconLight.png");

  return (
    <View
      style={{
        display: "flex",
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <View style={styles.topbar}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.3}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Image style={{ height: 40, width: 40 }} source={backIcon} />
          </TouchableOpacity>
          <Text
            style={[
              styles.text,
              { color: theme.textColor, fontSize: 30, fontWeight: "600" },
            ]}
          >
            Groups
          </Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await signOut();
            router.push("/");
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Image style={styles.image} source={{ uri: user?.imageUrl }} />
            <Text style={{ color: theme.textColor }}>Sign out</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* pending members */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/dashboardpending");
          }}
          activeOpacity={0.3}
        >
          <View
            style={[
              styles.actionButton,
              {
                alignItems: "center",
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                borderColor:
                  colorScheme === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
              },
            ]}
          >
            <View style={styles.iconBubble}>
              <Image
                source={require("../assets/images/CalendarIcon.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
            <View
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginLeft: 10,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: theme.textColor,
                }}
              >
                Pending Requests
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                Manage group join requests
              </Text>
            </View>

            <View style={{ display: "flex", marginLeft: "auto" }}>
              <Image
                source={require("../assets/images/FTCNotesRightArrowGrey.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* current members */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/dashboardmembers");
          }}
          activeOpacity={0.3}
        >
          <View
            style={[
              styles.actionButton,
              {
                alignItems: "center",
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                borderColor:
                  colorScheme === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
              },
            ]}
          >
            <View style={styles.iconBubble}>
              <Image
                source={require("../assets/images/CalendarIcon.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
            <View
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginLeft: 10,
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: theme.textColor,
                }}
              >
                Current members
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                Manage current members
              </Text>
            </View>

            <View style={{ display: "flex", marginLeft: "auto" }}>
              <Image
                source={require("../assets/images/FTCNotesRightArrowGrey.png")}
                style={{ width: 24, height: 24 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "92%",
    borderRadius: 10,
    minHeight: 85,
    margin: 12,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(33,40,55)",
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
  iconBubble: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: 50,
    backgroundColor: "#FFC30D",
    borderRadius: 10,
  },
  text: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 100,
    borderColor: "#dea300",
    borderWidth: 2,
  },
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 70,
  },
});
