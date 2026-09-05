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
  PanResponder,
  Dimensions,
  GestureResponderEvent,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/clerk-expo";

// Which field is currently being edited in the popup modal.
type EditableField = "auto" | "teleop" | "endgame" | "notes" | null;

// ---- Field grid config/helpers ----
const GRID_SIZE = 12;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const tileIndex = (row: number, col: number) => row * GRID_SIZE + col;

const isAdjacent = (a: number, b: number) => {
  if (a === b) return false;
  const rowA = Math.floor(a / GRID_SIZE);
  const colA = a % GRID_SIZE;
  const rowB = Math.floor(b / GRID_SIZE);
  const colB = b % GRID_SIZE;
  return Math.abs(rowA - rowB) <= 1 && Math.abs(colA - colB) <= 1;
};

const hasAdjacentSelected = (index: number, selected: Set<number>) => {
  for (const sel of selected) {
    if (isAdjacent(index, sel)) return true;
  }
  return false;
};

// Converts the internal Set<number> representation into a plain array of
// {row, col} coordinates -- this is the shape you actually want to send
// to (and receive from) the backend, since raw tile indices are an
// internal detail of this component.
const tilesToCoordinates = (
  tiles: Set<number>,
): { row: number; col: number }[] =>
  Array.from(tiles)
    .sort((a, b) => a - b)
    .map((index) => ({
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
    }));

// Inverse of tilesToCoordinates -- rebuilds the Set<number> the grid
// component works with from an array of {row, col} coordinates (e.g. what
// comes back from the API).
const coordinatesToTiles = (
  coords: { row: number; col: number }[],
): Set<number> => new Set(coords.map(({ row, col }) => tileIndex(row, col)));

