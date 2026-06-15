const baseURL = "http://localhost:3000";

// ── Avatar fallback ──────────────────────────────────────
const avatar = "./avatar/Avatar-No-Background.png";
let meImage = avatar;
let friendImage = avatar;

// ── Auth ─────────────────────────────────────────────────
const classicToken = localStorage.getItem("token");

const token = classicToken ? `Bearer ${classicToken}` : "";
const headers = {
  "Content-Type": "application/json; charset=UTF-8",
  authorization: token,
};

// ── State ────────────────────────────────────────────────
let globalProfile = {};
let currentChat = { id: null, type: null };

// ── Socket ───────────────────────────────────────────────
const clintIo = io(baseURL, { auth: { authorization: classicToken } });

clintIo.on("connect_error", (err) =>
  console.log("connect_error:", err.message),
);
clintIo.on("custom_error", (err) => console.log("custom_error:", err.message));

clintIo.emit("sayHi", { name: "FROM FE TO BE" }, (response) =>
  console.log({ response }),
);

clintIo.on("offline_user", (data) => console.log({ data }));
clintIo.on("reactPost", (data) => console.log({ reactPost: data }));

// ── Send button ──────────────────────────────────────────
document.getElementById("sendMessage").addEventListener("click", () => {
  if (!currentChat.id) return;
  sendMessage(currentChat.id, currentChat.type);
});

document.getElementById("messageBody").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!currentChat.id) return;
    sendMessage(currentChat.id, currentChat.type);
  }
});

// ── Send message ─────────────────────────────────────────
function sendMessage(sendTo, type) {
  const content = document.getElementById("messageBody").value.trim();
  if (!content) return;

  if (type === "ovo") {
    clintIo.emit("sendMessage", { content, sendTo });
  } else if (type === "group") {
    clintIo.emit("sendGroupMessage", { content, groupId: sendTo });
  }
}

// ── Message sent confirmation ────────────────────────────
clintIo.on("successMessage", (data) => {
  const { content, sendTo } = data;

  if (sendTo === currentChat.id) {
    appendMessage({
      content,
      isMine: true,
      imagePath: globalProfile.profilePicture
        ? `${baseURL}/uploads/${globalProfile.profilePicture}`
        : avatar,
    });
    document.getElementById("messageBody").value = "";
  }
});

// ── Receive message ──────────────────────────────────────
clintIo.on("newMessage", (data) => {
  const { content, from, groupId } = data;

  const imagePath = from?.profilePicture
    ? `${baseURL}/uploads/${from.profilePicture}`
    : avatar;

  const isCurrentChat =
    (!groupId && currentChat.id === from._id) ||
    (groupId && currentChat.id === groupId);

  if (isCurrentChat) {
    if (from?._id?.toString() !== globalProfile._id?.toString()) {
      appendMessage({ content, isMine: false, imagePath });
    }
  } else {
    const badgeId = groupId ? `g_${groupId}` : `c_${from._id}`;
    const badge = document.getElementById(badgeId);
    if (badge) badge.style.display = "inline";

    const audio = document.getElementById("notifyTone");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
});

// ── Append a message bubble ──────────────────────────────
function appendMessage({ content, isMine, imagePath }) {
  const list = document.getElementById("messageList");

  const placeholder = list.querySelector(".msg-placeholder");
  if (placeholder) placeholder.remove();

  const wrap = document.createElement("div");
  wrap.className = `message${isMine ? " mine" : ""}`;

  wrap.innerHTML = `
        <img class="chatImage avatar avatar--sm" src="${imagePath}" alt="">
        <div class="message-bubble">${escapeHtml(content)}</div>
    `;

  list.appendChild(wrap);
  scrollToBottom(list);
}

function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}

// Prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Show 1-on-1 conversation ─────────────────────────────
function showData(sendTo, chat) {
  currentChat = { id: sendTo, type: "ovo" };

  const list = document.getElementById("messageList");
  list.innerHTML = "";

  if (chat?.messages?.length) {
    for (const message of chat.messages) {
      const isMine =
        message.createdBy.toString() === globalProfile._id.toString();
      appendMessage({
        content: message.content,
        isMine,
        imagePath: isMine ? meImage : friendImage,
      });
    }
  } else {
    showPlaceholder("Say Hi to start the conversation 👋");
  }

  hideBadge(`c_${sendTo}`);

  const friend = chat?.participants?.find(
    (p) => p._id.toString() !== globalProfile._id.toString(),
  );
  const friendName = friend
    ? friend.username ||
      `${friend.firstName || ""} ${friend.lastName || ""}`.trim()
    : document.getElementById("chatTargetName")?.textContent || "";
  setHeader(friendName, friendImage);
}

// ── Fetch 1-on-1 chat ────────────────────────────────────
function displayChatUser(userId, friendData) {
  if (friendData) {
    const friendName =
      friendData.username ||
      `${friendData.firstName || ""} ${friendData.lastName || ""}`.trim() ||
      "User";
    const friendImg = friendData.profilePicture || avatar;
    setHeader(friendName, friendImg);
    friendImage = friendImg;
  }

  meImage = globalProfile.profilePicture || avatar;

  axios({
    method: "get",
    url: `${baseURL}/user/${userId}/chat?page=1&size=10`,
    headers,
  })
    .then((response) => {
      const { chat } = response.data?.data ?? {};
      if (chat) {
        const [p0, p1] = chat.participants;
        if (p0._id.toString() === globalProfile._id.toString()) {
          meImage = p0.profilePicture
            ? `${baseURL}/uploads/${p0.profilePicture}`
            : avatar;
          friendImage = p1.profilePicture
            ? `${baseURL}/uploads/${p1.profilePicture}`
            : avatar;
        } else {
          meImage = p1.profilePicture
            ? `${baseURL}/uploads/${p1.profilePicture}`
            : avatar;
          friendImage = p0.profilePicture
            ? `${baseURL}/uploads/${p0.profilePicture}`
            : avatar;
        }
        showData(userId, chat);
      } else {
        showData(userId, null);
      }
    })
    .catch((error) => {
      showData(userId, null);
      console.log("displayChatUser:", error.response?.status, error.message);
    });
}

// ── Show group conversation ──────────────────────────────
function showGroupData(sendTo, chat) {
  currentChat = { id: sendTo, type: "group" };

  const list = document.getElementById("messageList");
  list.innerHTML = "";

  if (chat?.messages?.length) {
    for (const message of chat.messages) {
      const isMine =
        message.createdBy?._id?.toString() === globalProfile._id?.toString();
      const img = isMine
        ? meImage
        : message.createdBy?.profilePicture
          ? `${baseURL}/uploads/${message.createdBy.profilePicture}`
          : avatar;
      appendMessage({ content: message.content, isMine, imagePath: img });
    }
  } else {
    showPlaceholder("Say Hi to start the conversation 👋");
  }

  hideBadge(`g_${sendTo}`);
  setHeader(chat?.group || "Group Chat");
}

// ── Fetch group chat ─────────────────────────────────────
function displayGroupChat(groupId) {
  axios({ method: "get", url: `${baseURL}/chat/group/${groupId}`, headers })
    .then((response) => {
      const { chat } = response.data?.data;
      meImage = globalProfile.profilePicture
        ? `${baseURL}/uploads/${globalProfile.profilePicture}`
        : avatar;
      showGroupData(groupId, chat || null);
    })
    .catch((error) => {
      console.log(error);
      if (error.response) {
        showGroupData(groupId, null);
      } else {
        alert("Oops, something went wrong");
      }
    });
}

