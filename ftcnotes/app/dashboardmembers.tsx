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

const dashboardMembersScreen = () => {
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

  const xIcon = require("../assets/images/FTCNotesXIcon.png");

  const [memberCount, setMemberCount] = useState(null);
  const [orgName, setOrgName] = useState(null);
  const [joinCode, setJoinCode] = useState(null);
  const [eventCount, setEventCount] = useState(null);
  const [userOrgID, setUserOrgID] = useState(null);

  const [currentMembers, setCurrentMembers] = useState<
    {
      email: string;
      name: string;
      user_id: string;
    }[]
  >([]);

  const kickMember = async (kickedMemberID: string) => {
    try {
      const res = await fetch(`https://inp.pythonanywhere.com/api/kick-user`, {
        method: "POST",
        body: JSON.stringify({
          user_id: kickedMemberID,
          org_id: userOrgID,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });
      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log(data);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log(`Error kicking member ${error}`);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      try {
        // Getting user info
        const userRes = await fetch(
          `https://inp.pythonanywhere.com/api/users/${user.id}`,
        );
        if (!userRes.ok)
          throw new Error(`Failed to get user info: ${userRes.status}`);
        const userData = await userRes.json();
        const orgId = userData.organization_id;
        setUserOrgID(orgId);

        if (!orgId) return;

        // fetch org info, event count, and members
        const [orgRes, eventRes, membersRes] = await Promise.all([
          fetch(`https://inp.pythonanywhere.com/api/organizations/${orgId}`),
          fetch(
            `https://inp.pythonanywhere.com/api/organizations/event-count/${orgId}`,
          ),
          fetch(`https://inp.pythonanywhere.com/api/users/from-org/${orgId}`),
        ]);

        if (!orgRes.ok)
          throw new Error(`Failed to get org info: ${orgRes.status}`);
        if (!eventRes.ok)
          throw new Error(`Failed to get event count: ${eventRes.status}`);
        if (!membersRes.ok)
          throw new Error(`Failed to get members: ${membersRes.status}`);

        const [orgData, eventData, membersData] = await Promise.all([
          orgRes.json(),
          eventRes.json(),
          membersRes.json(),
        ]);

        setOrgName(orgData.name);
        setMemberCount(orgData.member_count);
        setJoinCode(orgData.join_code);
        setEventCount(eventData.length);
        setCurrentMembers(membersData);
      } catch (error) {
        console.log(`Error fetching dashboard data: ${error}`);
      }
    };
    fetchDashboardData();
  }, [user?.id, kickMember]);

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
        }}
      >
        {/* current member bubbles */}
        <ScrollView style={{ display: "flex" }}>
          <View style={{ width: "100%", alignItems: "center" }}>
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
                <Text
                  style={{ fontSize: 15, fontWeight: 600, color: "#3A3A3A" }}
                >
                  Join Code:
                </Text>
                <Text
                  style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}
                >
                  {joinCode}
                </Text>
              </View>
            </View>
            {currentMembers.map((member, index) => (
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
                      kickMember(member.user_id);
                    }}
                  >
                    <View style={styles.redBubbleBackground}>
                      <Image style={{ width: 20, height: 20 }} source={xIcon} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
    height: 40,
    width: 40,
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
