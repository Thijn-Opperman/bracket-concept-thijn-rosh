'use client';

import Link from 'next/link';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team, BracketType } from '@/app/types/bracket';
import { useEffect, useState } from 'react';

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
    isAdminMode,
    setAdminMode,
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
  const [teamSearchTerm, setTeamSearchTerm] = useState('');

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
    if (!editingTeam) return;
    updateTeam(editingTeam.id, { [field]: value || undefined });
  };

  const handleAddPlayer = () => {
    if (!editingTeam) return;
    const players = editingTeam.players ?? [];
    const newPlayer = {
      id: `${editingTeam.id}-player-${Date.now()}`,
      name: `Speler ${players.length + 1}`,
      role: 'Starter',
    };
    updateTeam(editingTeam.id, { players: [...players, newPlayer] });
  };

  const handlePlayerFieldChange = (
    playerId: string,
    field: 'name' | 'role' | 'number' | 'countryCode'
  ) => (value: string) => {
    if (!editingTeam) return;
    const players = (editingTeam.players ?? []).map((player) =>
      player.id === playerId ? { ...player, [field]: value } : player
    );
    updateTeam(editingTeam.id, { players });
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!editingTeam) return;
    const players = (editingTeam.players ?? []).filter((player) => player.id !== playerId);
    updateTeam(editingTeam.id, { players });
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

  const handleMatchDetailChange = (
    field: 'title' | 'subtitle' | 'description' | 'scheduleNote' | 'prizeInfo',
    value: string
  ) => {
    if (!selectedMatchId) return;
    updateMatchDetails(selectedMatchId, {
      details: {
        [field]: value,
      },
    });
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

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Admin modus
              </p>
              <p className="text-base font-semibold text-white">
                {isAdminMode ? 'Live bewerken ingeschakeld' : 'Alleen lezen'}
              </p>
            </div>
            <button
              onClick={() => setAdminMode(!isAdminMode)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                isAdminMode
                  ? 'border-amber-400/60 text-amber-200 hover:border-amber-200 hover:bg-amber-400/10'
                  : 'border-emerald-400/60 text-emerald-200 hover:border-emerald-200 hover:bg-emerald-400/10'
              }`}
            >
              {isAdminMode ? 'Schakel uit' : 'Activeer bewerken'}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/60">
            Wanneer deze stand actief is kun je in de hoofd-bracket teams aanklikken om scores
            en winnaars in te vullen. Zet hem weer uit wanneer je klaar bent.
          </p>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 lg:flex-row">
        {/* Left column: Bracket type selector and team creation */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">
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
            </div>
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
                        onChange={(value) => {
                          setMatchTeam(selectedMatch.id, index, value === '' ? null : value);
                        }}
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
                      <>
                        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div>
                            {team.logo && (
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="mb-2 h-12 w-12 rounded-lg object-contain"
                              />
                            )}
                            <p className="text-sm font-semibold text-white">{team.name}</p>
                            {team.countryCode && (
                              <p className="text-xs text-white/60">{team.countryCode}</p>
                            )}
                          </div>
                          {selectedMatch.winnerIndex === index && (
                            <span className="rounded-full border border-emerald-400/50 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                              Winnaar
                            </span>
                          )}
                        </div>

                        <div className="mt-4 space-y-3">
                          <Field
                            label="Score"
                            value={team.score?.toString() ?? ''}
                            placeholder="0"
                            type="number"
                            onChange={handleScoreInputChange(index)}
                          />
                          <button
                            type="button"
                            onClick={handleWinnerSelect(index)}
                            className={`w-full rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                              selectedMatch.winnerIndex === index
                                ? 'border-emerald-400 text-emerald-100 bg-emerald-400/20 cursor-default'
                                : 'border-emerald-400/50 text-emerald-200 hover:border-emerald-200 hover:bg-emerald-400/10'
                            }`}
                          >
                            {selectedMatch.winnerIndex === index
                              ? 'Reeds winnaar'
                              : 'Markeer als winnaar'}
                          </button>
                          {team.twitchLink && (
                            <a
                              href={team.twitchLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-2 rounded-full border border-purple-400/50 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-purple-200 transition hover:border-purple-200 hover:bg-purple-400/10"
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
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Starttijd"
                  value={selectedMatch.startTime ?? ''}
                  placeholder="14:30"
                  onChange={(value) => handleMatchFieldChange('startTime', value)}
                />
                <Field
                  label="Locatie"
                  value={selectedMatch.court ?? ''}
                  placeholder="Main Arena"
                  onChange={(value) => handleMatchFieldChange('court', value)}
                />
              </div>

              <Field
                label="Titel"
                value={selectedMatch.details?.title ?? ''}
                onChange={(value) => handleMatchDetailChange('title', value)}
              />
              <Field
                label="Subtitel"
                value={selectedMatch.details?.subtitle ?? ''}
                onChange={(value) => handleMatchDetailChange('subtitle', value)}
              />
              <TextAreaField
                label="Beschrijving"
                value={selectedMatch.details?.description ?? ''}
                onChange={(value) => handleMatchDetailChange('description', value)}
              />
              <Field
                label="Schema notitie"
                value={selectedMatch.details?.scheduleNote ?? ''}
                onChange={(value) => handleMatchDetailChange('scheduleNote', value)}
              />
              <Field
                label="Prijzengeld"
                value={selectedMatch.details?.prizeInfo ?? ''}
                onChange={(value) => handleMatchDetailChange('prizeInfo', value)}
              />
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
                <Field
                  label="Logo URL"
                  value={newTeamForm.logo ?? ''}
                  placeholder="https://..."
                  onChange={(value) => setNewTeamForm({ ...newTeamForm, logo: value })}
                />
                {newTeamForm.logo && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
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
      {isTeamModalOpen && editingTeam && (
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
                <h2 className="text-2xl font-semibold text-white">{editingTeam.name}</h2>
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
                  value={editingTeam.name}
                  onChange={(value) => handleTeamFieldChange('name', value)}
                />
                <Field
                  label="Landcode"
                  value={editingTeam.countryCode ?? ''}
                  placeholder="NL"
                  onChange={(value) => handleTeamFieldChange('countryCode', value)}
                />
                <div>
                  <Field
                    label="Logo URL"
                    value={editingTeam.logo ?? ''}
                    placeholder="https://..."
                    onChange={(value) => handleTeamFieldChange('logo', value)}
                  />
                  {editingTeam.logo && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                      <img
                        src={editingTeam.logo}
                        alt="Logo preview"
                        className="h-12 w-12 rounded-lg object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-white/60">Logo preview</span>
                    </div>
                  )}
                </div>
                <Field
                  label="Coach"
                  value={editingTeam.coach ?? ''}
                  onChange={(value) => handleTeamFieldChange('coach', value)}
                />
                <Field
                  label="Twitch Link"
                  value={editingTeam.twitchLink ?? ''}
                  placeholder="https://twitch.tv/..."
                  onChange={(value) => handleTeamFieldChange('twitchLink', value)}
                />
                <Field
                  label="Branding Logo URL"
                  value={editingTeam.brandingLogo ?? ''}
                  placeholder="https://..."
                  onChange={(value) => handleTeamFieldChange('brandingLogo', value)}
                />
              </div>
              <Field
                label="Teammotto"
                value={editingTeam.motto ?? ''}
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
                      Roster ({(editingTeam.players ?? []).length})
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
                  {(editingTeam.players ?? []).map((player) => (
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
                  {(editingTeam.players ?? []).length === 0 && (
                    <p className="text-sm text-white/60">
                      Nog geen spelers toegevoegd aan dit team.
                    </p>
                  )}
                </div>
              </div>

              {/* Close button at bottom */}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setEditingTeamId(null);
                  }}
                  className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Sluiten
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
}: {
  label: string;
  value: string;
  description?: string;
  onChange: (value: string) => void;
}) {
  const sanitizedValue = /^#([0-9a-f]{3}){1,2}$/i.test(value) ? value : '#000000';

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
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm uppercase tracking-[0.2em] text-white outline-none transition focus:border-white/40"
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
    </div>
  );
}


