'use client';

import Link from 'next/link';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team, BracketType, Match } from '@/app/types/bracket';
import { useEffect, useMemo, useState } from 'react';
import {
  getContrastRatio,
  getReadableTextColor,
  isValidHexColor,
  normalizeHex,
} from '@/app/utils/colorUtils';

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
  const [matchOverviewSearch, setMatchOverviewSearch] = useState('');
  const [matchOverviewRoundFilter, setMatchOverviewRoundFilter] = useState<string>('all');
  const colorDiagnostics = useMemo(() => {
    type ColorKey = 'primaryColor' | 'secondaryColor' | 'backgroundColor';
    const MIN_TEXT_CONTRAST = 4.5;
    const normalized: Record<ColorKey, string> = {
      primaryColor: normalizeHex(settings.primaryColor ?? '#482cff', '#482cff'),
      secondaryColor: normalizeHex(settings.secondaryColor ?? '#420ab2', '#420ab2'),
      backgroundColor: normalizeHex(settings.backgroundColor ?? '#111827', '#111827'),
    };

    const diagnostics: Record<
      ColorKey,
      {
        normalizedValue: string;
        warnings: string[];
        contrastLabel?: string;
        recommendedTextColor: string;
        isValid: boolean;
      }
    > = {
      primaryColor: {
        normalizedValue: normalized.primaryColor,
        warnings: [],
        recommendedTextColor: getReadableTextColor(normalized.primaryColor),
        isValid: isValidHexColor(settings.primaryColor),
      },
      secondaryColor: {
        normalizedValue: normalized.secondaryColor,
        warnings: [],
        recommendedTextColor: getReadableTextColor(normalized.secondaryColor),
        isValid: isValidHexColor(settings.secondaryColor),
      },
      backgroundColor: {
        normalizedValue: normalized.backgroundColor,
        warnings: [],
        recommendedTextColor: getReadableTextColor(normalized.backgroundColor),
        isValid: isValidHexColor(settings.backgroundColor),
      },
    };

    const addWarning = (key: ColorKey, warning: string) => {
      diagnostics[key].warnings.push(warning);
    };

    const registerContrast = (foreground: ColorKey, background: ColorKey, label: string) => {
      const ratio = getContrastRatio(
        diagnostics[foreground].normalizedValue,
        diagnostics[background].normalizedValue
      );
      diagnostics[foreground].contrastLabel = `${label}: ${ratio}:1`;
      if (ratio < MIN_TEXT_CONTRAST) {
        addWarning(
          foreground,
          `Contrast met ${label.toLowerCase()} is te laag (${ratio}:1). Kies een donkerder of lichtere kleur voor betere leesbaarheid.`
        );
      }
    };

    registerContrast('primaryColor', 'backgroundColor', 'Contrast met achtergrond');
    registerContrast('secondaryColor', 'backgroundColor', 'Contrast met achtergrond');

    const backgroundVsWhite = getContrastRatio(
      diagnostics.backgroundColor.normalizedValue,
      '#ffffff'
    );
    diagnostics.backgroundColor.contrastLabel = `Contrast met #FFFFFF: ${backgroundVsWhite}:1`;
    if (backgroundVsWhite < MIN_TEXT_CONTRAST) {
      addWarning(
        'backgroundColor',
        `De achtergrondkleur heeft onvoldoende contrast met witte tekst (${backgroundVsWhite}:1). Kies een donkerdere tint voor betere leesbaarheid.`
      );
    }

    return diagnostics;
  }, [settings.primaryColor, settings.secondaryColor, settings.backgroundColor]);

  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    } else if (selectedTeamId && !teams.find((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? null);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!selectedBracketId && brackets.length > 0) {
      setSelectedBracketId(brackets[0].id);
    } else if (
      selectedBracketId &&
      !brackets.find((bracket) => bracket.id === selectedBracketId)
    ) {
      setSelectedBracketId(brackets[0]?.id ?? null);
    }
  }, [brackets, selectedBracketId]);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const selectedBracket =
    brackets.find((bracket) => bracket.id === selectedBracketId) ?? brackets[0];

  useEffect(() => {
    if (!selectedBracket) return;
    if (selectedRoundIndex >= selectedBracket.rounds.length) {
      setSelectedRoundIndex(0);
    }
  }, [selectedBracket, selectedRoundIndex]);

  const selectedRound = selectedBracket?.rounds[selectedRoundIndex];

  useEffect(() => {
    if (!selectedRound) {
      setSelectedMatchId(null);
      return;
    }
    if (
      selectedMatchId &&
      !selectedRound.matches.find((match) => match.id === selectedMatchId)
    ) {
      setSelectedMatchId(selectedRound.matches[0]?.id ?? null);
    } else if (!selectedMatchId && selectedRound.matches.length > 0) {
      setSelectedMatchId(selectedRound.matches[0].id);
    }
  }, [selectedRound, selectedMatchId]);

  const selectedMatch = selectedMatchId
    ? getMatchById(selectedMatchId)
    : undefined;

  const editingTeam = teams.find((team) => team.id === editingTeamId);

  const handleTeamFieldChange = (field: keyof Team, value: string) => {
    setEditingTeamDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value === '' ? undefined : value,
      };
    });
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
        setIsTeamModalOpen(false);
        setEditingTeamId(null);
      }
    }
  };

  const handleMatchFieldChange = (field: 'startTime' | 'court', value: string) => {
    if (!selectedMatchId) return;
    updateMatchDetails(selectedMatchId, { [field]: value });
  };

  const handleScoreInputChange = (teamIndex: number) => (value: string) => {
    if (!selectedMatchId) return;
    const parsed = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setTeamScore(selectedMatchId, teamIndex, parsed);
  };

  const handleWinnerSelect = (teamIndex: number) => () => {
    if (!selectedMatchId || !selectedMatch?.teams[teamIndex]) return;
    setWinner(selectedMatchId, teamIndex);
  };

  const handleTeamAssignment = (teamIndex: number) => (value: string) => {
    if (!selectedMatchId) return;
    const normalized = value === '' ? null : value;
    const otherIndex = teamIndex === 0 ? 1 : 0;
    const otherTeamId = selectedMatch?.teams[otherIndex]?.id ?? null;

    if (normalized && normalized === otherTeamId) {
      setTeamSelectionError('Een team kan niet tegen zichzelf spelen. Kies een ander team voor deze slot.');
      return;
    }

    setTeamSelectionError(null);
    setMatchTeam(selectedMatchId, teamIndex, normalized);
  };

  useEffect(() => {
    if (!selectedMatch) {
      setTeamSelectionError(null);
      return;
    }
    const [teamA, teamB] = selectedMatch.teams;
    if (teamA?.id && teamB?.id && teamA.id === teamB.id) {
      setTeamSelectionError('Deze match bevat twee keer hetzelfde team. Kies een ander team voor een van de slots.');
    } else {
      setTeamSelectionError(null);
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (editingTeam) {
      setEditingTeamDraft({
        ...editingTeam,
        players: editingTeam.players
          ? editingTeam.players.map((player) => ({ ...player }))
          : [],
      });
    } else {
      setEditingTeamDraft(null);
    }
  }, [editingTeam]);

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
  const handleTeamMatchDetailChange =
    (
      matchId: string,
      field: 'title' | 'subtitle' | 'description' | 'scheduleNote' | 'prizeInfo'
    ) =>
    (value: string) => {
      updateMatchDetails(matchId, {
        details: {
          [field]: value === '' ? undefined : value,
        },
      });
    };
  const handleLogoFileUpload = (file: File, onSuccess: (value: string) => void, onError?: (error: string) => void) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Upload een geldig afbeeldingstype (PNG, JPG, SVG, ...).';
      alert(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Check file size (max 5MB voor data URL)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = `Bestand is te groot (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum is 5MB. Comprimeer de afbeelding of gebruik een kleinere versie.`;
      alert(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const reader = new FileReader();
    
    // Error handler
    reader.onerror = () => {
      const errorMsg = 'Fout bij het lezen van het bestand. Probeer een ander bestand.';
      console.error('FileReader error:', reader.error);
      alert(errorMsg);
      onError?.(errorMsg);
    };

    // Success handler
    reader.onloadend = () => {
      try {
        const result = typeof reader.result === 'string' ? reader.result : null;
        if (result) {
          // Check if result is not too large (PostgreSQL TEXT can handle large strings, but let's be safe)
          if (result.length > 10 * 1024 * 1024) { // 10MB string limit
            const errorMsg = 'Afbeelding is te groot na conversie. Gebruik een kleinere afbeelding.';
            alert(errorMsg);
            onError?.(errorMsg);
            return;
          }
          onSuccess(result);
        } else {
          const errorMsg = 'Kon bestand niet lezen. Probeer opnieuw.';
          alert(errorMsg);
          onError?.(errorMsg);
        }
      } catch (error: unknown) {
        const errorMsg = `Fout bij verwerken van afbeelding: ${error instanceof Error ? error.message : 'Onbekende fout'}`;
        console.error('Error processing file:', error);
        alert(errorMsg);
        onError?.(errorMsg);
      }
    };

    // Start reading
    try {
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      const errorMsg = `Fout bij starten van bestand lezen: ${error instanceof Error ? error.message : 'Onbekende fout'}`;
      console.error('Error starting file read:', error);
      alert(errorMsg);
      onError?.(errorMsg);
    }
  };

  const matchOverviewEntries = useMemo(() => {
    return brackets.flatMap((bracket) =>
      bracket.rounds.flatMap((round, roundIndex) =>
        round.matches.map((match, matchIndex) => ({
          bracketId: bracket.id,
          bracketName: bracket.name,
          roundIndex,
          roundName: round.name,
          matchIndex,
          match,
        }))
      )
    );
  }, [brackets]);

  const filteredMatchOverview = useMemo(() => {
    const trimmedSearch = matchOverviewSearch.trim().toLowerCase();
    return matchOverviewEntries.filter(({ roundName, roundIndex, bracketId, match, bracketName }) => {
      if (matchOverviewRoundFilter !== 'all') {
        const { bracketId: filterBracketId, roundIndex: filterRoundIndex } = JSON.parse(
          matchOverviewRoundFilter
        ) as { bracketId: string; roundIndex: number };
        if (bracketId !== filterBracketId || roundIndex !== filterRoundIndex) {
          return false;
        }
      }

      if (!trimmedSearch) return true;

      const teamNames = match.teams
        .map((team) => team?.name ?? 'TBD')
        .join(' ')
        .toLowerCase();

      return (
        bracketName.toLowerCase().includes(trimmedSearch) ||
        roundName.toLowerCase().includes(trimmedSearch) ||
        teamNames.includes(trimmedSearch) ||
        match.id.toLowerCase().includes(trimmedSearch)
      );
    });
  }, [matchOverviewEntries, matchOverviewRoundFilter, matchOverviewSearch]);

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

    const { id: _ignoredId, players: _ignoredPlayers, ...rest } = editingTeamDraft;
    updateTeam(editingTeam.id, {
      ...rest,
      name,
      players: sanitizedPlayers,
    });
    setIsTeamModalOpen(false);
    setEditingTeamId(null);
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
                  warnings={colorDiagnostics[colorSetting.key].warnings}
                  contrastLabel={colorDiagnostics[colorSetting.key].contrastLabel}
                  recommendedTextColor={colorDiagnostics[colorSetting.key].recommendedTextColor}
                  isValid={colorDiagnostics[colorSetting.key].isValid}
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
                      setEditingTeamId(team.id);
                      setIsTeamModalOpen(true);
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
            <br />
            Gedetailleerde wedstrijdteksten beheer je nu via het teambeheer (open een team en scroll naar “Wedstrijden van dit team”).
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Bracket"
              value={selectedBracket?.id ?? ''}
              onChange={(value) => setSelectedBracketId(value)}
              options={brackets.map((bracket) => ({
                label: bracket.name,
                value: bracket.id,
              }))}
            />
            <SelectField
              label="Ronde"
              value={selectedRoundIndex.toString()}
              onChange={(value) => setSelectedRoundIndex(Number(value))}
              options={(selectedBracket?.rounds ?? []).map((round, index) => ({
                label: round.name,
                value: index.toString(),
              }))}
            />
            <SelectField
              label="Match"
              value={selectedMatchId ?? ''}
              onChange={(value) => setSelectedMatchId(value)}
              options={(selectedRound?.matches ?? []).map((match) => ({
                label: `${match.id.toUpperCase()}`,
                value: match.id,
              }))}
            />
          </div>

          {teamSelectionError && (
            <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {teamSelectionError}
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
                              <img
                                src={team.logo}
                                alt={team.name}
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

        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Overzicht
              </p>
              <h2 className="text-2xl font-semibold text-white">Match overzicht</h2>
              <p className="text-xs text-white/60 mt-1">
                Bekijk alle wedstrijden in één oogopslag en pas starttijd of locatie direct aan.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <select
                value={matchOverviewRoundFilter}
                onChange={(event) => setMatchOverviewRoundFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none transition focus:border-white/40"
              >
                <option value="all">Alle rondes</option>
                {brackets.flatMap((bracket) =>
                  bracket.rounds.map((round, roundIndex) => {
                    const key = JSON.stringify({
                      bracketId: bracket.id,
                      roundIndex,
                    });
                    return (
                      <option key={`${bracket.id}-${roundIndex}`} value={key}>
                        {bracket.name} · {round.name}
                      </option>
                    );
                  })
                )}
              </select>
              <input
                type="text"
                value={matchOverviewSearch}
                onChange={(event) => setMatchOverviewSearch(event.target.value)}
                placeholder="Zoek op teams, ronde of match ID..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none transition focus:border-white/40 sm:w-64"
              />
            </div>
          </div>

          <div className="mt-4 max-h-[420px] overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left">Bracket / Ronde</th>
                    <th className="px-4 py-3 text-left">Match</th>
                    <th className="px-4 py-3 text-left">Teams</th>
                    <th className="px-4 py-3 text-left">Starttijd</th>
                    <th className="px-4 py-3 text-left">Locatie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredMatchOverview.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-white/50">
                        Geen wedstrijden gevonden voor deze zoekopdracht.
                      </td>
                    </tr>
                  )}
                  {filteredMatchOverview.map(({ bracketId, bracketName, roundName, roundIndex, match }) => {
                    const teamsLabel = `${match.teams[0]?.name ?? 'TBD'} vs ${
                      match.teams[1]?.name ?? 'TBD'
                    }`;
                    return (
                      <tr key={`overview-${match.id}`}>
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-white">{bracketName}</p>
                          <p className="text-xs text-white/50">{roundName}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-mono text-xs text-white/60">{match.id.toUpperCase()}</p>
                          {match.details?.title && (
                            <p className="text-xs text-white/50 mt-1">{match.details.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="text-white">{teamsLabel}</p>
                          {match.details?.subtitle && (
                            <p className="text-xs text-white/50 mt-1">{match.details.subtitle}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            value={match.startTime ?? ''}
                            onChange={(event) =>
                              handleTeamMatchMetaChange(match.id, 'startTime')(event.target.value)
                            }
                            placeholder="14:30"
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-white/40"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            value={match.court ?? ''}
                            onChange={(event) =>
                              handleTeamMatchMetaChange(match.id, 'court')(event.target.value)
                            }
                            placeholder="Main Arena"
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-white/40"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
                <Field
                  label="Logo URL"
                  value={newTeamForm.logo ?? ''}
                  placeholder="https://..."
                  onChange={(value) => setNewTeamForm({ ...newTeamForm, logo: value })}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="relative cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition hover:border-white/40 hover:text-white">
                    Upload bestand
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        handleLogoFileUpload(
                          file,
                          (value) => setNewTeamForm((prev) => ({ ...prev, logo: value })),
                          (error) => console.error('Logo upload error:', error)
                        );
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-white/50">
                    Ondersteunt PNG, JPG, SVG; wordt lokaal als data-URL opgeslagen.
                  </span>
                </div>
                {newTeamForm.logo && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={newTeamForm.logo}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-lg object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-white/60">Logo preview</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewTeamForm((prev) => ({ ...prev, logo: '' }))}
                      className="rounded-full border border-red-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-200 transition hover:border-red-200 hover:bg-red-500/10"
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
              <Field
                label="Branding Logo URL"
                value={newTeamForm.brandingLogo ?? ''}
                placeholder="https://..."
                onChange={(value) => setNewTeamForm({ ...newTeamForm, brandingLogo: value })}
              />
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
          onClick={() => {
            setIsTeamModalOpen(false);
            setEditingTeamId(null);
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#030712] via-[#0f172a] to-[#020617] p-6 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsTeamModalOpen(false);
                setEditingTeamId(null);
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
                    setIsTeamModalOpen(false);
                    setEditingTeamId(null);
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
                  <Field
                    label="Logo URL"
                    value={editingTeamDraft.logo ?? ''}
                    placeholder="https://..."
                    onChange={(value) => handleTeamFieldChange('logo', value)}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="relative cursor-pointer rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition hover:border-white/40 hover:text-white">
                      Upload bestand
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          handleLogoFileUpload(
                            file,
                            (value) => handleTeamFieldChange('logo', value),
                            (error) => console.error('Logo upload error:', error)
                          );
                          event.target.value = '';
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-white/50">
                      Ondersteunt PNG, JPG, SVG; wordt lokaal als data-URL opgeslagen.
                    </span>
                  </div>
                  {editingTeamDraft.logo && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={editingTeamDraft.logo}
                          alt="Logo preview"
                          className="h-12 w-12 rounded-lg object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-xs text-white/60">Logo preview</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTeamFieldChange('logo', '')}
                        className="rounded-full border border-red-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-200 transition hover:border-red-200 hover:bg-red-500/10"
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
                <Field
                  label="Branding Logo URL"
                  value={editingTeamDraft.brandingLogo ?? ''}
                  placeholder="https://..."
                  onChange={(value) => handleTeamFieldChange('brandingLogo', value)}
                />
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
                      Pas starttijd en locatie per match aan zonder het matchbeheer te openen.
                    </p>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
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
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <Field
                            label="Match titel"
                            value={match.details?.title ?? ''}
                            placeholder="Bijv. Clash of Titans"
                            onChange={handleTeamMatchDetailChange(match.id, 'title')}
                          />
                          <Field
                            label="Subtitel"
                            value={match.details?.subtitle ?? ''}
                            placeholder="Extra context"
                            onChange={handleTeamMatchDetailChange(match.id, 'subtitle')}
                          />
                        </div>
                        <TextAreaField
                          label="Beschrijving"
                          value={match.details?.description ?? ''}
                          onChange={handleTeamMatchDetailChange(match.id, 'description')}
                          placeholder="Korte wedstrijdtekst..."
                        />
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <Field
                            label="Schema notitie"
                            value={match.details?.scheduleNote ?? ''}
                            placeholder="Bijv. Check-in 15 min eerder"
                            onChange={handleTeamMatchDetailChange(match.id, 'scheduleNote')}
                          />
                          <Field
                            label="Prijzengeld"
                            value={match.details?.prizeInfo ?? ''}
                            placeholder="Bijv. €1.000 + trofee"
                            onChange={handleTeamMatchDetailChange(match.id, 'prizeInfo')}
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
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setEditingTeamId(null);
                  }}
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
  warnings = [],
  contrastLabel,
  recommendedTextColor,
  isValid = true,
}: {
  label: string;
  value: string;
  description?: string;
  onChange: (value: string) => void;
  warnings?: string[];
  contrastLabel?: string;
  recommendedTextColor?: string;
  isValid?: boolean;
}) {
  const sanitizedValue = normalizeHex(value, '#000000');
  const previewTextColor = recommendedTextColor ?? getReadableTextColor(sanitizedValue);

  const handleInput = (nextValue: string) => {
    const formatted = nextValue.startsWith('#') ? nextValue : `#${nextValue}`;
    onChange(formatted.slice(0, 7));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>
          {description && <p className="text-[11px] text-white/50">{description}</p>}
          {contrastLabel && (
            <p className="text-[11px] text-white/40 mt-1">{contrastLabel}</p>
          )}
        </div>
        <span className="font-mono text-xs text-white/70">{sanitizedValue.toUpperCase()}</span>
      </div>
      {(!isValid || warnings.length > 0) && (
        <div className="mt-3 space-y-2">
          {!isValid && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              Voer een geldige hex kleur in (bijv. #AABBCC).
            </p>
          )}
          {warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
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
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-white outline-none transition focus:border-white/40"
          placeholder="#000000"
        />
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl border border-white/10"
            style={{
              background: sanitizedValue,
            }}
            aria-hidden="true"
          />
          <div
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: sanitizedValue,
              color: previewTextColor,
            }}
          >
            Voorbeeld
          </div>
        </div>
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-white/40">
        Aanbevolen tekstkleur: {previewTextColor.toUpperCase()}
      </p>
    </div>
  );
}