// Renders the FTC field image with a 12x12 grid on top of it.
// When `interactive` is true, tapping/dragging over tiles toggles them
function FieldGrid({
  selectedTiles,
  setSelectedTiles,
  size,
  interactive,
}: {
  selectedTiles: Set<number>;
  setSelectedTiles: React.Dispatch<React.SetStateAction<Set<number>>>;
  size: number;
  interactive: boolean;
}) {
  const cellSize = size / GRID_SIZE;

  // Tracks whether the current drag gesture is adding or removing tiles,
  // decided by whatever the finger first touched down on.
  const gestureModeRef = useRef<"add" | "remove" | null>(null);
  // Tiles already handled during the current gesture, so a lingering
  // finger doesn't keep re-toggling the same tile on every move event.
  const processedRef = useRef<Set<number>>(new Set());

  // locationX/locationY on gesture events aren't reliably relative to this
  // container (they can end up relative to whatever child view got
  // hit-tested), so instead we track this container's own screen position
  // and work off of pageX/pageY, which are always screen-absolute.
  const containerRef = useRef<View>(null);
  const containerOffset = useRef({ x: 0, y: 0 });

  const measureContainer = () => {
    containerRef.current?.measureInWindow((x, y) => {
      containerOffset.current = { x, y };
    });
  };

  const getTileFromPagePosition = (pageX: number, pageY: number) => {
    const x = pageX - containerOffset.current.x;
    const y = pageY - containerOffset.current.y;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return tileIndex(row, col);
  };

  const handleTouch = (pageX: number, pageY: number, isStart: boolean) => {
    const index = getTileFromPagePosition(pageX, pageY);
    if (index === null) return;
    if (processedRef.current.has(index)) return;

    if (isStart) {
      processedRef.current = new Set();
      gestureModeRef.current = selectedTiles.has(index) ? "remove" : "add";
    }
    processedRef.current.add(index);

    setSelectedTiles((prev) => {
      const next = new Set(prev);
      if (gestureModeRef.current === "remove") {
        next.delete(index);
        return next;
      }
      // add mode
      if (next.has(index)) return next;
      if (next.size === 0 || hasAdjacentSelected(index, next)) {
        next.add(index);
      }
      return next;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Re-measure right before use in case the modal/layout only just
        // settled (e.g. right after the fullscreen editor opens).
        measureContainer();
        // measureInWindow's callback can land a frame late on first open,
        // so also fall back to page coords immediately using the last
        // known offset (0,0 the very first time) and rely on the fresh
        // measurement being ready for subsequent moves.
        handleTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY, true);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        handleTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY, false);
      },
      onPanResponderRelease: () => {
        gestureModeRef.current = null;
        processedRef.current = new Set();
      },
      onPanResponderTerminate: () => {
        gestureModeRef.current = null;
        processedRef.current = new Set();
      },
    })
  ).current;

  return (
    <View
      ref={containerRef}
      onLayout={measureContainer}
      style={{ width: size, height: size }}
      // "box-only" makes this View the sole touch target and stops the
      // image/grid-cell children underneath from being hit-tested.
      pointerEvents={interactive ? "box-only" : "auto"}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <Image
        // Save the attached top-down field image into your assets folder
        // and point this at it (adjust the relative path as needed).
        source={require("../../../assets/images/FTCField.png")}
        style={{ width: size, height: size, position: "absolute" }}
        resizeMode="stretch"
      />
      <View style={{ width: size, height: size }}>
        {Array.from({ length: GRID_SIZE }).map((_, row) => (
          <View key={row} style={{ flexDirection: "row" }}>
            {Array.from({ length: GRID_SIZE }).map((_, col) => {
              const index = tileIndex(row, col);
              const isSelected = selectedTiles.has(index);
              return (
                <View
                  key={col}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: isSelected
                      ? "rgba(250, 192, 0, 0.49)"
                      : "transparent",
                    borderWidth: 0.5,
                    borderColor: "rgba(255,255,255,0.18)",
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

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

          // field_tiles comes back as either a JSON string (if the backend
          // stores it as raw TEXT) or an already-parsed array/object,
          // depending on how your API serializes it -- handle both.
          if (info["field_tiles"]) {
            try {
              const coords =
                typeof info["field_tiles"] === "string"
                  ? JSON.parse(info["field_tiles"])
                  : info["field_tiles"];
              setSelectedTiles(coordinatesToTiles(coords));
            } catch (err) {
              console.error("Failed to parse field_tiles:", err);
            }
          }
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

  // Field position grid: which tiles are colored, and whether the
  // fullscreen editor for it is open.
  const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set());
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);

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

  const openFieldEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFieldEditorOpen(true);
  };

  // Sends the current tile selection to the backend, in the same
  // create-info shape as the other fields, as {row, col} coordinates.
  const saveFieldTiles = async (tiles: Set<number>) => {
    const token = await getToken();

    const payload: Record<string, any> = {
      team_id: id,
      event_id: event_id,
      auto_score: autoScore,
      teleop_score: teleopScore,
      endgame_score: endgameScore,
      notes: notes,
      field_tiles: tilesToCoordinates(tiles),
    };

    try {
      const response = await fetch(`https://inp.pythonanywhere.com/api/create-info`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      if (text.startsWith("{") || text.startsWith('"E')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("Field tiles saved:", text);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error("Unexpected response saving field tiles:", text);
      }
    } catch (error) {
      console.error("Error saving field tiles:", error);
    }
  };

  const closeFieldEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFieldEditorOpen(false);
    saveFieldTiles(selectedTiles);
  };

  const clearFieldTiles = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTiles(new Set());
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

          {/* Field Positions Section: */}
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
            Field Positions
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openFieldEditor}
            style={{ alignSelf: "center", marginBottom: 50 }}
          >
            <FieldGrid
              selectedTiles={selectedTiles}
              setSelectedTiles={setSelectedTiles}
              size={340}
              interactive={false}
            />
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

      {isFieldEditorOpen && (
        <Modal transparent={false} animationType={"fade"}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FieldGrid
              selectedTiles={selectedTiles}
              setSelectedTiles={setSelectedTiles}
              size={SCREEN_WIDTH - 32}
              interactive={true}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 16,
                marginTop: 24,
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
                onPress={clearFieldTiles}
              >
                <Text
                  style={{ fontWeight: "bold", fontSize: 16, color: theme.textColor }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={closeFieldEditor}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
            </View>
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