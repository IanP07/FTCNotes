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

const GroupsScreen = () => {
  const [userOrgID, setUserOrgID] = useState<number | null>(null);
  const [userJoinStatus, setUserJoinStatus] = useState(null);
  const [isOrgOwner, setIsOrgOwner] = useState(false);

  const [memberCount, setMemberCount] = useState(null);
  const [orgName, setOrgName] = useState(null);
  const [joinCode, setJoinCode] = useState(null);

  const { user } = useUser();

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
        setUserJoinStatus(data.join_status);
      } catch (error) {
        console.log("Error getting user info: ", error);
      }
    };

    getUserInfo();
  }, [user?.id]);

  // gets organization info
  // And checks if user is owner
  useEffect(() => {
    const getOrgInfo = async () => {
      try {
        const res = await fetch(
          `https://inp.pythonanywhere.com/api/organizations/${userOrgID}`
        );

        if (!res.ok) throw new Error(`Failed to get org info: ${res.status}`);

        const data = await res.json();

        if (user?.id === data["user_id"]) {
          setIsOrgOwner(true);
        }

        setMemberCount(data.member_count);
        setOrgName(data.name);
        setJoinCode(data.join_code);
      } catch (error) {
        console.log("Error fetching org info: ", error);
      }
    };

    getOrgInfo();
  }, [userOrgID]);

  const { signOut } = useClerk();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const theme =
    colorScheme === "dark"
      ? { background: "#111827", textColor: "#EFECD7" }
      : { background: "#F3F3F3", textColor: "#000000" };

  let content;
  if (userOrgID === null && userJoinStatus !== "approved") {
    content = (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={{ width: "90%", marginBottom: 25 }}>
          <Text style={[styles.text, { color: theme.textColor }]}>
            You're currently not in any groups
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/creategroup")}
        >
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/EventsScreen")}
        >
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <View
        style={[styles.groupContainer, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.eventCard,
            { borderWidth: colorScheme === "light" ? 1 : 0 },
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
                  color: theme.textColor,
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {orgName}
                {/* {joinCode} */}
              </Text>
            </View>

            <View style={styles.memberStatusIcon}>
              <Text style={{ color: "white", fontWeight: 500 }}>Member</Text>
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
              <Text style={{ fontSize: 15, fontWeight: 600 }}>3 Events</Text>
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

        {/* Event Button */}
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
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 500 }}>View Events</Text>
            <Text style={{ fontSize: 14, fontWeight: 500, color: "#6E6E6E" }}>
              3 Events
            </Text>
          </View>

          <View style={{ display: "flex", marginLeft: "auto" }}>
            <Text>Why not right?</Text>
          </View>
        </View>

        {/* Admin Dashboard Button */}
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
        ></View>

        {/* Leave Group Button */}
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
        ></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
        style={[
          styles.divider,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.2"
                : "rgba(0,0,0,0.2)",
          },
        ]}
      ></View>
      {content}
    </View>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 70,
  },
  divider: {
    width: "100%",
    height: 2,
    marginTop: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  groupContainer: {
    flex: 1,
    marginTop: 20,
    alignItems: "center",
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 100,
    borderColor: "#dea300",
    borderWidth: 2,
  },
  text: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonText: {
    fontSize: 19,
    fontWeight: "500",
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(250,200,0)",
    width: "85%",
    height: 75,
    borderRadius: 10,
    margin: 8,
    borderColor: "#dea300",
  },
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
  eventCard: {
    padding: 15,
    backgroundColor: "rgb(250,200,0)",
    width: "92%",
    minHeight: 120,
    borderRadius: 10,
    margin: 8,
    borderColor: "#dea300",
  },
  memberStatusIcon: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 32,
    backgroundColor: "#c91616ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
});
