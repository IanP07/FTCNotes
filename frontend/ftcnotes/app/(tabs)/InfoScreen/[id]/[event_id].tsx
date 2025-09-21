import {
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  useColorScheme,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";

export default function InfoScreen() {
  const fetchInfo = () => {
    fetch(`https://inp.pythonanywhere.com/api/info/${id}`) // or your GET endpoint
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch info: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.length > 0) {
          const info = data[0]; // needed to get dict because GET returns a list containing a dict
          setAutoScore(info["auto_score"]);
          setTeleopScore(info["teleop_score"]);
          setEndgameScore(info["endgame_score"]);
          setNotes(info["notes"]);
          setAddInfo(false); // hides initial info text
        }
      })
      .catch((err) => console.error("Error fetching events:", err));

    // gets team to display on topbar
    fetch(`https://inp.pythonanywhere.com/api/get-team/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch team: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTeam(data);
      });

    // gets highest scores across all teams to compare with current team
    fetch(`https://inp.pythonanywhere.com/api/info/highest-scores/${event_id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch highest scores ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setHighestScores(data);
      });
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const colorScheme = useColorScheme(); // accesses users current system color scheme

  const lightTheme = {
    // may change light mode colors later
    background: "#F3F3F3",
    textColor: "#000000",
  };

  const darkTheme = {
    background: "#111827",
    textColor: "#EFECD7",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const backIcon =
    colorScheme === "dark"
      ? require("../../../../assets/images/FTCNotesBackIconDark.png")
      : require("../../../../assets/images/FTCNotesBackIconLight.png");

  const plusIcon =
    colorScheme === "dark"
      ? require("../../../../assets/images/FTCNotesPlusIconDark.png")
      : require("../../../../assets/images/FTCNotesPlusIconLight.png");

  const router = useRouter();
  const { id, event_id } = useLocalSearchParams(); // unique id depending on what event you clicked on

  const teamsPage = () => {
    console.log(event_id);
    router.push(`../../TeamsScreen/${event_id}`);
  };

  const [team, setTeam] = useState<{
    team_id: number;
    event_id: number;
    date_created: string;
    name: string;
    number: number;
  } | null>(null);

  const [highestScores, setHighestScores] = useState<{
    auto_score: number;
    teleop_score: number;
    endgame_score: number;
  } | null>(null);

  const [showForm, setShowForm] = useState(false); // toggles form visibility
  const [addInfo, setAddInfo] = useState(true); // Initial text on screen
  const [eventID, setEventID] = useState(""); // event_id to return to team_screen

  const [autoScore, setAutoScore] = useState(""); // notes user is currently creating
  const [teleopScore, setTeleopScore] = useState(""); // notes user is currently creating
  const [endgameScore, setEndgameScore] = useState(""); // notes user is currently creating
  const [notes, setNotes] = useState(""); // notes user is currently creating

  const handleAddEvent = () => {
    console.log(id);
    fetch(`https://inp.pythonanywhere.com/api/create-info`, {
      method: "POST",
      body: JSON.stringify({
        team_id: id,
        event_id: event_id,
        auto_score: autoScore,
        teleop_score: teleopScore,
        endgame_score: endgameScore,
        notes: notes,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        console.log("Response Status:", response.status); // logs HTTP response code
        return response.text();
      })
      .then((text) => {
        // 'text' is the return response from previous .then statement
        if (text.startsWith("{") || text.startsWith('"E')) {
          console.log("Event created successfully:", text);
          fetchInfo();
        } else {
          console.error("Unexpected response:", text);
        }
      })
      .catch((error) => {
        console.error("Error posting event:", error);
      });

    // Clears all team info
    setNotes("");
    setAutoScore("");
    setTeleopScore("");
    setEndgameScore("");

    setShowForm(false); // Hides the form
  };

  const eventSetupFunc = () => {
    setShowForm(true); // shows form to add info
    setAddInfo(false); // hides initial info text
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.topBar}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity activeOpacity={0.3} onPress={teamsPage}>
            <Image style={styles.backIcon} source={backIcon} />
          </TouchableOpacity>

          <Text
            style={[
              styles.text,
              { paddingTop: 25 },
              { color: theme.textColor },
              { fontSize: 28 },
            ]}
          >
            {team?.name && team.name.length > 18
              ? team.name.slice(0, 18) + "..."
              : team?.name}
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.3} onPress={eventSetupFunc}>
          <Image style={styles.plusIcon} source={plusIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!addInfo && (
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Topbar */}
            <View style={styles.button}>
              <Text
                style={[styles.text, { color: theme.textColor, fontSize: 24 }]}
              >
                Team #{team?.number}
              </Text>
              <Text style={[styles.smallerText, { color: theme.textColor }]}>
                Average Score:{" "}
                {Number(autoScore) + Number(teleopScore) + Number(endgameScore)}{" "}
                points
              </Text>
            </View>

            <Text
              style={[
                styles.text,
                {
                  color: theme.textColor,
                  fontSize: 26,
                  marginLeft: 20,
                  marginTop: 35,
                },
              ]}
            >
              Performance Breakdown
            </Text>
            {/* Auto Score box */}
            <View style={[styles.button, { alignItems: "center" }]}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={[styles.text, { fontSize: 18, color: "white" }]}>
                  Autonomous Score:
                </Text>
                <Text style={[styles.text, { fontSize: 20, color: "white" }]}>
                  {autoScore}
                </Text>
              </View>

              <View style={styles.outerBar}>
                <View
                  style={[
                    styles.innerBar,
                    {
                      // Calculates innerBar width as a % of max score, capped at 100%
                      width: highestScores?.auto_score
                        ? `${Math.min(
                            (Number(autoScore) / highestScores.auto_score) *
                              100,
                            100
                          )}%`
                        : "0%",
                    },
                  ]}
                ></View>
              </View>

              <View
                style={{
                  marginTop: 5,
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.smallestText}>0</Text>
                <Text style={styles.smallestText}>
                  max: {highestScores?.auto_score}
                </Text>
              </View>
            </View>

            {/* Teleop Score box  */}
            <View style={[styles.button, { alignItems: "center" }]}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={[styles.text, { fontSize: 18, color: "white" }]}>
                  Teleop Score:
                </Text>
                <Text style={[styles.text, { fontSize: 20, color: "white" }]}>
                  {teleopScore}
                </Text>
              </View>

              <View style={styles.outerBar}>
                <View
                  style={[
                    styles.innerBar,
                    {
                      // Calculates innerBar width as a % of max score, capped at 100%
                      width: highestScores?.auto_score
                        ? `${Math.min(
                            (Number(teleopScore) / highestScores.teleop_score) *
                              100,
                            100
                          )}%`
                        : "0%",
                    },
                  ]}
                ></View>
              </View>

              <View
                style={{
                  marginTop: 5,
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.smallestText}>0</Text>
                <Text style={styles.smallestText}>
                  max: {highestScores?.teleop_score}
                </Text>
              </View>
            </View>

            {/* Endgame Score box  */}
            <View style={[styles.button, { alignItems: "center" }]}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={[styles.text, { fontSize: 18, color: "white" }]}>
                  Endgame Score:
                </Text>
                <Text style={[styles.text, { fontSize: 20, color: "white" }]}>
                  {endgameScore}
                </Text>
              </View>

              <View style={styles.outerBar}>
                <View
                  style={[
                    styles.innerBar,
                    {
                      // Calculates innerBar width as a % of max score, capped at 100%
                      width: highestScores?.endgame_score
                        ? `${Math.min(
                            (Number(endgameScore) /
                              highestScores.endgame_score) *
                              100,
                            100
                          )}%`
                        : "0%",
                    },
                  ]}
                ></View>
              </View>

              <View
                style={{
                  marginTop: 5,
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.smallestText}>0</Text>
                <Text style={styles.smallestText}>
                  max: {highestScores?.endgame_score}
                </Text>
              </View>
            </View>

            {/* Notes Section: */}
            <Text
              style={[
                styles.text,
                {
                  color: theme.textColor,
                  fontSize: 26,
                  marginLeft: 20,
                  marginTop: 10,
                },
              ]}
            >
              Notes
            </Text>
            <View
              style={[
                styles.button,
                { paddingVertical: 10, paddingHorizontal: 10 },
              ]}
            >
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {addInfo && (
        <View style={styles.centeredTextContainer}>
          <Text style={[styles.text, { color: theme.textColor }]}>
            Add Info Here!
          </Text>
        </View>
      )}

      {showForm && ( // Only displays this when plus button is pressed, setting state to true
        <View
          style={[styles.formContainer, { backgroundColor: theme.background }]}
        >
          <TextInput
            placeholder="Enter auto score"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={autoScore}
            onChangeText={setAutoScore}
          />
          <TextInput
            placeholder="Enter teleop score"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={teleopScore}
            onChangeText={setTeleopScore}
          />
          <TextInput
            placeholder="Enter endgame score"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={endgameScore}
            onChangeText={setEndgameScore}
          />
          <TextInput
            placeholder="Enter notes"
            placeholderTextColor={theme.textColor}
            style={[styles.input, { color: theme.textColor }]}
            value={notes}
            onChangeText={setNotes}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
            <Text style={[styles.buttonText]}>Add Info</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 60,
    justifyContent: "space-between",
    flexDirection: "row",
    width: "100%",
    height: "15%",
  },

  container: {
    display: "flex",
    paddingTop: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 60,
    height: 60,
    padding: 8,
    marginLeft: 15,
    marginTop: 11,
  },
  plusIcon: {
    width: 60,
    height: 60,
    padding: 10,
    marginRight: 20,
    marginTop: 11,
  },
  text: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 15,
  },
  smallerText: {
    fontSize: 21,
    fontWeight: "500",
  },
  smallestText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgb(153, 158, 170)",
  },
  notesText: {
    color: "white",
    fontSize: 15,
    fontWeight: 500,
  },
  buttonText: {
    color: "black",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: 380,
    borderRadius: 10,
    minHeight: 110,
    margin: 8,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    alignSelf: "center",
    backgroundColor: "rgb(33,40,55)",
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
  formContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    backgroundColor: "#f0d41a",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
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
  outerBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    height: 10,
    width: 340,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 99,
    marginTop: 4,
  },
  innerBar: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "rgb(250,200,0)",
  },
});
