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

const dashboardPendingScreen = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark"
      ? { background: "#111827", textColor: "#EFECD7" }
      : { background: "#F3F3F3", textColor: "#000000" };

  return (
    <View
      style={{
        display: "flex",
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <View style={styles.topbar}>
        <Text
          style={[
            styles.text,
            { color: theme.textColor, fontSize: 30, fontWeight: "600" },
          ]}
        >
          My Group
        </Text>

        <TouchableOpacity
          onPress={async () => {
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
          alignItems: "center",
        }}
      >
        <Text
          style={{
            marginTop: 30,
            marginBottom: 10,
            fontSize: 20,
            color: "#DEA300",
            fontWeight: 500,
          }}
        >
          Pending Requests
        </Text>

        {/* pending member bubbles */}
        <ScrollView>
          <View
            style={[
              styles.bubble,
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
            <View style={styles.iconBubble}></View>
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
                John Brown
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                JohnBrown@gmail.com
              </Text>
            </View>

            <View
              style={{
                display: "flex",
                marginLeft: "auto",
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={styles.greenBubbleBackground}></View>
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>

          <View
            style={[
              styles.bubble,
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
            <View style={styles.iconBubble}></View>
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
                John Brown
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                JohnBrown@gmail.com
              </Text>
            </View>

            <View
              style={{
                display: "flex",
                marginLeft: "auto",
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={styles.greenBubbleBackground}></View>
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>
          <View
            style={[
              styles.bubble,
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
            <View style={styles.iconBubble}></View>
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
                John Brown
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                JohnBrown@gmail.com
              </Text>
            </View>

            <View
              style={{
                display: "flex",
                marginLeft: "auto",
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={styles.greenBubbleBackground}></View>
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>
          <View
            style={[
              styles.bubble,
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
            <View style={styles.iconBubble}></View>
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
                John Brown
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                JohnBrown@gmail.com
              </Text>
            </View>

            <View
              style={{
                display: "flex",
                marginLeft: "auto",
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={styles.greenBubbleBackground}></View>
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>
          <View
            style={[
              styles.bubble,
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
            <View style={styles.iconBubble}></View>
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
                John Brown
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
                JohnBrown@gmail.com
              </Text>
            </View>

            <View
              style={{
                display: "flex",
                marginLeft: "auto",
                flexDirection: "row",
                gap: 20,
              }}
            >
              <View style={styles.greenBubbleBackground}></View>
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default dashboardPendingScreen;

const styles = StyleSheet.create({
  bubble: {
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
    borderRadius: 99,
  },
  greenBubbleBackground: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    width: 35,
    backgroundColor: "#32E832",
    borderRadius: 10,
  },
  redBubbleBackground: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    width: 35,
    backgroundColor: "#EE3737",
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
