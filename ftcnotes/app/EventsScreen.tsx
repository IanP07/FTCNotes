import {
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  TextInput,
  useColorScheme,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";

import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlipInEasyX } from "react-native-reanimated";
import { green, red } from "react-native-reanimated/lib/typescript/Colors";
import DeleteConfirmationModal from "../components/ui/deleteEventModal";
import * as Haptics from "expo-haptics";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export default function EventsScreen() {
  const { user } = useUser();

  const [userOrgID, setUserOrgID] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const { getToken } = useAuth();

  const compareDates = (eventDateStr: string) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const [month, day, year] = eventDateStr.split("/").map(Number);
    const eventDate = new Date(year, month - 1, day);
    eventDate.setHours(0, 0, 0, 0);

    if (currentDate.getTime() < eventDate.getTime()) {
      return "Upcoming";
    } else if (currentDate.getTime() > eventDate.getTime()) {
      return "Completed";
    } else if (currentDate.getTime() === eventDate.getTime()) {
      return "Live";
    } else {
      return "Unknown";
    }
  };

  const formatDateInput = (text: string) => {
    const digits = text.replace(/\D/g, "");

    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits; // month
    } else if (digits.length <= 4) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    } else {
      formatted =
        digits.slice(0, 2) +
        "/" +
        digits.slice(2, 4) +
        "/" +
        digits.slice(4, 8);
    }

    return formatted;
  };

  const statusColors: Record<string, string> = {
    Completed: "#626262",
    Upcoming: "#0065EA",
    Live: "#24b524",
    Unknown: "#000000",
  };

  const getUserInfo = async () => {
    try {
      const res = await fetch(
        `https://inp.pythonanywhere.com/api/users/${user?.id}`,
      );

      if (!res.ok) throw new Error(`Failed to get user info: ${res.status}`);

      const data = await res.json();
      setUserOrgID(data.organization_id);

      if (data.organization_id) {
        fetchEvents(data.organization_id);
      }
    } catch (error) {
      console.log("Error getting user info: ", error);
    }
  };

  const fetchEvents = async (orgId: number) => {
    const token = await getToken();
    try {
      const res = await fetch(
        `https://inp.pythonanywhere.com/api/events-for-organization/${orgId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
      const data = await res.json();

      const eventsWithCounts = await Promise.all(
        data.map(async (event: { id: number }) => {
          const countRes = await fetch(
            `https://inp.pythonanywhere.com/api/team-amount/${event.id}`,
          );
          if (!countRes.ok)
            throw new Error(`Failed to fetch team count: ${countRes.status}`);
          const countData = await countRes.json();
          return { ...event, teamCount: countData["team-amount"] }; // adds count to data
        }),
      );

      setEvents(eventsWithCounts);
    } catch (error) {
      console.log("Error fetching events", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      getUserInfo();
    }, [user?.id]),
  );

  const colorScheme = useColorScheme(); // accesses users current system color scheme

  const lightTheme = {
    // may change light mode colors later
    background: "#F3F3F3",
    textColor: "#000000",
  };

  const darkTheme = {
    background: "#111827", // #232323
    textColor: "#EFECD7",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const plusIcon =
    colorScheme === "dark"
      ? require("../assets/images/FTCNotesPlusIconDark.png")
      : require("../assets/images/FTCNotesPlusIconLight.png");

  const backIcon =
    colorScheme === "dark"
      ? require("../assets/images/FTCNotesBackIconDark.png")
      : require("../assets/images/FTCNotesBackIconLight.png");

  const router = useRouter();

  const homePage = () => {
    router.push("/groups");
  };

  const teamsPage = (id: number) => {
    router.push(`./TeamsScreen/${id}`); // passes unique event id to teamscreen page
  };

  const [showForm, setShowForm] = useState(false); // toggles form visibility
  // List of event objects grabbed from db that will be rendered on screen
  const [events, setEvents] = useState<
    {
      id: number;
      name: string;
      date: string;
      location: string;
      organization_id: number;
      teamCount: number;
    }[]
  >([]);

  // Event data user is currently generating
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");

  const handleAddEvent = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newEventName.trim().length === 0) return;

    setShowForm(false); // Hide the form

    const token = await getToken();
    // Creates new event
    fetch("https://inp.pythonanywhere.com/api/create-event", {
      method: "POST",
      body: JSON.stringify({
        name: newEventName,
        date: newEventDate,
        location: newEventLocation,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Response Status:", response.status); // logs HTTP response code
        return response.text();
      })
      .then((text) => {
        // 'text' is the return response from previous .then statement
        if (text.startsWith("{")) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log("Event created successfully:", text);
          fetchEvents(userOrgID);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error("Unexpected response:", text);
        }
      })
      .catch((error) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error("Error posting event:", error);
      });

    // Clear the input
    setNewEventName("");
    setNewEventDate("");
    setNewEventLocation("");
  };

  const handleDeleteEvent = (eventId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEventToDelete(eventId); // Set the team to delete
    setShowDeleteModal(true); // Show the confirmation modal
  };

  const confirmDelete = async () => {
    const token = await getToken();

    if (eventToDelete !== null) {
      fetch(
        `https://inp.pythonanywhere.com/api/delete-event/${eventToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
        .then((data) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log("Event deleted:", data);
          fetchEvents(userOrgID); // refresh list
        })
        .catch((err) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error("Error deleting event:", err);
        });
    }
    setShowDeleteModal(false); // Close the modal after confirming
    setEventToDelete(null); // Reset the team to delete
  };

  const cancelDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDeleteModal(false); // Close the modal without deleting
    setEventToDelete(null); // Reset the team to delete
  };

  const eventSetupFunc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowForm(true); // shows form to add event
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.topBar}>
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
              // router.push("/groups");
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

        <TouchableOpacity activeOpacity={0.3} onPress={eventSetupFunc}>
          <Image style={styles.plusIcon} source={plusIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerText}>Event List</Text>

        <View style={styles.line}></View>

        {events.map((event, index) => (
          <View
            key={index}
            style={[
              styles.button,
              { borderWidth: colorScheme === "light" ? 1 : 0 },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleDeleteEvent(event.id)}
              style={styles.deleteButtonWrapper}
            >
              <Image
                source={require("../assets/images/TrashIconWhite.png")}
                style={styles.deleteButton}
              />
            </TouchableOpacity>

            <TouchableOpacity
              key={index}
              style={{ flex: 1 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                teamsPage(event.id);
              }}
            >
              <Text style={styles.eventNameText}>{event.name}</Text>

              <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <Image
                  source={require("../assets/images/CalendarIcon.png")}
                  style={{ width: 20, height: 20 }}
                />
                <Text style={styles.buttonText}>{event.date}</Text>
              </View>

              <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <Image
                  source={require("../assets/images/LocationIcon.png")}
                  style={{ width: 22, height: 22 }}
                />

                <Text style={styles.buttonText}>{event.location}</Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "101%",
                }}
              >
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <Image
                    source={require("../assets/images/MemberIcon.png")}
                    style={{ width: 18, height: 18 }}
                  />

                  <Text style={styles.buttonText}>
                    {event.teamCount} Teams Registered
                  </Text>
                </View>

                <View
                  style={[
                    styles.eventTimeButton,
                    {
                      backgroundColor: statusColors[compareDates(event.date)],
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 14, color: "white", fontWeight: 600 }}
                  >
                    {compareDates(event.date)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {showDeleteModal && (
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          onClose={cancelDelete}
        />
      )}

      {events.length === 0 && (
        <View style={styles.centeredTextContainer}>
          <Text style={[styles.text, { color: theme.textColor }]}>
            Add FTC Events Here!
          </Text>
        </View>
      )}

      {showForm && ( // Only displays this when plus button is pressed, setting state to true
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
          style={{ width: "100%", display: "flex", alignItems: "center" }}
        >
          <TextInput
            placeholder="Enter event name"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={newEventName}
            onChangeText={setNewEventName} // stores text data in the newEventName state
          />
          <TextInput
            placeholder="Enter date mm/dd/yyyy"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={newEventDate}
            onChangeText={(text) => setNewEventDate(formatDateInput(text))} // stores text data in the newEventName state
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Enter location"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={newEventLocation}
            onChangeText={setNewEventLocation} // stores text data in the newEventName state
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
            <Text style={styles.buttonText}>Add Event</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 70,
  },
  container: {
    paddingTop: 1,
    flexDirection: "column",
    alignItems: "center",
  },
  homeIcon: {
    marginTop: 8,
    width: 60,
    height: 60,
    padding: 10,
    marginLeft: 15,
  },
  plusIcon: {
    width: 40,
    height: 40,
  },
  deleteButtonWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 13,
    left: 300,
    zIndex: 2,
    backgroundColor: "rgb(227, 45, 45)",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 20,
  },
  deleteButton: {
    position: "absolute",
    width: 16.5,
    height: 16.5,
  },
  eventTimeButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: "green",
    borderRadius: 99,
    marginRight: 10,
    marginTop: -8,
  },
  text: {
    color: "black",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerText: {
    fontWeight: "700",
    marginBottom: 5,
    marginTop: 15,
    fontSize: 22,
    color: "#cfa323",
  },
  line: {
    height: 3,
    width: 360,
    borderRadius: 99,
    backgroundColor: "lightgrey",
    marginTop: 10,
    marginBottom: 10,
  },
  headerSubText: {
    fontWeight: "500",
    fontSize: 16,
  },
  eventNameText: {
    color: "black",
    fontSize: 20,
    fontWeight: "700",
    paddingBottom: 13,
    paddingRight: 60,
    marginTop: 8,
  },

  buttonText: {
    color: "black",
    fontSize: 17,
    fontWeight: "500",
  },

  button: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    backgroundColor: "rgb(250,200,0)",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    width: "90%",
    borderRadius: 10,
    margin: 8,
    borderColor: "#dea300",
    borderStyle: "solid",
  },
  formContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    display: "flex",
    backgroundColor: "rgb(250,200,0)",
    padding: 15,
    width: "93%",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: "93%",
  },
  centeredTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
