from flask import Flask, request, jsonify
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST"),
        database=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        port=os.environ.get("DB_PORT")

    )


app = Flask(__name__)
next_event_id = 1
next_team_id = 1

events = []
teams = []


# USER EVENTS

# Get Users
@app.route("/api/users", methods=['GET'])
def get_users():
    con = get_db_connection()
    cur = con.cursor()

    cur.execute("""
        SELECT user_id, name, email, join_status FROM users;
    """)

    rows = cur.fetchall()

    cur.close()
    con.close()

    events = []
    for row in rows:
        events.append({
            "user_id": row[0],
            "name": row[1],
            "email": row[2],
            "join_status": row[3],
        })
    
    return jsonify(events), 200

# Create User
@app.route("/api/create-user", methods=['POST'])
def create_user():
    data = request.get_json()
    con = get_db_connection()
    cur = con.cursor()

    cur.execute("""
        INSERT INTO users (user_id, name, email)
        VALUES (%s, %s, %s);
    """, (data["user_id"], data["name"], data["email"],))

    con.commit()
    cur.close()
    con.close()

    output = {
        "user_id": data["user_id"],
        "name": data["name"],
        "email": data["email"]
    }

    return jsonify(output), 201

# EVENT ENDPOINTS
# Get Events
@app.route("/api/events", methods=['GET'])
def show_all_events():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, date, location FROM events;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    events = []
    for row in rows:
        events.append({
            "id": row[0],
            "name": row[1],
            "date": row[2],
            "location": row[3]
        })
    return jsonify(events), 200


# Get specific event
@app.route("/api/events/<int:event_id>", methods=["GET"])
def get_specific_event(event_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
            SELECT id, name, date, location
            FROM events
            WHERE id = %s;
        """, (event_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if row is None:
        return jsonify({"error": "event not found"}), 404

    output = {
        "id": row[0],
        "name": row[1],
        "date": row[2],
        "location": row[3]
    }

    return jsonify(output), 200

# Event Creation
@app.route("/api/create-event", methods=['POST'])
def create_event():
    data = request.get_json()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
            INSERT INTO events (name, date, location)
            VALUES (%s, %s, %s)

        """, (data["name"], data["date"], data["location"]))


    event_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()

    new_event = {
        "id": event_id,
        "name": data["name"],
        "date": data["date"],
        "location": data["location"]
    }

    return jsonify(new_event), 201



# Event Deletion
@app.route("/api/delete-event/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    conn = get_db_connection()
    cur = conn.cursor()

    # delete teams associated with the event
    cur.execute("DELETE FROM teams WHERE event_id = %s;", (event_id,))
    cur.execute("DELETE FROM events WHERE id = %s;", (event_id,))

    deleted_rows = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if deleted_rows > 0:
        return jsonify("Item(s) successfully deleted"), 200
    else:
        return jsonify("Event not found"), 404




# TEAM ENDPOINTS
# Get Teams
@app.route("/api/teams/<int:event_id>", methods=["GET"])
def get_teams(event_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
            SELECT team_id, event_id, date_created, name, number
            FROM teams
            WHERE event_id = %s;
        """, (event_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    teams = []
    for row in rows:
        teams.append({
            "team_id": row[0],
            "event_id": row[1],
            "date_created": row[2],
            "name": row[3],
            "number": row[4]
        })
    return jsonify(teams), 200

# Get team amount
@app.route("/api/team-amount/<int:event_id>", methods=["GET"])
def get_team_amount(event_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
            SELECT team_id
            FROM teams
            WHERE event_id = %s
    """, (event_id,))

    rows = cur.fetchall()
    cur.close()
    conn.close()
    length = len(rows)

    output = {
        "team-amount": length
    }
    return jsonify(output), 200

# Team Creation
@app.route("/api/create-team", methods=["POST"])
def create_team():
    data = request.get_json()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
            INSERT INTO teams (event_id, date_created, name, number)
            VALUES (%s, %s, %s, %s)

        """, (data["event_id"], data["date_created"], data["name"], data["number"]))

    team_id = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()

    new_team = {
        "team_id": team_id,
        "event_id": data["event_id"],
        "date_created": data["date_created"],
        "name": data["name"],
        "number": data["number"]
    }

    return jsonify(new_team), 201

# Team Deletion
@app.route("/api/delete-team/<int:team_id>", methods=["DELETE"])
def delete_team(team_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM teams WHERE team_id = %s", (team_id,))
    deleted_team = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if deleted_team > 0:
        return jsonify("Deleted"), 204
    else:
        return jsonify("Team not found"), 404

# Get Team Info
@app.route("/api/info/<int:team_id>", methods=["GET"])
def get_info(team_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT team_id, auto_score, teleop_score, endgame_score, notes
                FROM info
                WHERE team_id = %s;
            """, (team_id,))
    info = cur.fetchall()

    infoDict = []
    if info:
        row = info[0]
        infoDict.append({
            "team_id": row[0],
            "auto_score": row[1],
            "teleop_score": row[2],
            "endgame_score": row[3],
            "notes": row[4]
        })


    cur.close()
    conn.close()
    return jsonify(infoDict), 200


# Create/Edit Info
@app.route("/api/create-info", methods=["POST"])
def create_info():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
                SELECT team_id, auto_score, teleop_score, endgame_score, notes
                FROM info
                WHERE team_id = %s;
    """, (data["team_id"],))
    info = cur.fetchone()
    if info is None: # if entry doesn't already exist
        cur.execute("""
                    INSERT INTO info (team_id, auto_score, teleop_score, endgame_score, notes)
                    VALUES (%s, %s, %s, %s, %s)

                """, (data["team_id"], data["auto_score"], data["teleop_score"], data["endgame_score"], data["notes"]))


        new_info_dict = {
            "team_id": data["team_id"],
            "auto_score": data["auto_score"],
            "teleop_score": data["teleop_score"],
            "endgame_score": data["endgame_score"],
            "notes": data["notes"]
        }
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(new_info_dict)
    else:
        cur.execute("""
                UPDATE info
                SET auto_score = %s,
                    teleop_score = %s,
                    endgame_score = %s,
                    notes = %s
                WHERE team_id = %s
        """, (data["auto_score"], data["teleop_score"], data["endgame_score"], data["notes"], data["team_id"]))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify("Edited Existing Entry Successfully")

# Grab highest auto,teleop,endgame scores
@app.route("/api/info/highest-scores", methods=["GET"])
def get_highest():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            MAX(auto_score) AS auto_score,
            MAX(teleop_score) AS teleop_score,
            MAX(endgame_score) AS endgame_score
        FROM info;
    """)
    info = cur.fetchone()

    cur.close()
    conn.close()

    output = {
        "auto_score": info[0],
        "teleop_score": info[1],
        "endgame_score": info[2],
    }

    return jsonify(output), 200



# if __name__ == "__main__":
#     app.run(debug=True)