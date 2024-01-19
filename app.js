import { Client } from "@stomp/stompjs";

let stompClient = null;
let meetId = null;
let memberId = null;
let email = null;

let isChatSubscribed = false;

function setConnected(connected) {
  $("#connect").prop("disabled", connected);
  $("#disconnect").prop("disabled", !connected);
  if (connected) {
    $("#conversation").show();
  } else {
    $("#conversation").hide();
  }
  $("#greetings").html("");
}

const connectStompSocket = () => {
  console.log("STOMP Socket Connected.");
  const authToken = document.getElementById("authToken").value;
  return new Promise((resolve, reject) => {
    try {
      stompClient = new Client({
        brokerURL: "ws://localhost:3001/ws",
        connectHeaders: {
          Authorization: authToken,
        },
        onConnect: () => {
          console.log("Stomp Socket connected");
          resolve();
        },
        onDisconnect: () => {
          console.log("Stomp Socket disconnected");
          stompClient = null;
        },
      });
      stompClient.activate();
    } catch (error) {
      reject(error);
    }
  });
};

document.getElementById("connect").addEventListener("click", () => {
  connectStompSocket().then(() => {
    document.getElementById("connectSocketForm").hidden = true;
    document.getElementById("chatEnterForm").hidden = false;
  });
});

const enterChat = () => {
  meetId = document.getElementById("meetId").value;

  return new Promise((resolve, reject) => {
    try {
      stompClient.subscribe(`/subscribe/chat/meet/${meetId}`, (data) => {
        const { headers, body } = data;
        console.log("received chat data", {
          headers,
          body: JSON.parse(body),
        });

        if (!isChatSubscribed) {
          isChatSubscribed = true;
          resolve();
        }
      });

      stompClient.subscribe("/user/queue/error", (data) => {
        const { headers, body } = data;
        console.log("received error data", {
          headers,
          body: JSON.parse(body),
        });
      });
      stompClient.publish({
        destination: `/publish/meet/${meetId}/chat/enter`,
      });
    } catch (error) {
      reject(error);
    }
  });
};

document.getElementById("enterChat").addEventListener("click", () => {
  enterChat().then(() => {
    document.getElementById("chatEnterForm").hidden = true;
    document.getElementById("chatTalkForm").hidden = false;
  });
});

const talkChat = () => {
  const message = document.getElementById("chatMessage").value;

  stompClient.publish({
    destination: `/publish/meet/${meetId}/chat/talk`,
    body: JSON.stringify({
      message,
    }),
  });
};

document.getElementById("talkChat").addEventListener("click", () => {
  talkChat();
});

function disconnect() {
  if (stompClient !== null) {
    stompClient.disconnect();
  }
  setConnected(false);
  console.log("Disconnected");
}

function showGreeting(message) {
  $("#greetings").append("<tr><td>" + message + "</td></tr>");
}
