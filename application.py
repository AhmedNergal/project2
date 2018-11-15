import os
import glob
import datetime

from flask import Flask, request, jsonify, render_template, redirect, flash, url_for, send_from_directory
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "/home/nergal/Programming/Web Development/CS50 Web Programming with Python and Javascript/Projects/project2venv/project2env/project2/uploads"
ALLOWED_EXTENSIONS = set(["txt", "jpg", "jpeg", "gif", "png", "mp3", "mp4"])

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JSON_SORT_KEYS"] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
socketio = SocketIO(app, binary=True)

users_selected_channels = {}

channels = {"general":[]}

def allowed_file(filename):
    return "." in filename and \
            filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return render_template("index.html")
    elif request.method == "POST":
        return jsonify({"success":True, "channels":channels})

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    elif request.method == "POST":
        displayname = request.form.get("displayname")
        return redirect("/", code=303)

@socketio.on("user connected")
def user_connected(data):
    user = data["displayname"]
    if user not in users_selected_channels:
        users_selected_channels[user] = None
        selected_channel = users_selected_channels[user]
    elif user in users_selected_channels:
        if users_selected_channels[user] == None:
            selected_channel = None
        else:
            selected_channel = users_selected_channels[user]

    emit("server reply", {"channels":channels, "selected_channel":selected_channel})

@socketio.on("create channel")
def channel(data):
    channel_name = data["channel_name"]
    if channel_name not in channels and channel_name != None:
        channels[channel_name] = []
        emit("channel created", {"channels":channels, "channel_name":channel_name}, broadcast=True)

@socketio.on("selected channel")
def selectedChannel(data):
    selected_channel = data["selected_channel"]
    displayname = data["displayname"]
    users_selected_channels[displayname] = selected_channel
    try:
        messages = channels[selected_channel]
        emit("logged to channel", {"channels":channels, "selected_channel":selected_channel, "messages":messages})
    except KeyError:
        pass


@socketio.on("message sent")
def sendMessage(data):
    displayname = data["displayname"]
    selected_channel = users_selected_channels[displayname]
    message = data["message"]
    time = datetime.datetime.now()
    timestamp = time.strftime('%d-%b-%Y %I:%M %p')
    fullMessageData = {"displayname":displayname, "message":message, "timestamp":timestamp}
    if len(channels[selected_channel]) < 100:
        channels[selected_channel].append(fullMessageData)
        emit("message recieved", {"displayname":displayname, "selected_channel":selected_channel, "message":message, "timestamp":timestamp}, broadcast=True)
    else:
        del channels[selected_channel][0]
        channels[selected_channel].append(fullMessageData)
        emit("message recieved", {"displayname":displayname, "selected_channel":selected_channel, "message":message, "timestamp":timestamp}, broadcast=True)

@socketio.on("uploaded file")
def fileUpload(data):
    file = data["file"]
    filename = data["filename"]
    if allowed_file(filename) == True:
        filename = secure_filename(filename)
        #file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        f = open(os.path.join(app.config["UPLOAD_FOLDER"] + '/' + filename), 'wb+')
        f.write(file)
        f.close()
        extension = filename.rsplit('.', 1)[1].lower()
        if extension == "txt":
            file_type = "text" + "/" + extension
        elif extension in ["jpg", "jpeg", "gif", "png"]:
            file_type = "image" + "/" + extension
        elif extension == "mp3":
            file_type == "audio" + "/" + extension
        elif extension == "mp4":
            file_type == "video" + "/" + extension

        emit("file recieved", {"filename":filename, "file_type":file_type})
    else:
        emit("file not uploaded")

@socketio.on("get files")
def getFiles():
    uploaded_files = []
    os.chdir(UPLOAD_FOLDER)
    for filename in glob.glob("*"):
        extension = filename.rsplit(".", 1)[1].lower()
        if extension == "txt":
            file_type = "text" + "/" + extension
        elif extension in ["jpg", "jpeg", "gif", "png"]:
            file_type = "image" + "/" + extension
        elif extension == "mp3":
            file_type == "audio" + "/" + extension
        elif extension == "mp4":
            file_type == "video" + "/" + extension
        uploaded_files.append({"filename":filename, "file_type":file_type})
    emit("send uploaded files", {"uploaded_files":uploaded_files})

@app.route("/uploads/<path:filename>")
def downloadFile(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)
