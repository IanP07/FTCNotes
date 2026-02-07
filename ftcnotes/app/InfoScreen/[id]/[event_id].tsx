import {
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  View,
  TextInput,
  useColorScheme,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

export default function InfoScreen() {
  const { getToken } = useAuth();

  const fetchInfo = async () => {
    const token = await getToken();

    fetch(`https://inp.pythonanywhere.com/api/info/${id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
      }
    }) // or your GET endpoint
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
    fetch(`https://inp.pythonanywhere.com/api/get-team/${id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
      }
    })
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
    fetch(`https://inp.pythonanywhere.com/api/info/highest-scores/${event_id}`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
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
      ? require("../../../assets/images/FTCNotesBackIconDark.png")
      : require("../../../assets/images/FTCNotesBackIconLight.png");

  const editIcon = require("../../../assets/images/editIcon2.png");

  const router = useRouter();
  const { id, event_id } = useLocalSearchParams(); // unique id depending on what event you clicked on

  const teamsPage = () => {
    console.log(event_id);
    // router.push(`/TeamsScreen/${event_id}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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

  // Info displayed in the UI 
  const [autoScore, setAutoScore] = useState(""); 
  const [teleopScore, setTeleopScore] = useState(""); 
  const [endgameScore, setEndgameScore] = useState(""); 
  const [notes, setNotes] = useState(""); 

  // Info that is editable in the modal
  const [draftAuto, setDraftAuto] = useState("");
  const [draftTeleop, setDraftTeleop] = useState("");
  const [draftEndgame, setDraftEndgame] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  const handleEditInfo = async () => {
    const token = await getToken();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    fetch(`https://inp.pythonanywhere.com/api/create-info`, {
      method: "POST",
      body: JSON.stringify({
        team_id: id,
        event_id: event_id,
        auto_score: draftAuto,
        teleop_score: draftTeleop,
        endgame_score: draftEndgame,
        notes: draftNotes,
      }),
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Response Status:", response.status); // logs HTTP response code
        return response.text();
      })
      .then((text) => {
        // 'text' is the return response from previous .then statement
        if (text.startsWith("{") || text.startsWith('"E')) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Sets real values to whatever was edited in the modal
          setAutoScore(draftAuto);
          setTeleopScore(draftTeleop);
          setEndgameScore(draftEndgame);
          setNotes(draftNotes);

          console.log("Event created successfully:", text);
          fetchInfo();
          setShowForm(false);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error("Unexpected response:", text);
        }
      })
      .catch((error) => {
        console.error("Error posting event:", error);
      });
  };

  const infoSetupFunc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Sets modal values to the same as the saved data
    setDraftAuto(autoScore);
    setDraftTeleop(teleopScore);
    setDraftEndgame(endgameScore);
    setDraftNotes(notes);

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
            alignItems: "center",
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

        <TouchableOpacity activeOpacity={0.3} onPress={infoSetupFunc}>
          <Image style={styles.editIcon} source={editIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!addInfo && (
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Topbar */}
            <View
              style={[
                styles.button,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgb(33,40,55)"
                      : "rgb(230,230,230)",
                  borderColor:
                    colorScheme === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                },
              ]}
            >
              <Text
                style={[styles.text, { color: theme.textColor, fontSize: 24 }]}
              >
                Team #{team?.number}
              </Text>
              <Text style={[styles.smallerText, { color: theme.textColor }]}>
                Total average:{" "}
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
            <View
              style={[
                styles.button,
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
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    styles.text,
                    { fontSize: 18, color: theme.textColor },
                  ]}
                >
                  Autonomous Score:
                </Text>
                <Text
                  style={[
                    styles.text,
                    { fontSize: 20, color: theme.textColor },
                  ]}
                >
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
                            100,
                          )}%`
                        : "0%",

                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgb(250,200,0)"
                          : "rgb(230,180,40)",
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
            <View
              style={[
                styles.button,
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
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    styles.text,
                    { fontSize: 18, color: theme.textColor },
                  ]}
                >
                  Teleop Score:
                </Text>
                <Text
                  style={[
                    styles.text,
                    { fontSize: 20, color: theme.textColor },
                  ]}
                >
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
                            100,
                          )}%`
                        : "0%",

                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgb(250,200,0)"
                          : "rgb(230,180,40)",
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
            <View
              style={[
                styles.button,
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
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    styles.text,
                    { fontSize: 18, color: theme.textColor },
                  ]}
                >
                  Endgame Score:
                </Text>
                <Text
                  style={[
                    styles.text,
                    { fontSize: 20, color: theme.textColor },
                  ]}
                >
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
                            100,
                          )}%`
                        : "0%",

                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgb(250,200,0)"
                          : "rgb(230,180,40)",
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
                {
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  alignItems: "flex-start",
                  backgroundColor:
                    colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                  borderColor:
                    colorScheme === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.2)",
                },
                ,
              ]}
            >
              <Text style={[styles.notesText, { color: theme.textColor }]}>
                {notes}
              </Text>
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

      {showForm && ( 
        // <KeyboardAvoidingView
        //   behavior={Platform.OS === "ios" ? "padding" : "height"}
        //   keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        //   style={{ width: "100%", display: "flex", alignItems: "center" }}
        // >
        //   <TextInput
        //     placeholder="Enter auto score"
        //     placeholderTextColor={theme.textColor}
        //     style={[styles.input, { color: theme.textColor }]}
        //     value={autoScore}
        //     onChangeText={setAutoScore}
        //     keyboardType="numeric"
        //   />
        //   <TextInput
        //     placeholder="Enter teleop score"
        //     placeholderTextColor={theme.textColor}
        //     style={[styles.input, { color: theme.textColor }]}
        //     value={teleopScore}
        //     onChangeText={setTeleopScore}
        //     keyboardType="numeric"
        //   />
        //   <TextInput
        //     placeholder="Enter endgame score"
        //     placeholderTextColor={theme.textColor}
        //     style={[styles.input, { color: theme.textColor }]}
        //     value={endgameScore}
        //     onChangeText={setEndgameScore}
        //     keyboardType="numeric"
        //   />
        //   <TextInput
        //     placeholder="Enter notes"
        //     placeholderTextColor={theme.textColor}
        //     style={[styles.input, { color: theme.textColor }]}
        //     value={notes}
        //     onChangeText={setNotes}
        //   />
        //   <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
        //     <Text style={[styles.buttonText]}>Add Info</Text>
        //   </TouchableOpacity>
        // </KeyboardAvoidingView>

        <Modal transparent={true} animationType={"fade"}> 
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalCard}
            >
              <Text style={styles.modalTitle}>Edit Team Info:</Text>

              <Text style={styles.inputText}>Auto Score</Text>
              <TextInput
                placeholder="Auto score"
                value={draftAuto}
                onChangeText={setDraftAuto}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.inputText}>Teleop Score</Text>
              <TextInput
                placeholder="Teleop score"
                value={draftTeleop}
                onChangeText={setDraftTeleop}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.inputText}>Endgame Score</Text>
              <TextInput
                placeholder="Endgame score"
                value={draftEndgame}
                onChangeText={setDraftEndgame}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.inputText}>Notes</Text>
              <TextInput
                placeholder="Notes"
                value={draftNotes}
                onChangeText={setDraftNotes}
                style={[styles.input, { height: 100 }]}
                multiline
              />
              <View style={{flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 12}}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                  <Text style={{fontWeight: "bold", fontSize: 16}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleEditInfo}>
                  <Text style={{fontWeight: "bold", fontSize: 16}}>Save</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

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
  editIcon: {
    width: 47,
    height: 47,
    padding: 10,
    marginTop: 17,
    marginRight: 15,
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
    width: 360,
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
    backgroundColor: "rgb(250,200,0)",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    width: "93%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: "100%",
  },
  inputText: {
    marginLeft: 2,
    fontWeight: 600,
    marginBottom: 5,
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 150,
    backgroundColor: "fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8d8d8",
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: 150,
    backgroundColor: "rgb(250,200,0)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dea300",
  }
});
