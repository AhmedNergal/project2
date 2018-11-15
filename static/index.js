document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("displayname")){
      window.location.pathname = "/register"
    }

    var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);

    socket.on("connect", () => {
      const displayname = localStorage.getItem("displayname");

      const request = new XMLHttpRequest();
      request.open("POST", "/");

      request.onload = () => {
        const data = JSON.parse(request.responseText);
        ViewChannels(data);
        socket.emit("user connected", {"displayname":displayname});
      }

      request.send();

      socket.on("server reply", data => {
        const displayname = localStorage.getItem("displayname");
        const selected_channel = data["selected_channel"];
        ViewSelectedChannel(selected_channel);
        SelectChannel();
        ViewMessages(data);
        socket.emit('selected channel', {"selected_channel":selected_channel, "displayname":displayname});
        document.querySelector("#channel-submit").onclick = () => {
            const channel_name = document.querySelector("#channel-name").value;
            if (channel_name != "" && channel_name != null){
              document.querySelector("#channel-name").value = "";
              socket.emit("create channel", {"channel_name":channel_name});
            }
      }
    });


      socket.on("channel created", data => {
        AddChannel(data);
        selected_channel = SelectChannel();
        socket.emit('selected channel', {"selected_channel":selected_channel});
    });

      socket.on("logged to channel", data => {
        ViewMessages(data);
        const selected_channel = data["selected_channel"];
        const displayname = localStorage.getItem("displayname");
        document.querySelector("#message-submit").onclick = () => {
          let message = document.querySelector("#message-text").value;
          if (message != "" && message != null){
            document.querySelector("#message-text").value = "";
            socket.emit('message sent', {"displayname":displayname, "message":message, "selected_channel":selected_channel});
          }
        }
      });

      socket.on("message recieved", data => {
        let selected_channel = data["selected_channel"];
        let selected_channel_dom = document.querySelector(".selected-channel");

        if (selected_channel_dom != null){
          if (selected_channel_dom.dataset.channelName == selected_channel){
            chatBox = document.querySelector("#chat-box");

            const displayname = data["displayname"];
            const messageText = data["message"];
            const timestamp = data["timestamp"];

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

            chatBox.scrollTop = chatBox.scrollHeight;
        }

      }
    });

    // FILE UPLOAD

    document.querySelector("#file-submit").onclick = () => {
      var file = document.querySelector("#file-input").files[0];
      filename = file.name;
      socket.emit("uploaded file", {"file":file, "filename":filename});
    }

    socket.on("file recieved", data => {
      alert("File successfully uploaded!!");
      let fileBox = document.querySelector("#file-box");
      filename = data["filename"];
      file_type = data["file_type"];
      file_size = data["file_size"];
      var file = document.createElement("div");
      file.innerHTML= '<strong>File Type:</strong> ' + file_type + '<br> <strong>File Name: </strong> ' +'<a>' + filename + '</a>';
      file.dataset.fileName = filename;
      file.classList.add("file");
      fileBox.appendChild(file);
      DownloadFile();
    })

    document.querySelector("#file-getter").onclick = () => {
      socket.emit("get files");
    }

    socket.on("send uploaded files", data => {
      uploaded_files = data["uploaded_files"]
      let fileBox = document.querySelector("#file-box");
      while (fileBox.firstChild){file_size
        fileBox.firstChild.remove();
      }

      for (var i = 0; i < uploaded_files.length; i++){
        filename = uploaded_files[i]["filename"];
        file_type = uploaded_files[i]["file_type"];

        var file = document.createElement("div");
        file.innerHTML= '<hr><strong>File Type:</strong> ' + file_type + '<br> <strong>File Name: </strong> ' +'<a>' + filename + '</a>';
        file.dataset.fileName = filename;
        file.classList.add("file");
        fileBox.appendChild(file);
      }
      DownloadFile();
    });

    socket.on("file not uploaded", () =>{
      alert("File type not supported!!");
    })

  });

    function ViewSelectedChannel(selected_channel){
      document.querySelectorAll(".channel").forEach(channel => {
        if (channel.dataset.channelName == selected_channel){
          channel.classList.add("selected-channel");
          document.querySelector("#channel_name_header").innerHTML = selected_channel;
        }
      });
    }

    function SelectChannel(){
      document.querySelectorAll(".channel").forEach(channel => {
        channel.onclick = () => {
          let allChannels = Array.from(channel.parentNode.children);
          allChannels.forEach(childChannel => {
            childChannel.classList.remove("selected-channel");
          });
          const selected_channel = channel.dataset.channelName;
          channel.classList.add("selected-channel");
          document.querySelector("#channel_name_header").innerHTML = selected_channel;
          let displayname = localStorage.getItem("displayname");
          socket.emit('selected channel', {"selected_channel":selected_channel, "displayname":displayname});
        }
      });
    }

    function DownloadFile(){
      var file_list = document.querySelectorAll(".file");
      file_list.forEach(file => {
        let filename = file.dataset.fileName;
        file.addEventListener("click", () => {
          const request = new XMLHttpRequest();
          request.responseType = 'blob';
          request.open("GET", "/uploads/" + filename, true);
          request.onload = () => {
            let downloaded_file = request.response;

            let objectURL = window.URL.createObjectURL(downloaded_file);
            file_link = file.querySelector("a");
            file_link.href = objectURL;
            file_link.target = '_blank';
            file_link.download = filename;
          }

          const data = new FormData();
          data.append("filename", filename);
          request.send(data);
          return false;
        });
      });
    }

    function ViewMessages(data){
      if (data["selected_channel"] != null){
        let selected_channel = data["selected_channel"]

        messages = data["channels"][selected_channel];

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

          chatBox.scrollTop = chatBox.scrollHeight;

        };

      } else {
        SelectChannel();
      }
    }

    function ViewChannels(data){
      channels = data["channels"];
      for (key in channels) {
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

});
