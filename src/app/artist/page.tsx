"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/PlayerContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

type Tab = "overview" | "saved" | "purchased" | "lyrics" | "settings";

interface SavedBeat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  priceBasic: number;
  pricePremium: number;
  priceExclusive: number;
  artwork?: string | null;
  audioFile?: string | null;
  producer: { id: string; name: string };
}

interface PurchasedBeat {
  id: string;
  type: string;
  price: number;
  createdAt: string;
  beat: { id: string; title: string; artwork?: string | null; producer: { name: string } };
  downloadUrl?: string | null;
}

interface LyricsNote {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  beat?: { id: string; title: string; artwork?: string | null } | null;
}

const sidebarLinks = [
  { label: "Overview",   tab: "overview",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Saved Beats",tab: "saved",      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Purchased",  tab: "purchased",  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Lyrics Lab", tab: "lyrics",     icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { label: "Settings",   tab: "settings",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

// ─── Lyrics Lab ──────────────────────────────────────────────────────────────
function LyricsLab({ userId }: { userId?: string }) {
  const [notes, setNotes] = useState<LyricsNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<LyricsNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedBeats, setSavedBeats] = useState<SavedBeat[]>([]);
  const [linkingBeat, setLinkingBeat] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Beat search state
  const [allBeats, setAllBeats] = useState<any[]>([]);
  const [beatSearch, setBeatSearch] = useState("");
  const [savingBeatId, setSavingBeatId] = useState<string | null>(null);

  const savedBeatIds = new Set(savedBeats.map(b => b.id));

  const filteredBeats = beatSearch.trim()
    ? allBeats.filter(b =>
        b.title.toLowerCase().includes(beatSearch.toLowerCase()) ||
        (b.producer ?? b.producerName ?? "").toLowerCase().includes(beatSearch.toLowerCase())
      )
    : savedBeats;

  useEffect(() => {
    fetch("/api/lyrics").then(r => r.json()).then(d => { setNotes(Array.isArray(d) ? d : []); }).catch(() => {}).finally(() => setLoading(false));
    fetch("/api/beats/save").then(r => r.json()).then(d => { setSavedBeats(Array.isArray(d) ? d : []); }).catch(() => {});
    fetch("/api/beats").then(r => r.json()).then(d => { setAllBeats(Array.isArray(d) ? d : []); }).catch(() => {});
  }, [userId]);

  async function saveBeat(beatId: string) {
    setSavingBeatId(beatId);
    await fetch("/api/beats/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ beatId }) });
    const res = await fetch("/api/beats/save");
    const data = await res.json();
    setSavedBeats(Array.isArray(data) ? data : []);
    setSavingBeatId(null);
  }

  async function createNote() {
    const res = await fetch("/api/lyrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Untitled", content: "" }) });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
    openNote(note);
  }

  function openNote(note: LyricsNote) {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setLinkingBeat(false);
  }

  function scheduleAutoSave(noteId: string, title: string, content: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(noteId, title, content), 1200);
  }

  async function saveNote(noteId: string, title: string, content: string, beatId?: string | null) {
    setSaving(true);
    const body: Record<string, unknown> = { title, content };
    if (beatId !== undefined) body.beatId = beatId;
    const res = await fetch(`/api/lyrics/${noteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
    setActiveNote(updated);
    setSaving(false);
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/lyrics/${noteId}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) setActiveNote(null);
  }

  return (
    <div className="flex gap-6 flex-1 min-h-0">
      {/* Sidebar list */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <button onClick={createNote} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Note
        </button>

        {/* Saved beats count chip */}
        <div className="flex items-center justify-between px-1">
          <span className="text-gray-500 text-xs uppercase tracking-wider">Saved Beats</span>
          <span className="bg-teal-600/20 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-600/30">{savedBeats.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)
          ) : notes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No notes yet. Create your first one!</p>
          ) : (
            notes.map(note => (
              <button key={note.id} onClick={() => openNote(note)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${activeNote?.id === note.id ? "bg-teal-600/10 border-teal-600/40" : "bg-gray-900 border-gray-800 hover:border-gray-700"}`}>
                <div className="flex items-start gap-2">
                  {note.beat?.artwork && <img src={note.beat.artwork} alt="" className="w-8 h-8 rounded object-cover shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{note.title}</p>
                    {note.beat && <p className="text-teal-400 text-xs truncate">{note.beat.title}</p>}
                    <p className="text-gray-600 text-xs mt-0.5">{new Date(note.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {!activeNote ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              <p className="text-gray-500">Select a note or create a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <input
                value={editTitle}
                onChange={(e) => { setEditTitle(e.target.value); scheduleAutoSave(activeNote.id, e.target.value, editContent); }}
                className="flex-1 bg-transparent text-white font-bold text-lg focus:outline-none placeholder-gray-600"
                placeholder="Note title…"
              />
              {/* Linked beat */}
              {activeNote.beat ? (
                <div className="flex items-center gap-2 bg-teal-600/10 border border-teal-600/30 rounded-lg px-3 py-1.5">
                  {activeNote.beat.artwork && <img src={activeNote.beat.artwork} alt="" className="w-5 h-5 rounded object-cover" />}
                  <span className="text-teal-400 text-xs font-medium truncate max-w-[120px]">{activeNote.beat.title}</span>
                  <button onClick={() => saveNote(activeNote.id, editTitle, editContent, null)} className="text-gray-500 hover:text-red-400 ml-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => setLinkingBeat(!linkingBeat)} className="text-xs text-gray-500 hover:text-teal-400 border border-gray-700 hover:border-teal-600 px-3 py-1.5 rounded-lg transition-colors">
                  + Link Beat
                </button>
              )}
              <div className="flex items-center gap-2">
                {saving && <span className="text-gray-600 text-xs">Saving…</span>}
                <button onClick={() => deleteNote(activeNote.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {/* Beat picker */}
            {linkingBeat && (
              <div className="p-3 border-b border-gray-800 bg-gray-800/50 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={beatSearch}
                    onChange={e => setBeatSearch(e.target.value)}
                    placeholder="Search all beats to save & link…"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500 placeholder-gray-500"
                  />
                  {beatSearch && (
                    <button onClick={() => setBeatSearch("")} className="text-gray-500 hover:text-white text-xs px-2">✕</button>
                  )}
                </div>
                <p className="text-gray-500 text-[10px]">
                  {beatSearch ? `Showing marketplace results — click Save & Link to add` : "Your saved beats — search above to find more"}
                </p>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {filteredBeats.length === 0 ? (
                    <p className="text-gray-600 text-xs py-2 text-center">
                      {beatSearch ? "No beats found" : "No saved beats yet — search above to find and save beats"}
                    </p>
                  ) : (
                    filteredBeats.map((b: any) => {
                      const isSaved = savedBeatIds.has(b.id);
                      return (
                        <div key={b.id} className="flex items-center gap-2 bg-gray-700/60 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                          {b.artwork
                            ? <img src={b.artwork} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                            : <div className="w-7 h-7 rounded bg-gradient-to-br from-teal-600 to-blue-600 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{b.title}</p>
                            <p className="text-gray-500 text-[10px]">{typeof b.producer === "object" ? b.producer?.name : (b.producer ?? b.producerName ?? "")}</p>
                          </div>
                          <button
                            disabled={savingBeatId === b.id}
                            onClick={async () => {
                              if (!isSaved) await saveBeat(b.id);
                              await saveNote(activeNote!.id, editTitle, editContent, b.id);
                              setLinkingBeat(false);
                              setBeatSearch("");
                            }}
                            className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                              savingBeatId === b.id
                                ? "opacity-50 cursor-wait bg-gray-600 text-gray-400"
                                : isSaved
                                ? "bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/40"
                                : "bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/40"
                            }`}
                          >
                            {savingBeatId === b.id ? "Saving…" : isSaved ? "Link" : "Save & Link"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Text editor */}
            <textarea
              value={editContent}
              onChange={(e) => { setEditContent(e.target.value); scheduleAutoSave(activeNote.id, editTitle, e.target.value); }}
              placeholder="Start writing lyrics, notes, ideas…"
              className="flex-1 bg-transparent text-gray-200 text-sm leading-relaxed p-5 focus:outline-none resize-none font-mono"
            />

            {/* Word count */}
            <div className="px-5 py-2 border-t border-gray-800 flex justify-end">
              <span className="text-gray-600 text-xs">{editContent.trim().split(/\s+/).filter(Boolean).length} words · {editContent.length} chars</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ArtistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { setCurrentBeat } = usePlayer();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [savedBeats, setSavedBeats] = useState<SavedBeat[]>([]);
  const [purchased, setPurchased] = useState<PurchasedBeat[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingPurchased, setLoadingPurchased] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (!authLoading && user?.role === "producer") { router.push("/producer"); return; }
    if (!authLoading && user?.role === "admin") { router.push("/admin"); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (activeTab === "saved" || activeTab === "overview") {
      setLoadingSaved(true);
      fetch("/api/beats/save").then(r => r.json()).then(d => setSavedBeats(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingSaved(false));
    }
    if (activeTab === "purchased") {
      setLoadingPurchased(true);
      fetch("/api/royalties").then(r => r.json()).then(d => setPurchased(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingPurchased(false));
    }
  }, [activeTab]);

  async function toggleSave(beatId: string) {
    await fetch("/api/beats/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ beatId }) });
    setSavedBeats(prev => prev.filter(b => b.id !== beatId));
  }

  const navItems = sidebarLinks.map(l => ({ id: l.label, label: l.label, icon: l.icon, tab: l.tab }));

  if (authLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row">
      <DashboardSidebar
        items={navItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Artist"
        roleBadge="Artist"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardHeader
          title={activeTab === "overview" ? "Artist Dashboard" : activeTab === "saved" ? "Saved Beats" : activeTab === "purchased" ? "My Purchases" : activeTab === "lyrics" ? "Lyrics Lab" : "Settings"}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

      <main className={`flex-1 overflow-y-auto p-6 lg:p-8 ${activeTab === "lyrics" ? "flex flex-col" : ""}`}>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Saved Beats</p>
                <p className="text-3xl font-black text-white">{loadingSaved ? "—" : savedBeats.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Licenses Owned</p>
                <p className="text-3xl font-black text-white">{purchased.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 col-span-2 sm:col-span-1">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quick Actions</p>
                <div className="flex gap-2 flex-wrap mt-1">
                  <button onClick={() => setActiveTab("lyrics")} className="bg-teal-600/20 border border-teal-600/40 text-teal-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-600/30 transition-colors">Open Lyrics Lab</button>
                  <button onClick={() => router.push("/marketplace")} className="bg-blue-600/20 border border-blue-600/40 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600/30 transition-colors">Browse Beats</button>
                </div>
              </div>
            </div>

            {/* Recent saved beats */}
            {savedBeats.length > 0 && (
              <div>
                <h2 className="text-white font-bold text-lg mb-4">Recently Saved</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedBeats.slice(0, 6).map(beat => (
                    <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-teal-600 to-blue-600">
                        {beat.artwork && <img src={beat.artwork} alt={beat.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{beat.title}</p>
                        <p className="text-gray-500 text-xs">{beat.producer.name}</p>
                      </div>
                      <button onClick={() => setCurrentBeat({ id: beat.id, title: beat.title, producer: beat.producer.name, audioFile: beat.audioFile ?? undefined, artwork: beat.artwork ?? undefined, genre: beat.genre, bpm: beat.bpm, key: beat.key, priceBasic: beat.priceBasic, pricePremium: beat.pricePremium, priceExclusive: beat.priceExclusive } as any)}
                        className="w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Beats */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {loadingSaved ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />)
            ) : savedBeats.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">You haven&apos;t saved any beats yet.</p>
                <button onClick={() => router.push("/marketplace")} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">Browse Beats</button>
              </div>
            ) : (
              savedBeats.map(beat => (
                <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-teal-600 to-blue-600">
                    {beat.artwork && <img src={beat.artwork} alt={beat.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{beat.title}</p>
                    <p className="text-gray-500 text-sm">{beat.producer.name} · {beat.genre} · {beat.bpm} BPM</p>
                    <p className="text-blue-400 text-sm font-semibold">${beat.pricePremium}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setCurrentBeat({ id: beat.id, title: beat.title, producer: beat.producer.name, audioFile: beat.audioFile ?? undefined, artwork: beat.artwork ?? undefined, genre: beat.genre, bpm: beat.bpm, key: beat.key, priceBasic: beat.priceBasic, pricePremium: beat.pricePremium, priceExclusive: beat.priceExclusive } as any)}
                      className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                    <button onClick={() => router.push(`/beat/${beat.id}`)} className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">Buy</button>
                    <button onClick={() => toggleSave(beat.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-800/30 px-3 py-1.5 rounded-lg transition-colors">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Purchased */}
        {activeTab === "purchased" && (
          <div className="space-y-4">
            {loadingPurchased ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />)
            ) : purchased.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-4">No purchases yet.</p>
                <button onClick={() => router.push("/marketplace")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">Browse Beats</button>
              </div>
            ) : (
              purchased.map((lic: any) => (
                <div key={lic.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-blue-600 to-purple-600">
                    {lic.beat?.artwork && <img src={lic.beat.artwork} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{lic.beat?.title ?? "Unknown"}</p>
                    <p className="text-gray-500 text-sm">{lic.beat?.producer?.name} · {lic.type} license</p>
                    <p className="text-gray-600 text-xs">{new Date(lic.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg capitalize">{lic.type}</span>
                    {lic.downloadUrl && (
                      <a href={lic.downloadUrl} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800/30 px-3 py-1.5 rounded-lg transition-colors" download>Download</a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lyrics Lab */}
        {activeTab === "lyrics" && <LyricsLab userId={user?.id} />}

        {/* Settings */}
        {activeTab === "settings" && (
          <ArtistSettings userName={user?.name} userEmail={user?.email} />
        )}
      </main>
      </div>
    </div>
  );
}

function ArtistSettings({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const [name, setName] = useState(userName ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => { setName(d.name ?? ""); setBio(d.bio ?? ""); }).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bio }) });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Failed"); return; }
      setMsg("Saved!");
    } catch { setMsg("Error saving."); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-bold text-white">Artist Settings</h2>
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        {msg && <p className={`text-sm ${msg === "Saved!" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Artist Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500" />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Email</label>
          <input value={userEmail ?? ""} disabled className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500 resize-none" />
        </div>
        <button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
