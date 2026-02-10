// এলিমেন্ট সিলেকশন
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const container = document.getElementById("container");
const loader = document.getElementById("loader-wrapper");

// --- API সেটিংস ---
const OPENAI_KEY = "আপনার_এপিআই_কি_এখানে_দিন"; // আপনার OpenAI Key এখানে বসান
const STORAGE_KEY = "shikha_guru_history";

let currentChatHistory = [];
let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

// 🚀 ১. লোডার ও ইনিশিয়াল সেটআপ
window.onload = () => {
    renderHistory();
    setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.transition = "0.6s ease";
        setTimeout(() => {
            loader.style.display = "none";
            container.style.display = "flex";
            if (chatBox.innerHTML === "") {
                addMessage("স্বাগতম! আমি শিক্ষা-গুরু। আপনাকে কীভাবে সাহায্য করতে পারি?", "bot");
            }
        }, 600);
    }, 2500); // ২.৫ সেকেন্ড লোডিং
};

// 💬 ২. মেসেজ ফাংশন
function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `msg ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // হিস্টরিতে সেভ করা
    currentChatHistory.push({ role: sender === "user" ? "user" : "assistant", content: text });
}

// 🔥 ৩. OpenAI এপিআই কানেকশন
async function getAIResponse(userText) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "You are Shikha-Guru, a helpful AI tutor. Always reply in Bangla." }, ...currentChatHistory]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("API Error:", error);
        return "দুঃখিত, এপিআই কানেকশনে সমস্যা হচ্ছে। দয়া করে আপনার কী (Key) চেক করুন।";
    }
}

// 📩 ৪. মেসেজ সেন্ড লজিক
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    userInput.value = "";

    const typingMsg = document.createElement("div");
    typingMsg.className = "msg bot";
    typingMsg.innerText = "লিখছি...";
    chatBox.appendChild(typingMsg);

    const reply = await getAIResponse(text);
    chatBox.removeChild(typingMsg);
    addMessage(reply, "bot");
    saveSession();
}

// 📂 ৫. চ্যাট হিস্টরি ম্যানেজমেন্ট
function saveSession() {
    const id = new Date().toLocaleString();
    sessions[id] = currentChatHistory;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("session-history");
    list.innerHTML = "";
    Object.keys(sessions).reverse().forEach(id => {
        const li = document.createElement("li");
        li.innerText = `Chat: ${id}`;
        li.onclick = () => loadSession(id);
        list.appendChild(li);
    });
}

function loadSession(id) {
    chatBox.innerHTML = "";
    currentChatHistory = sessions[id];
    currentChatHistory.forEach(msg => {
        if (msg.role !== "system") addMessage(msg.content, msg.role === "user" ? "user" : "bot");
    });
    toggleSidebar(false);
}

function startNewSession() {
    chatBox.innerHTML = "";
    currentChatHistory = [];
    addMessage("নতুন চ্যাট শুরু হয়েছে। আপনাকে কীভাবে সাহায্য করতে পারি?", "bot");
    toggleSidebar(false);
}

function clearHistory() {
    if(confirm("সব হিস্টরি মুছে ফেলবেন?")) {
        localStorage.removeItem(STORAGE_KEY);
        sessions = {};
        renderHistory();
        startNewSession();
    }
}

// ☰ ৬. সাইডবার কন্ট্রোল
function toggleSidebar(open) {
    sidebar.classList.toggle("active", open);
    overlay.style.display = open ? "block" : "none";
}

// এন্টার প্রেস করলে মেসেজ পাঠানো
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});