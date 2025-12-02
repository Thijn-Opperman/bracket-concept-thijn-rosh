'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team, BracketType, Match, BracketSettings } from '@/app/types/bracket';
import { useMemo, useState, useRef } from 'react';
import { getContrastRatio, normalizeHex } from '@/app/utils/colorUtils';
import { uploadFile, isStorageAvailable } from '@/app/services/storageService';

export default function AdminPage() {
  const {
    teams,
    addTeam,
    removeTeam,
    updateTeam,
    brackets,
    updateMatchDetails,
    setWinner,
    setTeamScore,
    setMatchTeam,
    getMatchById,
    settings,
    setSettings,
    tournamentId,
    createTournamentInSupabase,
    setTournamentId,
    loadFromSupabase,
    syncToSupabase,
    isSyncing,
  } = useBracketStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamDraft, setEditingTeamDraft] = useState<Team | null>(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamSelectionError, setTeamSelectionError] = useState<string | null>(null);
  const [tournamentIdInput, setTournamentIdInput] = useState('');
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [isLoadingTournament, setIsLoadingTournament] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBrandingLogo, setUploadingBrandingLogo] = useState(false);
  const [uploadingEditLogo, setUploadingEditLogo] = useState(false);
  const [uploadingEditBrandingLogo, setUploadingEditBrandingLogo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const brandingLogoFileInputRef = useRef<HTMLInputElement>(null);
  const editLogoFileInputRef = useRef<HTMLInputElement>(null);
  const editBrandingLogoFileInputRef = useRef<HTMLInputElement>(null);
  const selectedBracket = useMemo(() => {
    if (brackets.length === 0) return undefined;
    if (selectedBracketId) {
      return (
        brackets.find((bracket) => bracket.id === selectedBracketId) ?? brackets[0]
      );
    }
    return brackets[0];
  }, [brackets, selectedBracketId]);

  const resolvedRoundIndex = useMemo(() => {
    if (!selectedBracket || selectedBracket.rounds.length === 0) return 0;
    if (selectedRoundIndex >= selectedBracket.rounds.length) return 0;
    if (selectedRoundIndex < 0) return 0;
    return selectedRoundIndex;
  }, [selectedBracket, selectedRoundIndex]);

  const selectedRound = selectedBracket?.rounds[resolvedRoundIndex];

  const resolvedMatchId = useMemo(() => {
    if (!selectedRound || selectedRound.matches.length === 0) return null;
    if (selectedMatchId) {
      const exists = selectedRound.matches.some(
        (match) => match.id === selectedMatchId
      );
      if (exists) {
        return selectedMatchId;
      }
    }
    return selectedRound.matches[0]?.id ?? null;
  }, [selectedMatchId, selectedRound]);

  const currentMatchId = resolvedMatchId;

  const selectedMatch = currentMatchId ? getMatchById(currentMatchId) : undefined;

  const autoTeamSelectionError = useMemo(() => {
    if (!selectedMatch) return null;
    const [teamA, teamB] = selectedMatch.teams;
    if (teamA?.id && teamB?.id && teamA.id === teamB.id) {
      return 'Deze match bevat twee keer hetzelfde team. Kies een ander team voor een van de slots.';
    }
    return null;
  }, [selectedMatch]);

  const editingTeam = teams.find((team) => team.id === editingTeamId);
  const displayedTeamSelectionError =
    selectedMatch ? teamSelectionError ?? autoTeamSelectionError : null;

  const setBracketSelection = (value: string) => {
    setTeamSelectionError(null);
    setSelectedBracketId(value || null);
    setSelectedRoundIndex(0);
    setSelectedMatchId(null);
  };

  const setRoundSelection = (value: string) => {
    setTeamSelectionError(null);
    setSelectedRoundIndex(Number(value));
    setSelectedMatchId(null);
  };

  const setMatchSelection = (value: string) => {
    setTeamSelectionError(null);
    setSelectedMatchId(value || null);
  };

  const cloneTeamForEditing = (team: Team | null | undefined): Team | null => {
    if (!team) return null;
    return {
      ...team,
      players: team.players ? team.players.map((player) => ({ ...player })) : [],
    };
  };

  const openTeamModal = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId) ?? null;
    setEditingTeamId(teamId);
    setEditingTeamDraft(cloneTeamForEditing(team));
    setIsTeamModalOpen(true);
  };

  const closeTeamModal = () => {
    setIsTeamModalOpen(false);
    setEditingTeamId(null);
    setEditingTeamDraft(null);
  };

  const handleTeamFieldChange = (field: keyof Team, value: string) => {
    setEditingTeamDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value === '' ? undefined : value,
      };
    });
  };

  const handleFileUpload = async (
    file: File,
    field: 'logo' | 'brandingLogo',
    isEditing: boolean = false
  ) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Alleen afbeeldingsbestanden zijn toegestaan (JPEG, PNG, GIF, WebP, SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum grootte is 5MB.');
      return;
    }

    if (isEditing) {
      if (field === 'logo') {
        setUploadingEditLogo(true);
      } else {
        setUploadingEditBrandingLogo(true);
      }
    } else {
      if (field === 'logo') {
        setUploadingLogo(true);
      } else {
        setUploadingBrandingLogo(true);
      }
    }

    try {
      // Converteer bestand naar data URL (lokaal opgeslagen)
      const dataURL = await uploadFile(file, 'team-logos');
      if (dataURL) {
        console.log('✅ File converted to data URL successfully');
        if (isEditing) {
          handleTeamFieldChange(field, dataURL);
        } else {
          setNewTeamForm({ ...newTeamForm, [field]: dataURL });
        }
        // Toon succesmelding
        setUploadMessage({ type: 'success', text: 'Logo succesvol opgeslagen' });
        setTimeout(() => setUploadMessage(null), 3000);
      } else {
        setUploadMessage({ type: 'error', text: 'Opslag mislukt. Geen data URL ontvangen.' });
        setTimeout(() => setUploadMessage(null), 5000);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      setUploadMessage({ type: 'error', text: `Opslag mislukt: ${errorMessage}` });
      setTimeout(() => setUploadMessage(null), 5000);
    } finally {
      setUploadingLogo(false);
      setUploadingBrandingLogo(false);
      setUploadingEditLogo(false);
      setUploadingEditBrandingLogo(false);
    }
  };

  const handleAddPlayer = () => {
    setEditingTeamDraft((prev) => {
      if (!prev) return prev;
      const players = prev.players ?? [];
      const newPlayer = {
        id: `${prev.id}-player-${Date.now()}`,
        name: `Speler ${players.length + 1}`,
        role: 'Starter',
      };
      return {
        ...prev,
        players: [...players, newPlayer],
      };
    });
  };

  const handlePlayerFieldChange = (
    playerId: string,
    field: 'name' | 'role' | 'number' | 'countryCode'
  ) => (value: string) => {
    setEditingTeamDraft((prev) => {
      if (!prev) return prev;
      const players = (prev.players ?? []).map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player
      );
      return {
        ...prev,
        players,
      };
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    setEditingTeamDraft((prev) => {
      if (!prev) return prev;
      const players = (prev.players ?? []).filter((player) => player.id !== playerId);
      return {
        ...prev,
        players,
      };
    });
  };

  const [newTeamForm, setNewTeamForm] = useState<Partial<Team>>({
    name: '',
    countryCode: '',
    logo: '',
    coach: '',
    motto: '',
    twitchLink: '',
    brandingLogo: '',
    players: [],
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const handleCreateTeam = () => {
    if (!newTeamForm.name || newTeamForm.name.trim() === '') {
      alert('Teamnaam is verplicht');
      return;
    }
    
    // Check for duplicate team name
    const duplicateTeam = teams.find(
      (t) => t.name.toLowerCase().trim() === newTeamForm.name?.toLowerCase().trim()
    );
    if (duplicateTeam) {
      alert(`Een team met de naam "${newTeamForm.name}" bestaat al. Kies een andere naam.`);
      return;
    }
    
    const id = `team-${Date.now()}`;
    addTeam({
      id,
      name: newTeamForm.name.trim(),
      countryCode: newTeamForm.countryCode?.trim() || undefined,
      logo: newTeamForm.logo?.trim() || undefined,
      coach: newTeamForm.coach?.trim() || undefined,
      motto: newTeamForm.motto?.trim() || undefined,
      twitchLink: newTeamForm.twitchLink?.trim() || undefined,
      brandingLogo: newTeamForm.brandingLogo?.trim() || undefined,
      players: [],
    });
    // Reset form
    setNewTeamForm({
      name: '',
      countryCode: '',
      logo: '',
      coach: '',
      motto: '',
      twitchLink: '',
      brandingLogo: '',
      players: [],
    });
    setIsCreatingTeam(false);
    setSelectedTeamId(id);
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    
    if (window.confirm(`Weet je zeker dat je "${team.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      removeTeam(teamId);
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
      }
      if (editingTeamId === teamId) {
        closeTeamModal();
      }
    }
  };

  const handleMatchFieldChange = (field: 'startTime' | 'court', value: string) => {
    if (!currentMatchId) return;
    updateMatchDetails(currentMatchId, { [field]: value });
  };

  const handleMatchDetailChange = (
    field: 'title' | 'subtitle' | 'description' | 'scheduleNote' | 'prizeInfo',
    value: string
  ) => {
    if (!currentMatchId) return;
    updateMatchDetails(currentMatchId, {
      details: {
        [field]: value,
      },
    });
  };

  const handleScoreInputChange = (teamIndex: number) => (value: string) => {
    if (!currentMatchId) return;
    const parsed = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setTeamScore(currentMatchId, teamIndex, parsed);
  };

  const handleWinnerSelect = (teamIndex: number) => () => {
    if (!currentMatchId || !selectedMatch?.teams[teamIndex]) return;
    setWinner(currentMatchId, teamIndex);
  };

  const handleTeamAssignment = (teamIndex: number) => (value: string) => {
    if (!currentMatchId) return;
    const normalized = value === '' ? null : value;
    const otherIndex = teamIndex === 0 ? 1 : 0;
    const otherTeamId = selectedMatch?.teams[otherIndex]?.id ?? null;

    if (normalized && normalized === otherTeamId) {
      setTeamSelectionError('Een team kan niet tegen zichzelf spelen. Kies een ander team voor deze slot.');
      return;
    }

    setTeamSelectionError(null);
    setMatchTeam(currentMatchId, teamIndex, normalized);
  };

  const teamMatchesForEditingTeam = useMemo(() => {
    if (!editingTeamId) return [];
    const collected: Array<{
      bracketName: string;
      roundName: string;
      matchId: string;
      match: Match;
    }> = [];

    brackets.forEach((bracket) => {
      bracket.rounds.forEach((round) => {
        round.matches.forEach((match) => {
          if (match.teams.some((slot) => slot?.id === editingTeamId)) {
            collected.push({
              bracketName: bracket.name,
              roundName: round.name,
              matchId: match.id,
              match,
            });
          }
        });
      });
    });
    return collected;
  }, [editingTeamId, brackets]);

  const handleTeamMatchMetaChange =
    (matchId: string, field: 'startTime' | 'court') => (value: string) => {
      updateMatchDetails(matchId, {
        [field]: value === '' ? undefined : value,
      });
    };

  const handleSaveEditedTeam = () => {
    if (!editingTeam || !editingTeamDraft) return;
    const name = editingTeamDraft.name?.trim();
    if (!name) {
      alert('Teamnaam is verplicht');
      return;
    }
    const sanitizedPlayers =
      editingTeamDraft.players?.map((player) => ({
        ...player,
        name: player.name?.trim() || 'Naamloos',
      })) ?? [];

    const {
      id: draftIdToIgnore,
      players: draftPlayersToIgnore,
      ...teamPayload
    } = editingTeamDraft;
    void draftIdToIgnore;
    void draftPlayersToIgnore;

    updateTeam(editingTeam.id, {
      ...teamPayload,
      name,
      players: sanitizedPlayers,
    });
    closeTeamModal();
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#020617] p-6 text-white"
      style={{ fontFamily: 'Inter, Arial, sans-serif' }}
    >
      <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Bracket beheer
            </p>
            <h1 className="text-3xl font-bold">Admin Console</h1>
            <p className="text-sm text-white/70">
              Voeg teams toe, beheer spelersgegevens en vul wedstrijdinformatie aan.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold uppercase tracking-widest transition hover:border-white/50 hover:bg-white/10"
          >
            Terug naar bracket
          </Link>
        </div>
        <div className="grid gap-4 text-sm text-white/70 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Teams
            </p>
            <p className="text-2xl font-semibold text-white">{teams.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Brackets
            </p>
            <p className="text-2xl font-semibold text-white">{brackets.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Rounds
            </p>
            <p className="text-2xl font-semibold text-white">
              {selectedBracket?.rounds.length ?? 0}
            </p>
          </div>
        </div>

      </header>

      {/* Upload Message Toast */}
      {uploadMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur ${
              uploadMessage.type === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/40 bg-red-500/10 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadMessage.type === 'success' ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span>{uploadMessage.text}</span>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 lg:flex-row">
        {/* Left column: Bracket meta + settings */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Tournament Info */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Toernooi info
              </p>
              <h2 className="text-2xl font-semibold text-white">Naam & omschrijving</h2>
              <p className="mt-1 text-xs text-white/60">
                Pas de naamgeving aan die zichtbaar is op de publieke bracket.
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <Field
                label="Serie naam"
                value={settings.tournamentSeries ?? ''}
                placeholder="Bijv. Grand Arena Series"
                onChange={(value) => setSettings({ tournamentSeries: value })}
              />
              <Field
                label="Toernooi titel"
                value={settings.tournamentTitle ?? ''}
                placeholder="Bijv. Ultimate Bracket Showdown"
                onChange={(value) => setSettings({ tournamentTitle: value })}
              />
              <TextAreaField
                label="Korte omschrijving"
                value={settings.tournamentDescription ?? ''}
                placeholder="Leg in 1-2 zinnen uit wat dit toernooi uniek maakt."
                onChange={(value) => setSettings({ tournamentDescription: value })}
              />
            </div>
          </section>

          {/* Bracket Type Selector */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Bracket Type
              </p>
              <h2 className="text-2xl font-semibold text-white">Selecteer Type</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                {
                  value: 'single-elimination' as BracketType,
                  label: 'Single Elimination',
                  description: 'Winnaar gaat door, verliezer is uit',
                },
                {
                  value: 'double-elimination' as BracketType,
                  label: 'Double Elimination',
                  description: 'Tweede kansen voor verliezers',
                },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSettings({ bracketType: type.value });
                  }}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    settings.bracketType === type.value
                      ? 'border-white/60 bg-white/10 shadow-lg'
                      : 'border-white/10 bg-black/20 hover:border-white/30'
                  }`}
                >
                  <p className="font-semibold text-white">{type.label}</p>
                  <p className="text-xs text-white/60 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Supabase Sync */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Database Sync
              </p>
              <h2 className="text-2xl font-semibold text-white">Supabase</h2>
              <p className="mt-1 text-xs text-white/60">
                Sla alles op in Supabase voor persistente opslag.
              </p>
            </div>
            
            {tournamentId ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-3">
                  <p className="text-xs font-semibold text-green-400">✓ Actief</p>
                  <p className="text-xs text-white/70 mt-1">
                    Tournament ID: <span className="font-mono text-green-300">{tournamentId}</span>
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    Alle wijzigingen worden automatisch opgeslagen in Supabase.
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      await syncToSupabase();
                      alert('✅ Alles gesynced naar Supabase!');
                    } catch (error) {
                      alert(`❌ Fout bij syncen: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  {isSyncing ? '⏳ Syncen...' : '🔄 Handmatig Syncen'}
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Weet je zeker dat je de Supabase verbinding wilt verbreken? Alle wijzigingen worden dan alleen lokaal opgeslagen.')) {
                      setTournamentId(null);
                      setTournamentIdInput('');
                    }
                  }}
                  className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  Verbreek Verbinding
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  onClick={async () => {
                    setIsCreatingTournament(true);
                    try {
                      const id = await createTournamentInSupabase();
                      if (id) {
                        alert(`✅ Tournament aangemaakt! ID: ${id}`);
                        setTournamentIdInput(id);
                      } else {
                        alert('❌ Kon tournament niet aanmaken. Check de console voor details.');
                      }
                    } catch (error) {
                      alert(`❌ Fout bij aanmaken: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
                    } finally {
                      setIsCreatingTournament(false);
                    }
                  }}
                  disabled={isCreatingTournament || isSyncing}
                  className="w-full rounded-xl border border-green-400/50 bg-green-500/20 px-4 py-3 text-sm font-semibold text-green-300 transition hover:bg-green-500/30 disabled:opacity-50"
                >
                  {isCreatingTournament ? '⏳ Aanmaken...' : '➕ Nieuw Tournament Aanmaken'}
                </button>
                
                <div className="relative">
                  <input
                    type="text"
                    value={tournamentIdInput}
                    onChange={(e) => setTournamentIdInput(e.target.value)}
                    placeholder="Plak hier een tournament ID..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40"
                  />
                  <button
                    onClick={async () => {
                      if (!tournamentIdInput.trim()) {
                        alert('Voer eerst een tournament ID in.');
                        return;
                      }
                      setIsLoadingTournament(true);
                      try {
                        const success = await loadFromSupabase(tournamentIdInput.trim());
                        if (success) {
                          alert('✅ Tournament geladen uit Supabase!');
                        } else {
                          alert('❌ Kon tournament niet laden. Check of het ID klopt.');
                        }
                      } catch (error) {
                        alert(`❌ Fout bij laden: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
                      } finally {
                        setIsLoadingTournament(false);
                      }
                    }}
                    disabled={isLoadingTournament || isSyncing || !tournamentIdInput.trim()}
                    className="mt-2 w-full rounded-xl border border-blue-400/50 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-50"
                  >
                    {isLoadingTournament ? '⏳ Laden...' : '📥 Laad Tournament'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Bracket Colors */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Bracket kleuren
              </p>
              <h2 className="text-2xl font-semibold text-white">Kleurenpalet</h2>
              <p className="mt-1 text-xs text-white/60">
                Pas de kleuren live aan. De wijzigingen zijn direct zichtbaar in de bracket.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {( [
                {
                  key: 'primaryColor' as const,
                  label: 'Primaire kleur',
                  description: 'Accent voor titels en progressie balken.',
                },
                {
                  key: 'secondaryColor' as const,
                  label: 'Secundaire kleur',
                  description: 'Ondersteunende accenten en badges.',
                },
                {
                  key: 'backgroundColor' as const,
                  label: 'Achtergrondkleur',
                  description: 'Basis achtergrond voor de bracket.',
                },
              ]).map((colorSetting) => (
                <ColorPickerField
                  key={colorSetting.key}
                  label={colorSetting.label}
                  description={colorSetting.description}
                  value={settings[colorSetting.key]}
                  onChange={(value) => setSettings({ [colorSetting.key]: value })}
                  allSettings={settings}
                  currentKey={colorSetting.key}
                />
              ))}
            </div>
          </section>

        </aside>

        {/* Right column: Team management and match management */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Team Management */}
          <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Teams
                </p>
                <h2 className="text-2xl font-semibold text-white">Teambeheer</h2>
              </div>
              <button
                onClick={() => setIsCreatingTeam(true)}
                className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                Team toevoegen
              </button>
            </div>

          {/* Search/Filter */}
          {teams.length > 3 && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Zoek teams..."
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition focus:border-white/40"
              />
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {teams
              .filter((team) =>
                teamSearchTerm === '' ||
                team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                (team.countryCode ?? '').toLowerCase().includes(teamSearchTerm.toLowerCase())
              )
              .map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-widest text-white/60">
                      {team.countryCode ?? 'N/A'}
                    </p>
                    <p className="text-lg font-semibold text-white">{team.name}</p>
                    <p className="text-xs text-white/60">
                      {(team.players ?? []).length} spelers
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTeamModal(team.id);
                    }}
                    className="rounded-lg border border-white/20 p-2 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                    title="Team instellingen"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <p className="mt-6 text-sm text-white/60">
              Nog geen teams toegevoegd. Maak een nieuw team aan in het linker paneel.
            </p>
          )}

        </section>

        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Wedstrijden
              </p>
              <h2 className="text-2xl font-semibold text-white">Matchbeheer</h2>
              <p className="text-xs text-white/60 mt-1">
                1) Kies bracket/ronde/match • 2) Ken teams toe • 3) Vul scores in • 4) Markeer winnaar
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
            Zorg dat beide teams zijn ingevuld voordat je een winnaar kiest. De live bracket wordt direct bijgewerkt na elke wijziging.
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Bracket"
              value={selectedBracket?.id ?? ''}
              onChange={setBracketSelection}
              options={brackets.map((bracket) => ({
                label: bracket.name,
                value: bracket.id,
              }))}
            />
            <SelectField
              label="Ronde"
              value={
                selectedBracket && selectedBracket.rounds.length > 0
                  ? resolvedRoundIndex.toString()
                  : ''
              }
              onChange={setRoundSelection}
              options={(selectedBracket?.rounds ?? []).map((round, index) => ({
                label: round.name,
                value: index.toString(),
              }))}
            />
            <SelectField
              label="Match"
              value={currentMatchId ?? ''}
              onChange={setMatchSelection}
              options={(selectedRound?.matches ?? []).map((match) => ({
                label: `${match.id.toUpperCase()}`,
                value: match.id,
              }))}
            />
          </div>

          {displayedTeamSelectionError && (
            <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {displayedTeamSelectionError}
            </div>
          )}

          {selectedMatch ? (
            <div className="mt-6 space-y-4">
              {/* Team Assignment */}
              <div className="grid gap-4 md:grid-cols-2">
                {selectedMatch.teams.map((team, index) => (
                  <div
                    key={`${selectedMatch.id}-team-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="mb-3">
                      <label className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2 block">
                        Team {index + 1}
                      </label>
                      <SelectField
                        label=""
                        value={team?.id ?? ''}
                        onChange={handleTeamAssignment(index)}
                        options={[
                          { label: 'Geen team', value: '' },
                          ...teams.map((t) => ({
                            label: t.name,
                            value: t.id,
                          })),
                        ]}
                      />
                    </div>

                    {team && (
                      <div
                        className={`mt-4 rounded-2xl border px-4 py-4 transition ${
                          selectedMatch.winnerIndex === index
                            ? 'border-emerald-400/80 bg-emerald-400/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {team.logo && (
                              <Image
                                src={team.logo}
                                alt={team.name}
                                width={48}
                                height={48}
                                unoptimized
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm uppercase tracking-widest text-white/60">
                                Team {index + 1}
                              </p>
                              <p className="text-lg font-semibold text-white">{team.name}</p>
                              {team.countryCode && (
                                <p className="text-xs text-white/60">{team.countryCode}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleWinnerSelect(index)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition ${
                              selectedMatch.winnerIndex === index
                                ? 'border-emerald-400 text-emerald-100 bg-emerald-400/20 cursor-default'
                                : 'border-white/20 text-white/70 hover:border-emerald-200 hover:text-emerald-100'
                            }`}
                          >
                            <span className="inline-flex h-2 w-2 rounded-full bg-current" />
                            {selectedMatch.winnerIndex === index ? 'Winnaar' : 'Markeer winnaar'}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Score"
                            value={team.score?.toString() ?? ''}
                            placeholder="0"
                            type="number"
                            onChange={handleScoreInputChange(index)}
                          />
                          {team.twitchLink && (
                            <a
                              href={team.twitchLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/40 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-purple-200 transition hover:border-purple-200 hover:bg-purple-400/10"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                              </svg>
                              Twitch
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/60">
              Geen match gevonden voor deze selectie.
            </p>
          )}
        </section>
        </div>
      </main>

      {/* Team Creation Modal */}
      {isCreatingTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setIsCreatingTeam(false);
            setNewTeamForm({
              name: '',
              countryCode: '',
              logo: '',
              coach: '',
              motto: '',
              twitchLink: '',
              brandingLogo: '',
              players: [],
            });
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#020617] p-6 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsCreatingTeam(false);
                setNewTeamForm({
                  name: '',
                  countryCode: '',
                  logo: '',
                  coach: '',
                  motto: '',
                  twitchLink: '',
                  brandingLogo: '',
                  players: [],
                });
              }}
              className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6 pr-10">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Nieuw team
              </p>
              <h2 className="text-2xl font-semibold text-white">Team toevoegen</h2>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <Field
                label="Teamnaam *"
                value={newTeamForm.name ?? ''}
                onChange={(value) => setNewTeamForm({ ...newTeamForm, name: value })}
                placeholder="Vul teamnaam in"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Landcode"
                  value={newTeamForm.countryCode ?? ''}
                  placeholder="NL"
                  onChange={(value) => setNewTeamForm({ ...newTeamForm, countryCode: value })}
                />
                <Field
                  label="Coach"
                  value={newTeamForm.coach ?? ''}
                  placeholder="Coach naam"
                  onChange={(value) => setNewTeamForm({ ...newTeamForm, coach: value })}
                />
              </div>
              <div>
                <label className="space-y-2 text-sm">
                  <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Logo
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'logo', false);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingLogo ? 'Bezig...' : 'Upload logo'}
                    </button>
                  </div>
                  <Field
                    label="Of logo URL"
                    value={newTeamForm.logo ?? ''}
                    placeholder="https://..."
                    onChange={(value) => setNewTeamForm({ ...newTeamForm, logo: value })}
                  />
                </label>
                {newTeamForm.logo && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <Image
                      src={newTeamForm.logo}
                      alt="Logo preview"
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-lg object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-white/60">Logo preview</span>
                    <button
                      type="button"
                      onClick={() => setNewTeamForm({ ...newTeamForm, logo: '' })}
                      className="ml-auto text-xs text-red-400 hover:text-red-300"
                    >
                      Verwijder
                    </button>
                  </div>
                )}
              </div>
              <Field
                label="Twitch Link"
                value={newTeamForm.twitchLink ?? ''}
                placeholder="https://twitch.tv/..."
                onChange={(value) => setNewTeamForm({ ...newTeamForm, twitchLink: value })}
              />
              <div>
                <label className="space-y-2 text-sm">
                  <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                    Branding Logo
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={brandingLogoFileInputRef}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'brandingLogo', false);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => brandingLogoFileInputRef.current?.click()}
                      disabled={uploadingBrandingLogo}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingBrandingLogo ? 'Bezig...' : 'Upload branding'}
                    </button>
                  </div>
                  <Field
                    label="Of branding logo URL"
                    value={newTeamForm.brandingLogo ?? ''}
                    placeholder="https://..."
                    onChange={(value) => setNewTeamForm({ ...newTeamForm, brandingLogo: value })}
                  />
                </label>
                {newTeamForm.brandingLogo && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <Image
                      src={newTeamForm.brandingLogo}
                      alt="Branding logo preview"
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-lg object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-white/60">Branding logo preview</span>
                    <button
                      type="button"
                      onClick={() => setNewTeamForm({ ...newTeamForm, brandingLogo: '' })}
                      className="ml-auto text-xs text-red-400 hover:text-red-300"
                    >
                      Verwijder
                    </button>
                  </div>
                )}
              </div>
              <Field
                label="Teammotto"
                value={newTeamForm.motto ?? ''}
                placeholder="Team motto"
                onChange={(value) => setNewTeamForm({ ...newTeamForm, motto: value })}
              />
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 rounded-full border border-emerald-400/40 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-400/10"
                >
                  Team aanmaken
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTeam(false);
                    setNewTeamForm({
                      name: '',
                      countryCode: '',
                      logo: '',
                      coach: '',
                      motto: '',
                      twitchLink: '',
                      brandingLogo: '',
                      players: [],
                    });
                  }}
                  className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/40"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Edit Modal */}
      {isTeamModalOpen && editingTeam && editingTeamDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeTeamModal}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#020617] p-6 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeTeamModal}
              className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center justify-between pr-10">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Team bewerken
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  {editingTeamDraft.name ?? editingTeam.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  if (editingTeam) {
                    handleDeleteTeam(editingTeam.id);
                  }
                }}
                className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-300 transition hover:border-red-300 hover:bg-red-400/10"
              >
                Verwijder team
              </button>
            </div>

            {/* Team Fields */}
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Teamnaam"
                  value={editingTeamDraft.name ?? ''}
                  onChange={(value) => handleTeamFieldChange('name', value)}
                />
                <Field
                  label="Landcode"
                  value={editingTeamDraft.countryCode ?? ''}
                  placeholder="NL"
                  onChange={(value) => handleTeamFieldChange('countryCode', value)}
                />
                <div>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                      Logo
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={editLogoFileInputRef}
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'logo', true);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editLogoFileInputRef.current?.click()}
                        disabled={uploadingEditLogo}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingEditLogo ? 'Bezig...' : 'Upload logo'}
                      </button>
                    </div>
                    <Field
                      label="Of logo URL"
                      value={editingTeamDraft.logo ?? ''}
                      placeholder="https://..."
                      onChange={(value) => handleTeamFieldChange('logo', value)}
                    />
                  </label>
                  {editingTeamDraft.logo && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <Image
                        src={editingTeamDraft.logo}
                        alt="Logo preview"
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 rounded-lg object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-white/60">Logo preview</span>
                      <button
                        type="button"
                        onClick={() => handleTeamFieldChange('logo', '')}
                        className="ml-auto text-xs text-red-400 hover:text-red-300"
                      >
                        Verwijder
                      </button>
                    </div>
                  )}
                </div>
                <Field
                  label="Coach"
                  value={editingTeamDraft.coach ?? ''}
                  onChange={(value) => handleTeamFieldChange('coach', value)}
                />
                <Field
                  label="Twitch Link"
                  value={editingTeamDraft.twitchLink ?? ''}
                  placeholder="https://twitch.tv/..."
                  onChange={(value) => handleTeamFieldChange('twitchLink', value)}
                />
                <div>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                      Branding Logo
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={editBrandingLogoFileInputRef}
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'brandingLogo', true);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editBrandingLogoFileInputRef.current?.click()}
                        disabled={uploadingEditBrandingLogo}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingEditBrandingLogo ? 'Bezig...' : 'Upload branding'}
                      </button>
                    </div>
                    <Field
                      label="Of branding logo URL"
                      value={editingTeamDraft.brandingLogo ?? ''}
                      placeholder="https://..."
                      onChange={(value) => handleTeamFieldChange('brandingLogo', value)}
                    />
                  </label>
                  {editingTeamDraft.brandingLogo && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <Image
                        src={editingTeamDraft.brandingLogo}
                        alt="Branding logo preview"
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 rounded-lg object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-white/60">Branding logo preview</span>
                      <button
                        type="button"
                        onClick={() => handleTeamFieldChange('brandingLogo', '')}
                        className="ml-auto text-xs text-red-400 hover:text-red-300"
                      >
                        Verwijder
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Field
                label="Teammotto"
                value={editingTeamDraft.motto ?? ''}
                onChange={(value) => handleTeamFieldChange('motto', value)}
              />

              {/* Players Section */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Spelers
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      Roster ({(editingTeamDraft.players ?? []).length})
                    </h3>
                  </div>
                  <button
                    onClick={handleAddPlayer}
                    className="rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/40"
                  >
                    Voeg speler toe
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {(editingTeamDraft.players ?? []).map((player) => (
                    <div
                      key={player.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {player.name}
                        </p>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-xs uppercase tracking-widest text-white/50 hover:text-red-300"
                        >
                          Verwijder
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Field
                          label="Naam"
                          value={player.name}
                          onChange={handlePlayerFieldChange(player.id, 'name')}
                        />
                        <Field
                          label="Rol"
                          value={player.role ?? ''}
                          placeholder="Captain / Support"
                          onChange={handlePlayerFieldChange(player.id, 'role')}
                        />
                        <Field
                          label="Rugnummer"
                          value={player.number ?? ''}
                          onChange={handlePlayerFieldChange(player.id, 'number')}
                        />
                        <Field
                          label="Landcode"
                          value={player.countryCode ?? ''}
                          onChange={handlePlayerFieldChange(player.id, 'countryCode')}
                        />
                      </div>
                    </div>
                  ))}
                  {(editingTeamDraft.players ?? []).length === 0 && (
                    <p className="text-sm text-white/60">
                      Nog geen spelers toegevoegd aan dit team.
                    </p>
                  )}
                </div>
              </div>

              {teamMatchesForEditingTeam.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Wedstrijden van dit team
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      Matchplanning ({teamMatchesForEditingTeam.length})
                    </h3>
                    <p className="text-xs text-white/60">
                      Pas starttijd, locatie en matchdetails per match aan.
                    </p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {teamMatchesForEditingTeam.map(({ match, bracketName, roundName }) => (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between text-xs text-white/60">
                          <span>
                            {bracketName} · {roundName}
                          </span>
                          <span className="font-mono text-white/70">{match.id.toUpperCase()}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {match.teams[0]?.name ?? 'TBD'}{' '}
                          <span className="text-white/50">vs</span> {match.teams[1]?.name ?? 'TBD'}
                        </p>
                        <div className="mt-3 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field
                              label="Starttijd"
                              value={match.startTime ?? ''}
                              placeholder="14:30"
                              onChange={handleTeamMatchMetaChange(match.id, 'startTime')}
                            />
                            <Field
                              label="Locatie"
                              value={match.court ?? ''}
                              placeholder="Main Arena"
                              onChange={handleTeamMatchMetaChange(match.id, 'court')}
                            />
                          </div>
                          <Field
                            label="Titel"
                            value={match.details?.title ?? ''}
                            onChange={(value) => {
                              updateMatchDetails(match.id, {
                                details: {
                                  title: value,
                                },
                              });
                            }}
                          />
                          <Field
                            label="Subtitel"
                            value={match.details?.subtitle ?? ''}
                            onChange={(value) => {
                              updateMatchDetails(match.id, {
                                details: {
                                  subtitle: value,
                                },
                              });
                            }}
                          />
                          <TextAreaField
                            label="Beschrijving"
                            value={match.details?.description ?? ''}
                            onChange={(value) => {
                              updateMatchDetails(match.id, {
                                details: {
                                  description: value,
                                },
                              });
                            }}
                          />
                          <Field
                            label="Schema notitie"
                            value={match.details?.scheduleNote ?? ''}
                            onChange={(value) => {
                              updateMatchDetails(match.id, {
                                details: {
                                  scheduleNote: value,
                                },
                              });
                            }}
                          />
                          <Field
                            label="Prijzengeld"
                            value={match.details?.prizeInfo ?? ''}
                            onChange={(value) => {
                              updateMatchDetails(match.id, {
                                details: {
                                  prizeInfo: value,
                                },
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  onClick={handleSaveEditedTeam}
                  className="rounded-full border border-emerald-400/50 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/10"
                >
                  Opslaan
                </button>
                <button
                  onClick={closeTeamModal}
                  className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'color';
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-xs uppercase tracking-[0.35em] text-white/50">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition focus:border-white/40"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-xs uppercase tracking-[0.35em] text-white/50">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition focus:border-white/40"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-xs uppercase tracking-[0.35em] text-white/50">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white outline-none transition focus:border-white/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-black text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPickerField({
  label,
  value,
  onChange,
  description,
  allSettings,
  currentKey,
}: {
  label: string;
  value: string;
  description?: string;
  onChange: (value: string) => void;
  allSettings: BracketSettings;
  currentKey: 'primaryColor' | 'secondaryColor' | 'backgroundColor';
}) {
  const sanitizedValue = normalizeHex(value, '#000000');
  
  // Check contrast issues
  const contrastIssues = useMemo(() => {
    const issues: Array<{ message: string; severity: 'warning' | 'error' }> = [];
    const normalizedCurrent = normalizeHex(value, '#000000');
    
    if (currentKey === 'primaryColor') {
      const bgContrast = getContrastRatio(normalizedCurrent, normalizeHex(allSettings.backgroundColor, '#111827'));
      if (bgContrast < 3) {
        issues.push({
          message: `Lage contrast met achtergrond (${bgContrast.toFixed(2)}:1). Tekst kan moeilijk leesbaar zijn.`,
          severity: bgContrast < 2 ? 'error' : 'warning',
        });
      }
      const secondaryContrast = getContrastRatio(normalizedCurrent, normalizeHex(allSettings.secondaryColor, '#420AB2'));
      if (secondaryContrast < 2) {
        issues.push({
          message: `Primaire en secundaire kleur zijn te vergelijkbaar (${secondaryContrast.toFixed(2)}:1). Ze kunnen niet goed onderscheiden worden.`,
          severity: 'warning',
        });
      }
    }
    
    if (currentKey === 'secondaryColor') {
      const bgContrast = getContrastRatio(normalizedCurrent, normalizeHex(allSettings.backgroundColor, '#111827'));
      if (bgContrast < 3) {
        issues.push({
          message: `Lage contrast met achtergrond (${bgContrast.toFixed(2)}:1). Tekst kan moeilijk leesbaar zijn.`,
          severity: bgContrast < 2 ? 'error' : 'warning',
        });
      }
      const primaryContrast = getContrastRatio(normalizedCurrent, normalizeHex(allSettings.primaryColor, '#482CFF'));
      if (primaryContrast < 2) {
        issues.push({
          message: `Secundaire en primaire kleur zijn te vergelijkbaar (${primaryContrast.toFixed(2)}:1). Ze kunnen niet goed onderscheiden worden.`,
          severity: 'warning',
        });
      }
    }
    
    if (currentKey === 'backgroundColor') {
      const primaryContrast = getContrastRatio(normalizeHex(allSettings.primaryColor, '#482CFF'), normalizedCurrent);
      if (primaryContrast < 3) {
        issues.push({
          message: `Primaire kleur heeft lage contrast met achtergrond (${primaryContrast.toFixed(2)}:1). Tekst kan moeilijk leesbaar zijn.`,
          severity: primaryContrast < 2 ? 'error' : 'warning',
        });
      }
      const secondaryContrast = getContrastRatio(normalizeHex(allSettings.secondaryColor, '#420AB2'), normalizedCurrent);
      if (secondaryContrast < 3) {
        issues.push({
          message: `Secundaire kleur heeft lage contrast met achtergrond (${secondaryContrast.toFixed(2)}:1). Tekst kan moeilijk leesbaar zijn.`,
          severity: secondaryContrast < 2 ? 'error' : 'warning',
        });
      }
    }
    
    return issues;
  }, [value, allSettings, currentKey]);

  const handleInput = (nextValue: string) => {
    const formatted = nextValue.startsWith('#') ? nextValue : `#${nextValue}`;
    onChange(formatted.slice(0, 7));
  };

  const hasIssues = contrastIssues.length > 0;
  const hasErrors = contrastIssues.some(issue => issue.severity === 'error');

  return (
    <div className={`rounded-2xl border p-4 text-sm transition ${
      hasErrors 
        ? 'border-red-400/60 bg-red-500/10' 
        : hasIssues 
        ? 'border-yellow-400/60 bg-yellow-500/10' 
        : 'border-white/10 bg-black/30'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
          {description && <p className="text-[11px] text-white/50">{description}</p>}
        </div>
        <span className="font-mono text-xs text-white/70">{sanitizedValue.toUpperCase()}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={sanitizedValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent p-0"
          aria-label={`${label} kleur selectie`}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => handleInput(event.target.value)}
          className={`flex-1 rounded-xl border px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-white outline-none transition ${
            hasErrors
              ? 'border-red-400/60 bg-red-500/20 focus:border-red-400'
              : hasIssues
              ? 'border-yellow-400/60 bg-yellow-500/20 focus:border-yellow-400'
              : 'border-white/10 bg-black/40 focus:border-white/40'
          }`}
          placeholder="#000000"
        />
        <div
          className="h-12 w-12 rounded-xl border border-white/10"
          style={{
            background: sanitizedValue,
          }}
          aria-hidden="true"
        />
      </div>
      
      {hasIssues && (
        <div className="mt-3 space-y-2">
          {contrastIssues.map((issue, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                issue.severity === 'error'
                  ? 'border-red-400/40 bg-red-500/20 text-red-200'
                  : 'border-yellow-400/40 bg-yellow-500/20 text-yellow-200'
              }`}
            >
              <svg
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  issue.severity === 'error' ? 'text-red-300' : 'text-yellow-300'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {issue.severity === 'error' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
              <span className="flex-1">{issue.message}</span>
            </div>
          ))}
          <div className="text-[11px] text-white/50 mt-2">
            <strong>Tip:</strong> Voor goede leesbaarheid is een contrastratio van minimaal 4.5:1 aanbevolen (WCAG AA), en 7:1 voor optimale toegankelijkheid (WCAG AAA).
          </div>
        </div>
      )}
      
      {!hasIssues && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400/80">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Goede contrastverhouding met andere kleuren</span>
        </div>
      )}
    </div>
  );
}


