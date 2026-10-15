const BUY_URL = "https://YOURSTORE.lemonsqueezy.com/buy/YOUR-PRODUCT"; // set yours
const FREE_FOLDERS = 3;
const $ = id => document.getElementById(id);
const get = () => chrome.storage.local.get({ folders: { Inbox: [] }, pro: false });
const set = d => chrome.storage.local.set(d);

async function render() {
  const { folders, pro } = await get();
  const q = $("search").value.toLowerCase();
  $("folder").innerHTML = Object.keys(folders).map(f => `<option>${f}</option>`).join("");
  $("list").innerHTML = Object.entries(folders).map(([f, chats]) => {
    const hits = chats.filter(c => c.title.toLowerCase().includes(q));
    return `<div class="f">${f} (${hits.length})</div><div class="c">${
      hits.map(c => `<a href="${c.url}" target="_blank">${c.title}</a>`).join("")}</div>`;
  }).join("");
  $("status").textContent = pro ? "Pro active: unlimited folders" :
    `Free: ${Object.keys(folders).length}/${FREE_FOLDERS} folders`;
  $("buy").href = BUY_URL; $("buy").style.display = pro ? "none" : "block";
}

$("save").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const d = await get(); const f = $("folder").value;
  if (!d.folders[f].some(c => c.url === tab.url))
    d.folders[f].push({ title: tab.title || tab.url, url: tab.url, at: Date.now() });
  await set({ folders: d.folders }); render();
};

$("add").onclick = async () => {
  const name = $("newFolder").value.trim(); if (!name) return;
  const d = await get();
  if (!d.pro && Object.keys(d.folders).length >= FREE_FOLDERS)
    return alert("Free plan allows 3 folders. Upgrade to Pro for unlimited.");
  d.folders[name] ??= []; await set({ folders: d.folders });
  $("newFolder").value = ""; render();
};

$("activate").onclick = async () => {
  const key = $("key").value.trim(); if (!key) return;
  const r = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
    method: "POST", headers: { Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ license_key: key, instance_name: "chatstash" })
  }).then(r => r.json()).catch(() => ({}));
  if (r.activated || r.valid) { await set({ pro: true, key }); alert("Pro activated!"); }
  else alert("Invalid key: " + (r.error || "try again"));
  render();
};

$("search").oninput = render;
render();