"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/PlayerContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

type Tab = "overview" | "saved" | "purchased" | "lyrics" | "marketing" | "profile" | "merch" | "settings";

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
  { label: "Marketing",  tab: "marketing",  icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { label: "My Profile", tab: "profile",    icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "My Merch",   tab: "merch",      icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  { label: "Settings",   tab: "settings",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

// ─── Linked Beat Chip ────────────────────────────────────────────────────────
function LinkedBeatChip({ beat, fullBeat, isPlaying, onPlay, onUnlink }: {
  beat: { id: string; title: string; artwork?: string | null };
  fullBeat?: any;
  isPlaying: boolean;
  onPlay: (beat: any) => void;
  onUnlink: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-teal-600/10 border border-teal-600/30 rounded-lg px-2 py-1.5">
      {beat.artwork
        ? <img src={beat.artwork} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
        : <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-600 to-blue-600 shrink-0" />}
      <span className="text-teal-400 text-xs font-medium truncate max-w-[100px]">{beat.title}</span>
      {fullBeat?.audioFile && (
        <button
          onClick={() => onPlay(fullBeat)}
          title={isPlaying ? "Pause" : "Play beat"}
          className="w-5 h-5 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center transition-colors shrink-0"
        >
          {isPlaying ? (
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          ) : (
            <svg className="w-2.5 h-2.5 text-white ml-px" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      )}
      <button onClick={onUnlink} title="Unlink beat" className="text-gray-500 hover:text-red-400 ml-0.5 shrink-0">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

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

  const { currentBeat, isPlaying, setCurrentBeat } = usePlayer();

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
                <LinkedBeatChip
                  beat={activeNote.beat}
                  fullBeat={allBeats.find(b => b.id === activeNote.beat!.id)}
                  isPlaying={currentBeat?.id === activeNote.beat.id && isPlaying}
                  onPlay={setCurrentBeat}
                  onUnlink={() => saveNote(activeNote.id, editTitle, editContent, null)}
                />
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
          title={activeTab === "overview" ? "Artist Dashboard" : activeTab === "saved" ? "Saved Beats" : activeTab === "purchased" ? "My Purchases" : activeTab === "lyrics" ? "Lyrics Lab" : activeTab === "marketing" ? "Marketing Hub" : "Settings"}
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

        {/* Marketing */}
        {activeTab === "marketing" && <ArtistMarketingTab userName={user?.name} />}

        {/* Profile */}
        {activeTab === "profile" && (
          <ArtistProfile userName={user?.name} userEmail={user?.email} />
        )}

        {/* Merch */}
        {activeTab === "merch" && <ArtistMerch />}

        {/* Settings */}
        {activeTab === "settings" && (
          <ArtistSettings userName={user?.name} userEmail={user?.email} />
        )}
      </main>
      </div>
    </div>
  );
}

// ─── Artist Marketing Hub ────────────────────────────────────────────────────
function ArtistMarketingTab({ userName }: { userName?: string }) {
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [songTitle, setSongTitle]     = useState("");
  const [songGenre, setSongGenre]     = useState("Hip-Hop");
  const [releaseType, setReleaseType] = useState("Single");
  const [promoCopy, setPromoCopy]     = useState("");
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [shareCardVisible, setShareCardVisible] = useState(false);
  const [shareText, setShareText]     = useState("");
  const [copied, setCopied]           = useState<string | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      try { if (d.socialLinks) setSocialLinks(JSON.parse(d.socialLinks)); } catch {}
    }).catch(() => {});
  }, []);

  const platforms = [
    { key: "spotify",    label: "Spotify",       color: "#1DB954", bg: "rgba(29,185,84,0.12)",  border: "rgba(29,185,84,0.3)",  icon: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.428-5.304-1.751-8.786-.959a.623.623 0 01-.277-1.215c3.809-.87 7.077-.496 9.713 1.11a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.963-.519.781.781 0 01.519-.963c3.632-1.102 8.147-.568 11.224 1.328a.78.78 0 01.257 1.063zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.794c3.532-1.072 9.404-.865 13.115 1.338a.937.937 0 01-.954 1.613z" },
    { key: "youtube",    label: "YouTube",        color: "#FF0000", bg: "rgba(255,0,0,0.10)",    border: "rgba(255,0,0,0.3)",    icon: "M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15V9l5.197 3L10 15z" },
    { key: "soundcloud", label: "SoundCloud",     color: "#FF5500", bg: "rgba(255,85,0,0.10)",   border: "rgba(255,85,0,0.3)",   icon: "M1.175 12.225c-.015 0-.023.01-.025.024l-.3 1.887.3 1.863c.002.015.01.024.025.024s.023-.009.025-.024l.34-1.863-.34-1.887c-.002-.015-.01-.024-.025-.024zm.844-.634c-.02 0-.033.014-.036.033l-.255 2.52.255 2.471c.003.02.016.033.036.033s.033-.013.036-.033l.29-2.47-.29-2.521c-.003-.02-.016-.033-.036-.033zm.903-.197c-.024 0-.042.018-.044.042l-.21 2.717.21 2.668c.002.024.02.042.044.042s.042-.018.044-.042l.24-2.668-.24-2.717c-.002-.024-.02-.042-.044-.042zm17.08 2.376c-.14-2.65-2.28-4.743-4.943-4.743-.68 0-1.328.134-1.916.376-.258-3.43-3.1-6.131-6.594-6.131-1.137 0-2.21.302-3.127.83-.338.2-.428.405-.43.583v11.87c.002.183.145.333.328.345h16.34c.18-.006.342-.157.342-.342V14.57c0-.268-.018-.534-.055-.8z" },
    { key: "twitter",    label: "Twitter / X",    color: "#ffffff", bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.15)", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
    { key: "instagram",  label: "Instagram",      color: "#E1306C", bg: "rgba(225,48,108,0.10)", border: "rgba(225,48,108,0.3)", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  ];

  const strategies = [
    {
      id: "spotify",
      label: "Spotify Playlisting",
      color: "#1DB954",
      steps: [
        "Submit to Spotify editorial 7 days before release via Spotify for Artists → Music → Upcoming.",
        "Pitch to independent playlist curators on SubmitHub and Groover — target playlists with 1K–50K followers for best conversion.",
        "Release on Friday (global New Music Friday day). Upload by Tuesday to hit the editorial submission window.",
        "Add your song to your own public playlist immediately after release to signal engagement.",
        "Share your Spotify.link (not just the app link) — it opens in browser too and doesn't lose mobile users.",
      ],
    },
    {
      id: "youtube",
      label: "YouTube Growth",
      color: "#FF0000",
      steps: [
        "Upload as 'Unlisted' first — add custom thumbnail, SEO title, and full description before publishing.",
        "Title format: '[Song Name] - [Artist] (Official Audio/Video)'. Include genre + mood in description.",
        "Post as a YouTube Short (60 sec vertical clip) the same day — Shorts get pushed to non-subscribers.",
        "Pin a comment with your other streaming links within 10 minutes of publishing.",
        "Best upload time: Thursday 2–4 PM EST. Avoid Monday–Tuesday (lowest engagement days).",
      ],
    },
    {
      id: "tiktok",
      label: "TikTok Viral Strategy",
      color: "#ff2d55",
      steps: [
        "Create a 'use this sound' trend — post the first video using your song as audio with a hook challenge or dance.",
        "Use your song as the background audio in at least 3 different styles of videos (studio clip, lyric video, day-in-life).",
        "First 3 seconds must hook: start with the loudest / most memorable part of the song — not the intro.",
        "Post 3 TikToks on release day: morning, afternoon, evening — the algorithm treats each as a fresh push.",
        "Hashtags: #newmusic #[genre] #fyp #[yourartistaname] — keep to 5 max. More doesn't help.",
      ],
    },
    {
      id: "instagram",
      label: "Instagram Strategy",
      color: "#E1306C",
      steps: [
        "Post a Reel with the song the same hour it drops — Reels get 3x more reach than static posts.",
        "Story countdown sticker 24h before release — followers get notified when the song drops.",
        "Add your Spotify/Apple Music link to your bio link-in-bio tool (Linktree or similar) before release.",
        "Caption hook: start with a lyric or emotional line from the song — not 'NEW SONG OUT NOW'.",
        "Cross-post the Reel to your Facebook page — Meta cross-promotes between apps in the algorithm.",
      ],
    },
    {
      id: "apple",
      label: "Apple Music Editorial",
      color: "#fc3c44",
      steps: [
        "Claim and verify your Apple Music for Artists profile — unverified profiles can't submit for editorial.",
        "Submit through your distributor (DistroKid, TuneCore, etc.) at least 2 weeks before release.",
        "Write a compelling artist bio — Apple editorial teams read these when selecting New Artists.",
        "Include high-res artwork (3000×3000px minimum) — Apple rejects editorial pitches with poor quality art.",
        "After release, share the Apple Music link via social — Apple's algorithm tracks external traffic to your page.",
      ],
    },
    {
      id: "soundcloud",
      label: "SoundCloud Reach",
      color: "#FF5500",
      steps: [
        "Post the full track — SoundCloud users dislike 30-second previews. Give it all.",
        "Add waveform tags at key moments (drop, hook, bridge) — listeners click these, boosting your play count.",
        "Repost other artists in your lane first — they'll return the favor and expose you to their following.",
        "Join SoundCloud communities and groups in your genre. Comment on trending tracks in your niche.",
        "SoundCloud Go+ submission: apply via SoundCloud for Artists to get on curated discovery playlists.",
      ],
    },
  ];

  async function generatePromoCopy() {
    if (!songTitle) return;
    setGeneratingCopy(true); setPromoCopy("");
    try {
      const res = await fetch("/api/ai/marketing-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "campaign",
          title: `${releaseType}: "${songTitle}"`,
          beatTitle: songTitle,
          discount: "",
          channel: "all",
          urgency: "ongoing",
        }),
      });
      const data = await res.json();
      if (res.ok && data.description) setPromoCopy(data.description);
    } catch { setPromoCopy("Could not generate. Try again."); }
    finally { setGeneratingCopy(false); }
  }

  function generateShareCard() {
    const t = `${releaseType.toUpperCase()} OUT NOW\n\n"${songTitle || "My New Song"}"\n${songGenre}${userName ? ` by ${userName}` : ""}\n\n${[socialLinks.spotify, socialLinks.youtube, socialLinks.soundcloud].filter(Boolean).join(" | ") || "Link in bio"}\n\n#newmusic #${songGenre.toLowerCase().replace(/[^a-z]/g, "")} #${releaseType.toLowerCase()} #artist #music`;
    setShareText(t);
    setShareCardVisible(true);
  }

  async function copyText(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `"${songTitle}" — ${releaseType}`, text: shareText, url: socialLinks.spotify || socialLinks.youtube || "" });
    } catch { /* cancelled */ }
  }

  const connectedPlatforms = platforms.filter(p => socialLinks[p.key]);
  const disconnectedPlatforms = platforms.filter(p => !socialLinks[p.key]);

  const releaseDropTimes = [
    { day: "Friday",    time: "12 AM EST",  note: "Global New Music Friday — Spotify editorial, Apple Music, playlists all refresh at midnight", score: 100 },
    { day: "Thursday",  time: "8–11 PM EST", note: "Pre-release hype night — post teasers, TikToks, and go live before midnight drop", score: 92 },
    { day: "Friday",    time: "9 AM–12 PM", note: "Morning push to catch commuters and playlist surfing on all platforms", score: 85 },
    { day: "Tuesday",   time: "2–4 PM EST", note: "Strong mid-week for YouTube + SoundCloud — outside Friday noise, easier to stand out", score: 68 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Marketing Hub</h1>
        <p className="text-gray-500 text-sm mt-1">Grow your audience on Spotify, YouTube, TikTok, and every platform you're on</p>
      </div>

      {/* Streaming Links */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold">Your Streaming Presence</h2>
            <p className="text-gray-500 text-xs mt-0.5">{connectedPlatforms.length} of {platforms.length} platforms linked</p>
          </div>
          <a href="/artist?tab=profile"
            onClick={e => { e.preventDefault(); }}
            className="text-xs text-teal-400 border border-teal-700/40 px-3 py-1.5 rounded-lg hover:bg-teal-600/10 transition-colors cursor-pointer"
          >
            Manage Links →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map(p => {
            const url = socialLinks[p.key];
            return (
              <div key={p.key} className="rounded-xl border p-4 flex items-center gap-3 transition-all"
                style={{ background: url ? p.bg : "rgba(255,255,255,0.02)", borderColor: url ? p.border : "rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: url ? p.bg : "rgba(255,255,255,0.05)", border: `1px solid ${url ? p.border : "rgba(255,255,255,0.08)"}` }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: url ? p.color : "#4b5563" }}>
                    <path d={p.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: url ? "#fff" : "#6b7280" }}>{p.label}</p>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] truncate block hover:underline"
                      style={{ color: p.color }}>
                      {url.replace("https://", "").slice(0, 32)}{url.length > 38 ? "…" : ""}
                    </a>
                  ) : (
                    <p className="text-gray-600 text-[11px]">Not connected — add in Profile</p>
                  )}
                </div>
                {url && (
                  <button onClick={() => copyText(url, p.key)} title="Copy link"
                    className="shrink-0 text-gray-500 hover:text-white transition-colors p-1">
                    {copied === p.key
                      ? <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {disconnectedPlatforms.length > 0 && (
          <p className="text-gray-600 text-xs mt-3">
            Add missing links in <span className="text-teal-400">My Profile → Social Links</span> to unlock full platform tracking.
          </p>
        )}
      </div>

      {/* Release + Share Card side by side */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* AI Promo Copy Generator */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-700/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-white font-bold">AI Promo Copy</h2>
              <p className="text-gray-500 text-xs">Platform-ready copy for your release</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Song / Project Title</label>
              <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="e.g. Midnight Drive"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Genre</label>
                <select value={songGenre} onChange={e => setSongGenre(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-600">
                  {["Hip-Hop","R&B","Trap","Drill","Pop","Afrobeats","Lo-Fi","House","Soul","Rock","Alternative"].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Release Type</label>
                <select value={releaseType} onChange={e => setReleaseType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-600">
                  {["Single","EP","Album","Freestyle","Feature","Remix"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={generatePromoCopy} disabled={generatingCopy || !songTitle}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm mb-4 flex items-center justify-center gap-2 transition-colors">
            {generatingCopy
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              : "Generate Promo Copy"}
          </button>

          {promoCopy ? (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 relative">
              <p className="text-gray-200 text-sm whitespace-pre-line leading-relaxed">{promoCopy}</p>
              <button onClick={() => copyText(promoCopy, "copy")}
                className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg border transition-all ${copied === "copy" ? "bg-teal-600 text-white border-teal-600" : "text-gray-500 border-gray-600 hover:text-white"}`}>
                {copied === "copy" ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-xl p-4 text-center">
              <p className="text-gray-600 text-xs">Enter your song title and hit generate — you'll get campaign hooks, target audience segments, hashtags, and timing advice</p>
            </div>
          )}
        </div>

        {/* Release Share Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-700/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </div>
            <div>
              <h2 className="text-white font-bold">Release Share Card</h2>
              <p className="text-gray-500 text-xs">Shareable promo card for social</p>
            </div>
          </div>

          <button onClick={generateShareCard} disabled={!songTitle}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm mb-4 transition-colors">
            Generate Share Card
          </button>

          {shareCardVisible ? (
            <>
              {/* Visual card */}
              <div className="rounded-2xl overflow-hidden mb-3 relative"
                style={{ background: "#000", border: "1.5px solid rgba(20,184,166,0.4)" }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(20,184,166,0.2) 0%, transparent 70%)" }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 50% 50% at 100% 100%, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />

                <div className="relative z-10 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white font-black text-sm tracking-widest">WAVR</p>
                      <p className="text-white/25 text-[9px] tracking-[0.15em] uppercase">Artist Platform</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border text-teal-300 border-teal-500/40 bg-teal-500/10">
                      {releaseType} Out Now
                    </span>
                  </div>

                  {/* Waveform-style bars */}
                  <div className="flex items-center gap-px mb-4" style={{ height: 32 }}>
                    {Array.from({ length: 32 }, (_, i) => {
                      const h = ((songTitle.charCodeAt(i % Math.max(songTitle.length, 1)) * 11 + i * 9) % 60) + 20;
                      return (
                        <div key={i} className="rounded-sm flex-1"
                          style={{ height: `${h}%`, background: `rgba(20,184,166,${0.2 + (i % 5) * 0.12})`, minHeight: 3 }} />
                      );
                    })}
                  </div>

                  <p className="font-black leading-none mb-3 text-white truncate"
                    style={{ fontSize: (songTitle || "New Song").length > 16 ? "1.3rem" : "1.6rem", textShadow: "0 0 28px rgba(20,184,166,0.6)" }}>
                    {(songTitle || "New Song").toUpperCase()}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {[songGenre, userName || "Artist", ...(connectedPlatforms.slice(0, 2).map(p => p.label))].map(tag => (
                      <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-white/55 border border-white/10">{tag}</span>
                    ))}
                  </div>

                  <div className="h-px mb-4" style={{ background: "linear-gradient(to right, rgba(20,184,166,0.5), transparent)" }} />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {connectedPlatforms.slice(0, 3).map(p => (
                        <div key={p.key} className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: p.color }}>
                            <path d={p.icon} />
                          </svg>
                        </div>
                      ))}
                      {connectedPlatforms.length === 0 && (
                        <span className="text-gray-600 text-[10px]">Link platforms in Profile</span>
                      )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl text-white"
                      style={{ background: "linear-gradient(135deg,#0d9488,#7c3aed)", boxShadow: "0 4px 20px rgba(20,184,166,0.4)" }}>
                      STREAM NOW
                    </span>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <textarea readOnly value={shareText} rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-gray-300 text-xs resize-none font-mono mb-3 leading-relaxed" />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {"share" in navigator && (
                  <button onClick={nativeShare}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share…
                  </button>
                )}
                <button onClick={() => { const t = `"${songTitle}" ${releaseType} out now — ${songGenre}\n\n${socialLinks.spotify || socialLinks.youtube || "Link in bio"}\n\n#newmusic #${songGenre.toLowerCase().replace(/[^a-z]/g, "")} #${releaseType.toLowerCase()}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}`, "_blank", "noopener"); }}
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 rounded-xl text-xs border border-gray-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Post on X
                </button>
                <button onClick={() => copyText(shareText, "sharecard")}
                  className={`flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-xs col-span-2 transition-all ${"share" in navigator ? "" : ""} ${copied === "sharecard" ? "bg-teal-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {copied === "sharecard" ? "Copied!" : "Copy Caption"}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-xl p-6 text-center">
              <p className="text-gray-600 text-xs">Enter your song title above and click Generate Share Card</p>
            </div>
          )}
        </div>
      </div>

      {/* Release Timing */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-1">Best Release Times</h2>
        <p className="text-gray-500 text-xs mb-5">When to drop for maximum platform exposure and playlist consideration</p>
        <div className="space-y-2.5">
          {releaseDropTimes.map((t, i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${i === 0 ? "bg-teal-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-white font-bold text-sm">{t.day}</span>
                  <span className="text-teal-400 text-xs font-medium bg-teal-900/30 border border-teal-700/30 px-2 py-0.5 rounded-full">{t.time}</span>
                </div>
                <p className="text-gray-500 text-xs">{t.note}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-violet-600" style={{ width: `${t.score}%` }} />
                </div>
                <span className="text-gray-400 text-xs w-8 text-right">{t.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Strategies */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-1">Platform Growth Strategies</h2>
        <p className="text-gray-500 text-xs mb-5">Click any platform for a step-by-step playbook</p>

        <div className="grid sm:grid-cols-3 gap-2 mb-6">
          {strategies.map(s => (
            <button key={s.id} onClick={() => setActiveStrategy(activeStrategy === s.id ? null : s.id)}
              className={`text-left p-3 rounded-xl border transition-all ${activeStrategy === s.id ? "border-opacity-60 bg-opacity-20" : "bg-gray-800/50 border-gray-700 hover:border-gray-600"}`}
              style={activeStrategy === s.id ? { borderColor: s.color, background: `${s.color}14` } : {}}>
              <p className="text-sm font-bold" style={{ color: activeStrategy === s.id ? s.color : "#fff" }}>{s.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.steps.length} steps</p>
            </button>
          ))}
        </div>

        {activeStrategy && (() => {
          const s = strategies.find(x => x.id === activeStrategy)!;
          return (
            <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: `${s.color}40`, background: `${s.color}08` }}>
              <p className="font-bold text-sm" style={{ color: s.color }}>{s.label} — Step-by-Step</p>
              {s.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                    style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
                    {i + 1}
                  </span>
                  <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Playlist Pitching */}
      <div className="bg-gradient-to-br from-teal-900/20 to-gray-900 border border-teal-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-700/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          </div>
          <div>
            <h2 className="text-white font-bold">Playlist Pitching Playbook</h2>
            <p className="text-gray-500 text-xs">How to get your music on playlists — editorial and independent</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Spotify Editorial", urgency: "7 days before release", color: "#1DB954", steps: ["Log in to Spotify for Artists", "Go to Music → Upcoming releases", "Submit the unreleased track with genre, mood, and instruments filled out", "Write a compelling pitch in the description field — be specific about the song's story", "Submit at least 7 days before your release date"] },
            { title: "Independent Playlists", urgency: "Anytime after release", color: "#6366f1", steps: ["Use SubmitHub to find curators by genre (paid credits or free)", "Use Groover for European and mainstream curators", "Target playlists with 1K–50K followers — higher response rate than major playlists", "Personalize each pitch — mention a specific track on their playlist you connect with", "Follow up once after 2 weeks if no response"] },
            { title: "YouTube Playlists", urgency: "After upload", color: "#FF0000", steps: ["Search YouTube for '[genre] playlist' and find active curators", "Find their channel and look for a submission email in the About section", "Message on Instagram or Twitter for faster response", "Send a short pitch: song name, genre, BPM, and why it fits their playlist", "Offer to share their playlist to your audience in exchange"] },
          ].map(section => (
            <div key={section.title} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">{section.title}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ color: section.color, borderColor: `${section.color}40`, background: `${section.color}15` }}>
                  {section.urgency}
                </span>
              </div>
              <ol className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[10px] font-black w-4 shrink-0 mt-0.5" style={{ color: section.color }}>{i + 1}.</span>
                    <p className="text-gray-400 text-xs leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Artist Profile ───────────────────────────────────────────────────────────
const SOCIAL_FIELDS = [
  { key: "twitter",    label: "Twitter / X",  placeholder: "https://x.com/yourhandle" },
  { key: "instagram",  label: "Instagram",    placeholder: "https://instagram.com/yourhandle" },
  { key: "youtube",    label: "YouTube",      placeholder: "https://youtube.com/@yourchannel" },
  { key: "soundcloud", label: "SoundCloud",   placeholder: "https://soundcloud.com/yourprofile" },
  { key: "spotify",    label: "Spotify",      placeholder: "https://open.spotify.com/artist/..." },
  { key: "website",    label: "Website",      placeholder: "https://yourwebsite.com" },
] as const;

type SocialKey = typeof SOCIAL_FIELDS[number]["key"];

function ArtistProfile({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const [name, setName]       = useState(userName ?? "");
  const [bio, setBio]         = useState("");
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);
  const [social, setSocial]   = useState<Record<SocialKey, string>>({
    twitter: "", instagram: "", youtube: "", soundcloud: "", spotify: "", website: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      setName(d.name ?? "");
      setBio(d.bio ?? "");
      if (d.avatar) setAvatarPreview(d.avatar);
      if (d.coverImage) setCoverPreview(d.coverImage);
      if (d.socialLinks) {
        try { setSocial(prev => ({ ...prev, ...JSON.parse(d.socialLinks) })); } catch {}
      }
    }).catch(() => {});
  }, []);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setAvatarFile(f);
    if (f) setAvatarPreview(URL.createObjectURL(f));
  }
  function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("bio", bio);
      fd.append("socialLinks", JSON.stringify(social));
      if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile)  fd.append("coverImage", coverFile);
      const res = await fetch("/api/profile", { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? "Failed to save"); return; }
      setMsg("Profile saved!");
      setAvatarFile(null); setCoverFile(null);
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-white">My Profile</h1>
      {msg && <p className={`text-sm ${msg.includes("saved") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover + Avatar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-900 to-teal-900 relative overflow-hidden">
            {coverPreview && <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />}
            <label className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 cursor-pointer transition-colors">
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-lg">Change Cover</span>
              <input type="file" accept="image/*" onChange={pickCover} className="sr-only" />
            </label>
          </div>
          <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-700">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-500">{name.charAt(0)}</div>
                }
              </div>
              <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" /></svg>
                <input type="file" accept="image/*" onChange={pickAvatar} className="sr-only" />
              </label>
            </div>
            <div className="flex-1 pb-1">
              <p className="text-white font-bold">{name || "Your Name"}</p>
              <p className="text-gray-500 text-xs">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Basic Info</h2>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Artist Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Bio <span className="text-gray-600">({bio.length}/500)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4}
              placeholder="Tell fans about yourself…"
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Social links */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">Social Links</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-gray-400 text-xs font-medium mb-1">{label}</label>
                <input
                  value={social[key]}
                  onChange={e => setSocial(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

// ─── Artist Merch ─────────────────────────────────────────────────────────────
const MERCH_CATEGORIES = ["T-Shirts","Hoodies","Hats","Phone Cases","Tote Bags","Posters","Mugs"];

function ArtistMerch() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding]     = useState(false);
  const [msg, setMsg]           = useState("");

  const [name, setName]         = useState("");
  const [category, setCategory] = useState("T-Shirts");
  const [price, setPrice]       = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/merch/mine")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchProducts(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price || !imageFile) { setMsg("Name, price and image are required."); return; }
    setAdding(true); setMsg("");
    const fd = new FormData();
    fd.append("name", name);
    fd.append("category", category);
    fd.append("price", price);
    fd.append("image", imageFile);
    try {
      const res = await fetch("/api/merch", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); setMsg(d.error ?? "Failed"); return; }
      setMsg("Product added!");
      setName(""); setPrice(""); setImageFile(null); setShowForm(false);
      fetchProducts();
    } catch { setMsg("Network error."); }
    finally { setAdding(false); }
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">My Merch</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">New Merch Product</h2>
          {msg && <p className={`text-sm ${msg.includes("added") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Product Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Logo Hoodie" className={inputCls} />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {MERCH_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Price ($)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" min="1" required placeholder="29.99" className={inputCls} />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Product Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} required
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-900/30 file:text-blue-400 hover:file:bg-blue-900/40" />
            </div>
          </div>
          <button type="submit" disabled={adding}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
            {adding ? "Adding…" : "Add Product"}
          </button>
        </form>
      )}

      {!showForm && msg && <p className="text-green-400 text-sm">{msg}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 border-dashed rounded-2xl">
          <p className="text-gray-400 font-semibold mb-1">No merch yet</p>
          <p className="text-gray-600 text-sm">Add your first product to start selling</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all">
              <div className="h-40 bg-gray-800 overflow-hidden">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    </div>
                }
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate">{p.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{p.category}</p>
                <p className="text-blue-400 font-bold mt-2">${Number(p.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Artist Settings ──────────────────────────────────────────────────────────
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
      <h2 className="text-xl font-bold text-white">Account Settings</h2>
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        {msg && <p className={`text-sm ${msg === "Saved!" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Display Name</label>
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
