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
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

// Which field is currently being edited in the popup modal.
type EditableField = "auto" | "teleop" | "endgame" | "notes" | null;

export default function InfoScreen() {
  const { getToken } = useAuth();

  const fetchInfo = async () => {
    const token = await getToken();

    fetch(`https://inp.pythonanywhere.com/api/info/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
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
        }
      })
      .catch((err) => console.error("Error fetching events:", err));

    // gets team to display on topbar
    fetch(`https://inp.pythonanywhere.com/api/get-team/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

  const colorScheme = useColorScheme(); 

  const lightTheme = {
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

  const router = useRouter();
  const { id, event_id } = useLocalSearchParams(); // unique id depending on what event you clicked on

  const teamsPage = () => {
    console.log(event_id);
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

  // Info displayed in the UI
  const [autoScore, setAutoScore] = useState("");
  const [teleopScore, setTeleopScore] = useState("");
  const [endgameScore, setEndgameScore] = useState("");
  const [notes, setNotes] = useState("");

  // Which single field is being edited right now, and its in-progress value.
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [draftValue, setDraftValue] = useState("");

  // Config for each editable field: label shown in the modal, current value,
  // the setter to update local state after a successful save, the key the
  // API expects, and whether it should use a numeric keypad.
  const fieldConfig = {
    auto: {
      label: "Autonomous Score",
      value: autoScore,
      setter: setAutoScore,
      apiKey: "auto_score",
      numeric: true,
    },
    teleop: {
      label: "Teleop Score",
      value: teleopScore,
      setter: setTeleopScore,
      apiKey: "teleop_score",
      numeric: true,
    },
    endgame: {
      label: "Endgame Score",
      value: endgameScore,
      setter: setEndgameScore,
      apiKey: "endgame_score",
      numeric: true,
    },
    notes: {
      label: "Notes",
      value: notes,
      setter: setNotes,
      apiKey: "notes",
      numeric: false,
    },
  } as const;

  const openEditor = (field: Exclude<EditableField, null>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraftValue(fieldConfig[field].value);
    setEditingField(field);
  };

  const closeEditor = () => setEditingField(null);


  const handleSaveField = async () => {
    if (!editingField) return;
    const token = await getToken();

    const payload: Record<string, any> = {
      team_id: id,
      event_id: event_id,
      auto_score: autoScore,
      teleop_score: teleopScore,
      endgame_score: endgameScore,
      notes: notes,
    };
    payload[fieldConfig[editingField].apiKey] = draftValue;

    fetch(`https://inp.pythonanywhere.com/api/create-info`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Response Status:", response.status);
        return response.text();
      })
      .then((text) => {
        if (text.startsWith("{") || text.startsWith('"E')) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          fieldConfig[editingField].setter(draftValue);

          console.log("Event updated successfully:", text);
          fetchInfo();
          closeEditor();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error("Unexpected response:", text);
        }
      })
      .catch((error) => {
        console.error("Error posting event:", error);
      });
  };

  // Small helper so each score box doesn't repeat the same JSX 3 times.
  const renderScoreBox = (
    field: "auto" | "teleop" | "endgame",
    label: string,
    score: string,
    max: number | undefined,
  ) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openEditor(field)}
      style={[
        styles.button,
        {
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
          borderColor:
            colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
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
        <Text style={[styles.text, { fontSize: 18, color: theme.textColor }]}>
          {label}:
        </Text>
        <Text style={[styles.text, { fontSize: 20, color: theme.textColor }]}>
          {score || "0"}
        </Text>
      </View>

      <View style={styles.outerBar}>
        <View
          style={[
            styles.innerBar,
            {
              width: max
                ? `${Math.min((Number(score) / max) * 100, 100)}%`
                : "0%",
              backgroundColor:
                colorScheme === "dark" ? "rgb(250,200,0)" : "rgb(230,180,40)",
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
        <Text style={styles.smallestText}>max: {max}</Text>
      </View>
    </TouchableOpacity>
  );

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
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          {/* Topbar */}
          <View
            style={[
              styles.button,
              {
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "rgb(230,230,230)",
                borderColor:
                  colorScheme === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
              },
            ]}
          >
            <Text style={[styles.text, { color: theme.textColor, fontSize: 24 }]}>
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

          {renderScoreBox(
            "auto",
            "Autonomous Score",
            autoScore,
            highestScores?.auto_score,
          )}
          {renderScoreBox(
            "teleop",
            "Teleop Score",
            teleopScore,
            highestScores?.teleop_score,
          )}
          {renderScoreBox(
            "endgame",
            "Endgame Score",
            endgameScore,
            highestScores?.endgame_score,
          )}

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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openEditor("notes")}
            style={[
              styles.button,
              {
                paddingVertical: 10,
                paddingHorizontal: 10,
                marginBottom: 50,
                alignItems: "flex-start",
                backgroundColor:
                  colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                borderColor:
                  colorScheme === "dark"
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.2)",
              },
            ]}
          >
            <Text
              style={[
                styles.notesText,
                { color: notes ? theme.textColor : "#9a9a9a" },
              ]}
            >
              {notes || "Tap to add notes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {editingField && (
        <Modal transparent={true} animationType={"fade"}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                Edit {fieldConfig[editingField].label}
              </Text>

              <TextInput
                autoFocus
                placeholder={fieldConfig[editingField].label}
                placeholderTextColor="#b6b6b6"
                value={draftValue}
                onChangeText={setDraftValue}
                keyboardType={
                  fieldConfig[editingField].numeric ? "number-pad" : "default"
                }
                multiline={!fieldConfig[editingField].numeric}
                style={[
                  styles.input,
                  {
                    height: fieldConfig[editingField].numeric ? undefined : 100,
                    textAlign: fieldConfig[editingField].numeric ? "center" : "left",
                    fontSize: fieldConfig[editingField].numeric ? 28 : 16,
                    color: theme.textColor,
                    backgroundColor:
                      colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                    borderColor:
                      colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#d8d8d8",
                  },
                ]}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                  marginBottom: 12,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
                      borderColor:
                        colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#d8d8d8",
                    },
                  ]}
                  onPress={closeEditor}
                >
                  <Text
                    style={{ fontWeight: "bold", fontSize: 16, color: theme.textColor }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveField}>
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>Save</Text>
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
    fontWeight: "500",
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
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: "100%",
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
    padding: 20,
    borderRadius: 12,
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
    backgroundColor: "#fff",
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
  },
});