'use client';

import Link from 'next/link';
import { useBracketStore } from '@/app/store/bracketStore';
import type { Team } from '@/app/types/bracket';
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
    isAdminMode,
    setAdminMode,
    getMatchById,
  } = useBracketStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

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

  const handleTeamFieldChange = (field: keyof Team, value: string) => {
    if (!selectedTeam) return;
    updateTeam(selectedTeam.id, { [field]: value });
  };

  const handleAddPlayer = () => {
    if (!selectedTeam) return;
    const players = selectedTeam.players ?? [];
    const newPlayer = {
      id: `${selectedTeam.id}-player-${Date.now()}`,
      name: `Speler ${players.length + 1}`,
      role: 'Starter',
    };
    updateTeam(selectedTeam.id, { players: [...players, newPlayer] });
  };

  const handlePlayerFieldChange = (
    playerId: string,
    field: 'name' | 'role' | 'number' | 'countryCode'
  ) => (value: string) => {
    if (!selectedTeam) return;
    const players = (selectedTeam.players ?? []).map((player) =>
      player.id === playerId ? { ...player, [field]: value } : player
    );
    updateTeam(selectedTeam.id, { players });
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!selectedTeam) return;
    const players = (selectedTeam.players ?? []).filter((player) => player.id !== playerId);
    updateTeam(selectedTeam.id, { players });
  };

  const handleCreateTeam = () => {
    const id = `team-${Date.now()}`;
    addTeam({
      id,
      name: `Nieuw team ${teams.length + 1}`,
      countryCode: 'NL',
      motto: 'Nieuw team',
      players: [],
    });
    setSelectedTeamId(id);
  };

  const handleDeleteTeam = (teamId: string) => {
    removeTeam(teamId);
    if (selectedTeamId === teamId) {
      setSelectedTeamId(null);
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
        <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Teams
              </p>
              <h2 className="text-2xl font-semibold text-white">Teambeheer</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTeam}
                className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-400/10"
              >
                Nieuw team
              </button>
              {selectedTeam && (
                <button
                  onClick={() => handleDeleteTeam(selectedTeam.id)}
                  className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-300 transition hover:border-red-300 hover:bg-red-400/10"
                >
                  Verwijder
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedTeamId === team.id
                    ? 'border-white/60 bg-white/10 shadow-lg shadow-black/30'
                    : 'border-white/10 bg-black/20 hover:border-white/30'
                }`}
              >
                <p className="text-sm uppercase tracking-widest text-white/60">
                  {team.countryCode ?? 'N/A'}
                </p>
                <p className="text-lg font-semibold text-white">{team.name}</p>
                <p className="text-xs text-white/60">
                  {(team.players ?? []).length} spelers
                </p>
              </button>
            ))}
          </div>

          {selectedTeam ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Teamnaam"
                  value={selectedTeam.name}
                  onChange={(value) => handleTeamFieldChange('name', value)}
                />
                <Field
                  label="Landcode"
                  value={selectedTeam.countryCode ?? ''}
                  placeholder="NL"
                  onChange={(value) => handleTeamFieldChange('countryCode', value)}
                />
                <Field
                  label="Logo URL"
                  value={selectedTeam.logo ?? ''}
                  placeholder="https://..."
                  onChange={(value) => handleTeamFieldChange('logo', value)}
                />
                <Field
                  label="Coach"
                  value={selectedTeam.coach ?? ''}
                  onChange={(value) => handleTeamFieldChange('coach', value)}
                />
              </div>
              <Field
                label="Teammotto"
                value={selectedTeam.motto ?? ''}
                onChange={(value) => handleTeamFieldChange('motto', value)}
              />

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                      Spelers
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      Roster ({(selectedTeam.players ?? []).length})
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
                  {(selectedTeam.players ?? []).map((player) => (
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
                  {(selectedTeam.players ?? []).length === 0 && (
                    <p className="text-sm text-white/60">
                      Nog geen spelers toegevoegd aan dit team.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/60">
              Selecteer een team om details te bewerken.
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
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  Deelnemers
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {selectedMatch.teams.map((team, index) => (
                    <div
                      key={`${selectedMatch.id}-${index}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                    >
                      {team?.name ?? 'TBD'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedMatch.teams.map((team, index) => (
                  <div
                    key={`${selectedMatch.id}-controls-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {team?.name ?? `Team ${index + 1}`}
                      </p>
                      {selectedMatch.winnerIndex === index && (
                        <span className="rounded-full border border-emerald-400/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                          Winnaar
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-3">
                      <Field
                        label="Score"
                        value={team?.score?.toString() ?? ''}
                        placeholder="0"
                        type="number"
                        onChange={handleScoreInputChange(index)}
                      />
                      <button
                        type="button"
                        disabled={!team}
                        onClick={handleWinnerSelect(index)}
                        className={`w-full rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                          team
                            ? selectedMatch.winnerIndex === index
                              ? 'border-emerald-400 text-emerald-100 bg-emerald-400/20 cursor-default'
                              : 'border-emerald-400/50 text-emerald-200 hover:border-emerald-200 hover:bg-emerald-400/10'
                            : 'cursor-not-allowed border-white/10 text-white/30'
                        }`}
                      >
                        {selectedMatch.winnerIndex === index
                          ? 'Reeds winnaar'
                          : 'Markeer als winnaar'}
                      </button>
                    </div>
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
      </main>
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
  type?: 'text' | 'number';
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


