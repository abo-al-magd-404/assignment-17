const client = io("http://localhost:3000/", {
  auth: {
    authorization: localStorage.getItem("token"),
  },
});

client.emit("SayHi", { name: "A" });

client.on("connect", () => {
  console.log("Connection stablish successfully ⚡");
});

client.on("SayHi", (data) => {
  console.log({ data });
});

client.on("custom_error", (error) => {
  console.log(error);
});

client.on("connect_error", (error) => {
  console.log(error);
});

client.on("offline_user", (data) => {
  console.log({ offline: data });
});
