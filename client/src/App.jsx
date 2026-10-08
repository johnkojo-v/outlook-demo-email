import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    localStorage.setItem("token", token);

    axios
      .get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        setToken("");
        setUser(null);
        localStorage.removeItem("token");
      });
  }, [token]);

  function handleLoginRegister(e) {
    e.preventDefault();

    const endpoint = showAdminLogin ? "/admin/login" : authMode === "register" ? "/register" : "/login";

    axios
      .post(`${API}${endpoint}`, showAdminLogin ? { email: form.email, password: form.password } : form)
      .then((res) => {
        if (showAdminLogin) {
          setToken(res.data.token);
          setUser(res.data.admin);
          setMessage("Admin login successful");
          return;
        }

        setToken(res.data.token);
        setUser(res.data.user);
        setForm({ name: "", email: "", password: "" });
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "Something went wrong");
      });
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-box">
          <div className="auth-header">
            <div className="microsoft-badge">O</div>
            <h2>{showAdminLogin ? "Admin Login" : authMode === "login" ? "Sign in" : "Create account"}</h2>
          </div>

          {!showAdminLogin && (
            <div className="auth-toggle">
              <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              <button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Register</button>
            </div>
          )}

          <form onSubmit={handleLoginRegister}>
            {!showAdminLogin && authMode === "register" && (
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button type="submit" className="primary-btn">
              {showAdminLogin ? "Admin sign in" : authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {message && <div className="status-box">{message}</div>}

          <button className="secondary-link" onClick={() => setShowAdminLogin((prev) => !prev)}>
            {showAdminLogin ? "Back to user login" : "Admin login"}
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} token={token} logout={logout} />;
}

function Dashboard({ user, token, logout }) {
  const [mailbox, setMailbox] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [search, setSearch] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadInbox();
  }, []);

  function loadInbox() {
    axios
      .get("http://localhost:5000/api/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMailbox(res.data.emails || []))
      .catch(() => {});
  }

  function sendMail(e) {
    e.preventDefault();
    axios
      .post("http://localhost:5000/api/send", draft, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setDraft({ to: "", subject: "", body: "" });
        setIsComposeOpen(false);
        setToast("Mail sent");
        setTimeout(() => setToast(""), 2200);
        loadInbox();
      })
      .catch((err) => {
        setToast(err.response?.data?.message || "Failed to send email");
      });
  }

  function openMail(emailId) {
    axios
      .get(`http://localhost:5000/api/email/${emailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSelectedEmail(res.data.email);
        loadInbox();
      })
      .catch(() => {});
  }

  const filtered = mailbox.filter((msg) => {
    const text = `${msg.sender_name} ${msg.subject} ${msg.body}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="mail-shell">
      <aside className="mail-sidebar">
        <div className="brand-row">
          <div className="microsoft-badge small">O</div>
          <span>Outlook</span>
        </div>

        <button className="new-mail-btn" onClick={() => setIsComposeOpen(true)}>+ New mail</button>

        <nav className="folder-list">
          <div className="folder active"><span>Inbox</span><strong>{mailbox.length}</strong></div>
          <div className="folder"><span>Sent</span></div>
          <div className="folder"><span>Drafts</span></div>
          <div className="folder"><span>Archive</span></div>
          <div className="folder"><span>Deleted</span></div>
        </nav>

        <div className="profile-card">
          <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="mail-content">
        <header className="toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input type="text" placeholder="Search mail and people" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="toolbar-actions">
            <button className="toolbar-btn">Filter</button>
            <button className="toolbar-btn primary">Refresh</button>
          </div>
        </header>

        <div className="mail-area">
          <section className="message-list">
            <div className="pane-header">
              <h3>Inbox</h3>
              <span>{filtered.length} items</span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">No messages match your search</div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${selectedEmail?.id === msg.id ? "selected" : ""}`}
                  onClick={() => openMail(msg.id)}
                >
                  <div className="row-avatar">{msg.sender_name.charAt(0).toUpperCase()}</div>
                  <div className="row-main">
                    <div className="row-meta">
                      <strong>{msg.sender_name}</strong>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="subject">{msg.subject}</div>
                    <div className="preview">{msg.body}</div>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="preview-pane">
            {selectedEmail ? (
              <>
                <div className="preview-header">
                  <div>
                    <h2>{selectedEmail.subject}</h2>
                    <p>From: {selectedEmail.sender_name} ({selectedEmail.sender_email})</p>
                    <p>To: {selectedEmail.receiver_name} ({selectedEmail.receiver_email})</p>
                  </div>

                  <div className="preview-actions">
                    <button>Reply</button>
                    <button>Forward</button>
                  </div>
                </div>

                <div className="preview-body">{selectedEmail.body}</div>
              </>
            ) : (
              <div className="empty-preview">Select an email to read</div>
            )}
          </section>
        </div>
      </main>

      {isComposeOpen && (
        <div className="compose-overlay" onClick={() => setIsComposeOpen(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <h4>New message</h4>
              <button onClick={() => setIsComposeOpen(false)}>✕</button>
            </div>

            <form onSubmit={sendMail} className="compose-form">
              <input type="text" placeholder="To" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              <input type="text" placeholder="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              <textarea placeholder="Write your message..." value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />

              <div className="compose-actions">
                <button type="submit" className="primary-btn">Send</button>
                <button type="button" className="secondary-btn" onClick={() => setIsComposeOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}