// ── Load profile + friends + groups ─────────────────────
function getUserData() {
  if (!classicToken) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = "Loading…";

  axios({ method: "get", url: `${baseURL}/user`, headers })
    .then((response) => {
      const payload = response.data?.data ?? response.data;
      const user = payload?._id ? payload : payload?.user;
      const groups = response.data?.groups ?? payload?.groups ?? [];

      if (!user) {
        console.error("getUserData: no user in response", response.data);
        document.getElementById("userName").textContent = "Unknown";
        return;
      }

      globalProfile = user;

      const imagePath = user.profilePicture
        ? `${baseURL}/uploads/${user.profilePicture}`
        : avatar;

      // Use firstName + lastName if no username field
      const displayName =
        user.username ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "User";

      document.getElementById("profileImage").src = imagePath;
      document.getElementById("userName").textContent = displayName;

      showUsersData(user.friends || []);
      showGroupList(groups);
    })
    .catch((error) => {
      console.error("getUserData error:", error);

      // 401 / 403 → token expired, force re-login
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        window.location.href = "index.html";
        return;
      }

      document.getElementById("userName").textContent = "Error loading";
    });
}

// ── Render friends list ──────────────────────────────────
function showUsersData(users = []) {
  const container = document.getElementById("chatUsers");
  container.innerHTML = "";

  for (const u of users) {
    const img = u.profilePicture
      ? `${baseURL}/uploads/${u.profilePicture}`
      : avatar;
    const item = document.createElement("div");
    item.className = "chatUser";
    const uName =
      u.username || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User";
    item.innerHTML = `
            <img class="chatImage" src="${img}" alt="">
            <div>
                <div class="name">${escapeHtml(uName)}</div>
            </div>
            <span id="c_${u._id}" class="notify-badge" style="display:none;">🟢</span>
        `;
    item.addEventListener("click", () => displayChatUser(u._id, u));
    container.appendChild(item);
  }
}

// ── Render groups list ───────────────────────────────────
function showGroupList(groups = []) {
  const container = document.getElementById("chatGroups");
  container.innerHTML = "";

  for (const g of groups) {
    const img = g.group_image ? `${baseURL}/uploads/${g.group_image}` : avatar;
    const item = document.createElement("div");
    item.className = "chatUser";
    const gName = g.group || g.name || g.groupName || "Group";
    item.innerHTML = `
            <img class="chatImage" src="${img}" alt="">
            <div>
                <div class="name">${escapeHtml(gName)}</div>
            </div>
            <span id="g_${g._id}" class="notify-badge" style="display:none;">🟢</span>
        `;
    item.addEventListener("click", () => displayGroupChat(g._id));
    container.appendChild(item);

    clintIo.emit("join_room", { roomId: g.roomId });
  }
}

// ── Helpers ──────────────────────────────────────────────
function showPlaceholder(text) {
  const list = document.getElementById("messageList");
  const div = document.createElement("div");
  div.className = "msg-placeholder";
  div.textContent = text;
  list.appendChild(div);
}

function hideBadge(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function setHeader(name, imgSrc) {
  const nameEl = document.getElementById("chatTargetName");
  const subEl = document.getElementById("chatTargetSub");
  if (nameEl) nameEl.textContent = name || "";
  if (subEl) subEl.textContent = name ? "Online" : "—";

  // Show friend avatar in header if element exists
  let headerImg = document.getElementById("chatHeaderImg");
  if (!headerImg) {
    headerImg = document.createElement("img");
    headerImg.id = "chatHeaderImg";
    headerImg.className = "avatar avatar--sm";
    headerImg.style.marginRight = "12px";
    const info = document.querySelector(".chat-header__info");
    if (info) info.parentElement.insertBefore(headerImg, info);
  }
  headerImg.src = imgSrc || avatar;
  headerImg.style.display = imgSrc ? "block" : "none";
}

// ── Unlock audio on first interaction ───────────────────
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  const audio = document.getElementById("notifyTone");
  audio.volume = 0;
  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audioUnlocked = true;
    })
    .catch(() => {});
}
document.addEventListener("click", unlockAudio, { once: false });
document.addEventListener("keydown", unlockAudio, { once: false });

// ── Boot ─────────────────────────────────────────────────
getUserData();
