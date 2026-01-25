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

const dashboardPendingScreen = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
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

  const xIcon = require("../assets/images/FTCNotesXIcon.png");
  const checkIcon = require("../assets/images/FTCNotesCheckIcon.png");

  const [pendingMembers, setPendingMembers] = useState<
    {
      email: string;
      name: string;
      user_id: string;
    }[]
  >([]);

  const [orgID, setOrgID] = useState("");

  const denyRequest = async (user_id: string) => {
    const token = await getToken();
    fetch("https://inp.pythonanywhere.com/api/organizations/deny-request", {
      method: "POST",
      body: JSON.stringify({
        user_id: user_id,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log("Success!");
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.log(response.status);
        }
      })
      .catch((error) => {
        console.log(`error denying join request: ${error}`);
      });
  };

  const approveRequest = async (user_id: string) => {
    const token = await getToken();
    fetch("https://inp.pythonanywhere.com/api/organizations/approve-request", {
      method: "POST",
      body: JSON.stringify({
        user_id: user_id,
        organization_id: orgID,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log("Success!");
        } else {
          console.log(response.status);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      })
      .catch((error) => {
        console.log(`error approving join request: ${error}`);
      });
  };

  useEffect(() => {
    if (!user?.id) return;

    const getOrgID = async () => {
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/users/${user?.id}`,
        );

        if (!res.ok) {
          throw new Error(`Failed to get org ID: ${res.status}`);
        }

        const data = await res.json();

        setOrgID(data.organization_id);
      } catch (error) {
        console.log(`Error fetching org ID: ${error}`);
      }
    };

    getOrgID();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingMembers = async () => {
      const token = await getToken();
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/organizations/pending-requests`,
          {
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch pending members: ${res.status}`);
        }

        const data = await res.json();
        setPendingMembers(data.pending_requests);
      } catch (error) {
        console.log(`Error calling endpoint: ${error}`);
      }
    };
    fetchPendingMembers();
  }, [user?.id, denyRequest, approveRequest]);

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
            alignItems: "center",
            gap: 8,
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
            Dashboard
          </Text>
        </View>

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
          {pendingMembers.map((member, index) => (
            <View
              key={index}
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
                  {member.name}
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}
                >
                  {member.email}
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
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    approveRequest(member.user_id);
                  }}
                >
                  <View style={styles.greenBubbleBackground}>
                    <Image
                      style={{ width: 15, height: 15 }}
                      source={checkIcon}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    denyRequest(member.user_id);
                  }}
                >
                  <View style={styles.redBubbleBackground}>
                    <Image style={{ width: 20, height: 20 }} source={xIcon} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
