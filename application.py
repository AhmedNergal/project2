import os
import datetime

from flask import Flask, request, jsonify, render_template, redirect, session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JSON_SORT_KEYS"] = False
socketio = SocketIO(app)

users = []
channels = {"general":[]}

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        print(channels)
        return render_template("index.html", channels=channels)
    elif request.method == "POST":
        return jsonify({"success":True, "channels":channels})

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    elif request.method == "POST":
        displayname = request.form.get("displayname")
        users.append(displayname)
        session['displayname'] = displayname
        return redirect("/", code=303)

@socketio.on("user connected")
def user_connected(data):
    user = data["displayname"]
    try:
        selected_channel = data["selected_channel"]
    except KeyError:
        selected_channel = None
    emit("server reply", {"channels":channels}, broadcast=True)

@socketio.on("create channel")
def channel(data):
    channel_name = data["channel_name"]
    if channel_name not in channels and channel_name != None:
        channels[channel_name] = []
        emit("channel created", {"channels":channels, "channel_name":channel_name}, broadcast=True)

@socketio.on("selected channel")
def selectedChannel(data):
    selected_channel = data["selected_channel"]
    print(channels)
    messages = channels[selected_channel]
    emit("logged to channel", {"channels":channels, "selected_channel":selected_channel, "messages":messages}, broadcast=True)

@socketio.on("message sent")
def sendMessage(data):
    print(channels)
    print("message")
    displayname = data["displayname"]
    selected_channel = data["selected_channel"]
    message = data["message"]
    time = datetime.datetime.now()
    timestamp = time.strftime('%d-%m-%Y %H:%M')
    print(timestamp)
    print(type(timestamp))
    fullMessageData = {"displayname":displayname, "message":message, "timestamp":timestamp}
    if len(channels[selected_channel]) <= 100:
        channels[selected_channel].append(fullMessageData)
        print(channels)
        emit("message recieved", {"displayname":displayname, "selected_channel":selected_channel, "message":message, "timestamp":timestamp}, broadcast=True)
    else:
        print("Maximum limit of messages (100 messages) was reached!!!")
