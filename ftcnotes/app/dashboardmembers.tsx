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

const dashboardMembersScreen = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark"
      ? { background: "#111827", textColor: "#EFECD7" }
      : { background: "#F3F3F3", textColor: "#000000" };

  const [memberCount, setMemberCount] = useState(null);
  const [orgName, setOrgName] = useState(null);
  const [joinCode, setJoinCode] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [userOrgID, setUserOrgID] = useState(null);

  // gets user info regarding organization status
  useEffect(() => {
    if (!user?.id) return;

    const getUserInfo = async () => {
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/users/${user?.id}`
        );

        if (!res.ok) throw new Error(`Failed to get user info: ${res.status}`);

        const data = await res.json();
        setUserOrgID(data.organization_id);
      } catch (error) {
        console.log("Error getting user info: ", error);
      }
    };

    getUserInfo();
  }, [user?.id]);

  // gets organization info
  // And checks if user is owner
  useEffect(() => {
    if (!userOrgID) return;

    const getOrgInfo = async () => {
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/organizations/${userOrgID}`
        );

        if (!res.ok) throw new Error(`Failed to get org info: ${res.status}`);

        const data = await res.json();

        setMemberCount(data.member_count);
        setOrgName(data.name);
        setJoinCode(data.join_code);
      } catch (error) {
        console.log("Error fetching org info: ", error);
      }
    };

    getOrgInfo();
  }, [userOrgID]);

  // gets event count for organization
  useEffect(() => {
    const getEventCount = async () => {
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/organizations/event-count/${userOrgID}`
        );

        if (!res.ok)
          throw new Error(`Failed to get event count: ${res.status}`);

        const data = await res.json();
        setEventCount(data.length);
      } catch (error) {
        console.log("Error fetching event count: ", error);
      }
    };

    getEventCount();
  }, [userOrgID]);

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
        {/* pending member bubbles */}
        <ScrollView style={{ display: "flex" }}>
          <View
            style={[
              styles.groupCard,
              { borderWidth: colorScheme === "light" ? 1 : 1 },
            ]}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 15,
              }}
            >
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text
                  style={{
                    color: "black",
                    fontSize: 18,
                    fontWeight: 500,
                  }}
                >
                  {orgName}
                </Text>
              </View>
            </View>

            <View style={{ display: "flex", flexDirection: "row", gap: 15 }}>
              <View style={{ display: "flex", flexDirection: "row", gap: 6 }}>
                <Image
                  source={require("../assets/images/MemberIcon.png")}
                  style={{ width: 18, height: 18 }}
                />
                <Text style={{ fontSize: 15, fontWeight: 600 }}>
                  {memberCount} Members
                </Text>
              </View>
              <View style={{ display: "flex", flexDirection: "row", gap: 6 }}>
                <Image
                  source={require("../assets/images/CalendarIcon.png")}
                  style={{ width: 18, height: 18 }}
                />
                <Text style={{ fontSize: 15, fontWeight: 600 }}>
                  {eventCount} Events
                </Text>
              </View>
            </View>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: 600, color: "#3A3A3A" }}>
                Join Code:
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>
                {joinCode}
              </Text>
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
              <View style={styles.redBubbleBackground}></View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default dashboardMembersScreen;

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
  groupCard: {
    padding: 15,
    backgroundColor: "rgb(250,200,0)",
    width: "92%",
    minHeight: 120,
    borderRadius: 10,
    margin: 8,
    marginTop: 30,
    marginBottom: 10,
    borderColor: "#dea300",
  },
});
