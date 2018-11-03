document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("displayname")){
      window.location.pathname = "/register"
    }

    var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);

    socket.on("connect", () => {
      displayname = localStorage.getItem("displayname");
      if (!localStorage.getItem("selected_channel")){
        const request = new XMLHttpRequest();
        request.open("POST", "/");

        request.onload = () => {
          const data = JSON.parse(request.responseText);
          console.log(data);
          if (data.success){
            ViewChannels(data);
            SelectChannel();
        socket.emit("user connected", {"displayname":displayname});
      }
    }

    request.send();
  } else {
        selected_channel = localStorage.getItem("selected_channel");
        const request = new XMLHttpRequest();
        request.open("POST", "/");

        request.onload = () => {
          console.log(request.responseText);
          var data = JSON.parse(request.responseText);
          console.log(data);
          if (data.success){
            ViewChannels(data);
            selected_channel = SelectChannel();
            try {
              ViewMessages(data);
            }

            catch (e){
              if (e instanceof TypeError){
                
              }
            }
            socket.emit("user connected", {"displayname":displayname, "selected_channel":selected_channel});
          }
        }
        request.send();
      }
    });

    socket.on("server reply", () => {
      document.querySelector("#channel-submit").onclick = () => {
          const channel_name = document.querySelector("#channel-name").value;
          socket.emit("create channel", {"channel_name":channel_name});
    }
  });


    socket.on("channel created", data => {
    AddChannel(data);
    if (!localStorage.getItem("selected_channel")){
      selected_channel = SelectChannel()
      console.log(selected_channel)
      console.log(typeof(selected_channel))
    } else {
      SelectChannel()
      selected_channel = localStorage.getItem("selected_channel");
      socket.emit('selected channel', {"selected_channel":selected_channel});
    }
  });

    socket.on("logged to channel", data => {
      ViewMessages(data);
      const selected_channel = localStorage.getItem("selected_channel");
      const displayname = localStorage.getItem("displayname");
      document.querySelector("#message-submit").onclick = () => {
        message = document.querySelector("#message-text").value;
        socket.emit('message sent', {"displayname":displayname, "message":message, "selected_channel":selected_channel});
      }
    });

    socket.on("message recieved", data => {
    });

    function SelectChannel(){
      document.querySelectorAll(".channel").forEach(channel => {
          if (!localStorage.getItem("selected_channel")){
          } else if (localStorage.getItem("selected_channel") == channel.dataset.channelName) {
            channel.classList.add("selected-channel");
          }
        channel.onclick = () => {
          let allChannels = Array.from(channel.parentNode.children);
          allChannels.forEach(childChannel => {
            childChannel.classList.remove("selected-channel");
          });
          const selected_channel = channel.dataset.channelName;
          console.log(typeof(selected_channel));
          channel.classList.add("selected-channel");
          localStorage.setItem("selected_channel", selected_channel)
          socket.emit('selected channel', {"selected_channel":selected_channel});
        }
      });
    }
});

function ViewMessages(data){
  selected_channel = localStorage.getItem("selected_channel");
  messages = data["channels"][selected_channel];
  console.log(messages)

  var chatBox = document.querySelector("#chat-box");
  while (chatBox.firstChild){
    chatBox.firstChild.remove();
  }

  for (var i = 0; i < messages.length; i++){

    chatBox = document.querySelector("#chat-box");

    chatBox.dataset.selectedChannel = selected_channel;

    const displayname = messages[i]["displayname"];
    const messageText = messages[i]["message"];
    const timestamp = messages[i]["timestamp"];

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");

    const displaynameMessageElement = document.createElement("p");
    displaynameMessageElement.innerHTML = displayname;
    displaynameMessageElement.classList.add("displayname");

    const messageTextMessageElement = document.createElement("p");
    messageTextMessageElement.innerHTML = messageText;
    messageTextMessageElement.classList.add("message-text");

    const timestampMessageElement = document.createElement("p");
    timestampMessageElement.innerHTML = timestamp;
    timestampMessageElement.classList.add("timestamp");

    chatBox.appendChild(newMessage);

    newMessage.appendChild(displaynameMessageElement);
    newMessage.appendChild(messageTextMessageElement);
    newMessage.appendChild(timestampMessageElement);
  };

}

function ViewChannels(data){
  channels = data["channels"];
  console.log(channels);
  for (key in channels) {
    console.log(key);
    var channelList = document.querySelector("#channels");
    const newChannel = document.createElement('div');
    newChannel.className = "channel";
    const a = document.createElement('a');
    a.innerHTML = key;
    newChannel.dataset.channelName = key;
    newChannel.appendChild(a);
    channelList.appendChild(newChannel);
    document.querySelector("#channels").append(newChannel);
  }
}

function AddChannel(data){
  let channelList = document.querySelector("#channels");
  const newChannel = document.createElement('div');
  newChannel.className = "channel";
  const a = document.createElement('a');
  a.innerHTML = data["channel_name"];
  newChannel.dataset.channelName = data["channel_name"];
  newChannel.appendChild(a);
  channelList.appendChild(newChannel);
  document.querySelector("#channels").append(newChannel);
}
