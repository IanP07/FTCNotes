import React from "react";
import { useState, useEffect } from "react";
import {
  View,
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
  const { user } = useUser();

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.text, { color: theme.textColor }]}>
          You are already in a group!
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {content}
    </View>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 70,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
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
});
