import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, abort, redirect, session, url_for
from flask_session import Session
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
import json
from cs50 import SQL
from werkzeug.security import check_password_hash, generate_password_hash
import uuid 
from functools import wraps
import random
import string
from datetime import datetime, timedelta

load_dotenv()
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_api_key_sid = os.environ.get('TWILIO_API_KEY_SID')
twilio_api_key_secret = os.environ.get('TWILIO_API_KEY_SECRET')
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Must configure to use sessions[]
app.secret_key = os.environ.get('APP_SECRET_KEY')

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///workout.db")

def login_required(f):
    """
    Decorate routes to require login.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

@app.route("/joinworkout")
@login_required
def joinworkout():
    if request.method == "GET":

        workout_id= request.args.get('workout_id')
        workout_name = request.args.get('workout_name')

        # Query for the workout's exercise list 
        exercise_list = db.execute("SELECT * FROM exercises WHERE w_id = :workout_id", workout_id=workout_id)

        return render_template('joinworkout.html',exercises=exercise_list,workout_name=workout_name)

@app.route('/enterroom', methods=['POST'])
@login_required
def enterroom():
    username = request.get_json(force=True).get('username')
    room_id = request.get_json(force=True).get('room_id')

    if not username:
        abort(401)

    print("Room id:", room_id)

    token = AccessToken(twilio_account_sid, twilio_api_key_sid,
                        twilio_api_key_secret, identity=username)
    token.add_grant(VideoGrant(room=room_id))

    return {'token': token.to_jwt().decode()}

@app.route("/")
@login_required
def index():

    # Get list of friend requests
    friend_requests = db.execute("SELECT userA_id FROM friends WHERE userB_id = :user_id AND accepted = 0", user_id=session["user_id"])
    request_list = []
    for request in friend_requests:
        username = db.execute("SELECT username FROM users WHERE user_id=:req_id", req_id=request["userA_id"])[0]["username"]
        request_list.append({"username":username, "user_id": request["userA_id"]})

    # Get list of friends
    friends_list = db.execute("SELECT users.username,users.user_id FROM users JOIN friends ON users.user_id = friends.userB_id WHERE friends.userA_id = :user_id AND friends.accepted = 1",user_id=session["user_id"])

    friends_name_list = []
    friends_id_list = []
    for friend in friends_list:
        friends_name_list.append(friend["username"])
        friends_id_list.append(friend["user_id"])

    workouts = []

    # Get creator's own workouts 
    temp_workouts = db.execute("SELECT * FROM workouts WHERE c_id = :user_id",user_id=session["user_id"])
    for workout in temp_workouts:
        end_time = datetime.strptime(workout["end_time"], '%Y-%m-%d %H:%M:%S')
        start_time = datetime.strptime(workout["start_time"], '%Y-%m-%d %H:%M:%S')
        workout["end_time"] = end_time
        workout["start_time"] = start_time

        if end_time > datetime.now():
            workouts.append(workout)

    # Display list of friends workouts 
    for friend_id in friends_id_list:
        tmp_workouts = db.execute("SELECT * FROM workouts WHERE c_id = :friend_id",friend_id=friend_id)

        # Loop through all workouts that friend setup
        for workout in tmp_workouts:

            # Check current time isn't past workout end time 
            end_time = datetime.strptime(workout["end_time"], '%Y-%m-%d %H:%M:%S')
            start_time = datetime.strptime(workout["start_time"], '%Y-%m-%d %H:%M:%S')

            workout["end_time"] = end_time
            workout["start_time"] = start_time

            if end_time > datetime.now():
                workouts.append(workout)

    # Sort for most recent
    workouts.sort(key = lambda x:x["start_time"]) 

    return render_template("index.html", requests=request_list,friends=friends_name_list,workouts=workouts)

@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    # Require a username - apology is input is blank or username already exists
    if request.method == "POST":
        username = request.form.get("username")

        #Check if username already exists
        users = db.execute("SELECT username FROM users")
        for user in users:
            if username == user["username"]:
                return render_template('register.html',errorMessage='Username already used')

        password = request.form.get("password")
        confirm_password = request.form.get("password-confirmation")

        if password != confirm_password:
            return render_template('register.html',errorMessage="Passwords don't match")

        password_hash = generate_password_hash(password)

        user_id = str(uuid.uuid4())

        db.execute("INSERT INTO users (user_id, username, hash) VALUES (:user_id, :username, :passwordHash)",user_id=user_id, username=username, passwordHash=password_hash)

        session["user_id"] = user_id

        # Redirect user to home page
        return render_template("index.html")
    else:
        return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return render_template("login.html",errorMessage='Incorrect username or password')

        # Remember which user has logged in
        session["user_id"] = rows[0]["user_id"]

        # Redirect user to home page
        return redirect(url_for('index'))

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/login")

@app.route("/search", methods=["GET"])
@login_required
def search():
    #Only show people the person hasn't requested yet
    users = db.execute("SELECT users.user_id, users.username FROM users WHERE \
        NOT EXISTS (SELECT 1 FROM friends WHERE userA_id = :user_id AND userB_id = users.user_id)", user_id=session["user_id"])
    
    return render_template("search.html", people=users,current_id=session["user_id"])

@app.route("/addfriend", methods=["POST"])
@login_required
def addfriend():
    username = request.form.get("friend")
    
    #Query database for the id of that username - do a join
    friend_id = db.execute("SELECT user_id FROM users WHERE username = :username", username=username)[0]['user_id']
    db.execute("INSERT INTO friends (userA_id, userB_id, accepted) VALUES (:userA_id, :userB_id, :accepted)", userA_id=session['user_id'], userB_id=friend_id,accepted=0)

    return redirect("/search")

@app.route("/acceptrequest", methods=["POST"])
@login_required
def acceptrequest():
    user_id = request.form.get("friendrequest")
    # Update existing relationship
    db.execute("UPDATE friends SET accepted = 1 WHERE userA_id=:userA_id AND userB_id=:userB_id",userA_id=user_id,userB_id=session["user_id"])
    # Create new friendship relationship
    db.execute("INSERT INTO friends (userA_id, userB_id, accepted) VALUES (:userA_id, :userB_id, 1)", userA_id=session["user_id"],userB_id=user_id)
    return redirect("/")

# get random string password with letters, digits, and symbols
def get_random_password_string(length):
    password_characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(password_characters) for i in range(length))
    return password 

@app.route("/createworkout", methods=["GET", "POST"])
@login_required
def createworkout():
    if request.method == "GET":
        return render_template("create.html")
    else:
        db = SQL("sqlite:///workout.db")

        workout_name = request.get_json(force=True).get('workoutName')
        start_time = request.get_json(force=True).get('startTime')
        end_time = request.get_json(force=True).get('endTime')
        exercises = request.get_json(force=True).get('exercises')

        workout_id = str(uuid.uuid4())

        # Record the workout session
        db.execute("INSERT INTO workouts (c_id, w_id, start_time, end_time, name) \
            VALUES (:creator_id, :workout_id, datetime(:start_time), datetime(:end_time), :name)", \
                creator_id=session["user_id"], workout_id=workout_id,start_time=start_time,end_time=end_time,name=workout_name)

        # Record exercises in the workout session
        for i in range(len(exercises)):
            exercise = exercises[i]
            name = exercise["ex_name"]
            sets_min = int(exercise["sets_min"])
            reps_sec = int(exercise["reps_sec"])
            ex_type = exercise["ex_type"]
            order = i+1
        
            db.execute("INSERT INTO exercises (w_id, ex_name, sets_min, reps_sec, ex_type, ex_order) VALUES (:workout_id, :exercise_name, :sets_minutes, :reps_seconds, :exercise_type, :ex_order)", workout_id=workout_id,exercise_name=name,sets_minutes=sets_min,reps_seconds=reps_sec,exercise_type=ex_type,ex_order=order)

        return 'stringna'
    