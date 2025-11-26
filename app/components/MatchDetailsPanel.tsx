'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { useBracketStore } from '@/app/store/bracketStore';
import type { MatchMediaLink } from '@/app/types/bracket';

export default function MatchDetailsPanel() {
  const { selectedMatchId, setSelectedMatch, getMatchById, settings } =
    useBracketStore();

  const match = useMemo(
    () => (selectedMatchId ? getMatchById(selectedMatchId) : undefined),
    [selectedMatchId, getMatchById]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMatch(null);
      }
    };

    if (selectedMatchId) {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedMatchId, setSelectedMatch]);

  const closePanel = () => setSelectedMatch(null);

  const primaryColor = settings.primaryColor;
  const secondaryColor = settings.secondaryColor;

  const teamAName = match?.teams[0]?.name ?? 'TBD';
  const teamBName = match?.teams[1]?.name ?? 'TBD';

  return (
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
            onClick={closePanel}
          />

          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-white/10 bg-black/90 p-6 backdrop-blur-xl sm:p-8"
            style={{
              boxShadow: `-40px 0 80px -40px ${secondaryColor}60`,
            }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  {match.details?.title ?? 'Match details'}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {teamAName}
                  <span className="mx-3 text-white/40">vs</span>
                  {teamBName}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                  {match.startTime && (
                    <Chip icon="clock" color={primaryColor}>
                      {match.startTime}
                    </Chip>
                  )}
                  {match.court && (
                    <Chip icon="map" color={secondaryColor}>
                      {match.court}
                    </Chip>
                  )}
                  {match.details?.scheduleNote && (
                    <Chip icon="sparkles">{match.details.scheduleNote}</Chip>
                  )}
                </div>
              </div>

              <button
                onClick={closePanel}
                className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:border-white/40 hover:bg-white/20"
                aria-label="Sluit match details"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Team Information */}
            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              {match.teams.map((team, index) => {
                if (!team) return null;
                return (
                  <div
                    key={team.id}
                    className="rounded-2xl border border-white/10 bg-[#1A2335] p-4"
                  >
                    {team.logo && (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-16 w-16 rounded-lg object-contain mb-3"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-white mb-2">{team.name}</h3>
                    {team.countryCode && (
                      <p className="text-xs text-white/60 mb-2">{team.countryCode}</p>
                    )}
                    {team.coach && (
                      <p className="text-xs text-white/70 mb-1">
                        <span className="text-white/50">Coach:</span> {team.coach}
                      </p>
                    )}
                    {team.motto && (
                      <p className="text-xs text-white/70 italic mt-2">&ldquo;{team.motto}&rdquo;</p>
                    )}
                    {team.twitchLink && (
                      <a
                        href={team.twitchLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 rounded-lg border border-purple-400/50 px-3 py-1.5 text-xs font-semibold text-purple-200 transition hover:border-purple-200 hover:bg-purple-400/10"
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
                    {team.players && team.players.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs uppercase tracking-widest text-white/50 mb-2">
                          Spelers ({team.players.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {team.players.slice(0, 5).map((player) => (
                            <span
                              key={player.id}
                              className="text-xs rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white/70"
                            >
                              {player.name}
                              {player.role && (
                                <span className="text-white/50"> · {player.role}</span>
                              )}
                            </span>
                          ))}
                          {team.players.length > 5 && (
                            <span className="text-xs text-white/50 px-2 py-1">
                              +{team.players.length - 5} meer
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A2335] p-6">
              <div className="relative space-y-4 text-sm text-white/80">
                <header className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-white/60">
                    Spotlight
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {match.details?.subtitle ??
                      `${teamAName} strijdt tegen ${teamBName}`}
                  </h3>
                </header>
                {match.details?.description && (
                  <p>{match.details.description}</p>
                )}

                {match.details?.featuredPlayers && (
                  <section>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Featured spelers
                    </h4>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {match.details.featuredPlayers.map((player) => (
                        <div
                          key={player}
                          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                        >
                          {player}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {match.details?.streams && match.details.streams.length > 0 && (
              <section className="mt-6">
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Livestreams &amp; socials
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {match.details.streams.map((stream) => (
                    <StreamLink key={stream.url} link={stream} />
                  ))}
                </div>
              </section>
            )}

            {match.details?.prizeInfo && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Prijzenpot
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  {match.details.prizeInfo}
                </p>
              </section>
            )}

            {match.details?.hashtags && match.details.hashtags.length > 0 && (
              <section className="mt-6">
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Hashtags
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {match.details.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {match.details?.sponsors && match.details.sponsors.length > 0 && (
              <section className="mt-6">
                <h3 className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Partners
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {match.details.sponsors.map((sponsor) => (
                    <a
                      key={sponsor.name}
                      href={sponsor.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
                    >
                      <span>{sponsor.name}</span>
                      <svg
                        className="h-4 w-4 text-white/40 transition group-hover:text-white/80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Chip({
  children,
  icon,
  color,
}: {
  children: React.ReactNode;
  icon?: 'clock' | 'map' | 'sparkles';
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-medium"
      style={{
        color: color ?? '#ffffff',
        borderColor: color ? `${color}55` : undefined,
        backgroundColor: color ? `${color}22` : undefined,
      }}
    >
      {icon && <Icon name={icon} />}
      <span className="text-white/80">{children}</span>
    </span>
  );
}

function StreamLink({ link }: { link: MatchMediaLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/80 transition group-hover:border-white/20 group-hover:bg-black/60">
          <PlatformIcon platform={link.platform} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">
            {link.label ?? formatPlatformLabel(link.platform)}
          </p>
          <p className="text-xs text-white/50 truncate max-w-[180px] sm:max-w-[200px]">
            {link.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>
      <svg
        className="h-4 w-4 text-white/40 transition group-hover:text-white/90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function Icon({ name }: { name: 'clock' | 'map' | 'sparkles' }) {
  const props = {
    className: 'h-4 w-4 text-white/70',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
  };

  switch (name) {
    case 'clock':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'map':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.553-1.954l5-1.111a2 2 0 011.106 0l5 1.111A2 2 0 0117 5.618v9.764a2 2 0 01-1.553 1.954L9 20z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20v-9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 4v9"
          />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 11l2 2-2 2m4-4l1.5-3L12 9l3 .5L13.5 15 10 13l-3 .5L8 11zm9 2l1 1-1 1"
          />
        </svg>
      );
    default:
      return null;
  }
}

function PlatformIcon({ platform }: { platform: MatchMediaLink['platform'] }) {
  const baseProps = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'currentColor',
  };

  switch (platform) {
    case 'twitch':
      return (
        <svg {...baseProps}>
          <path d="M4 4h16v9l-4 4h-4l-3 3v-3H4V4zm3 2v8h10l2-2V6H7zm3 1h2v4h-2V7zm4 0h2v4h-2V7z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...baseProps}>
          <path d="M21.8 8s-.2-1.5-.8-2.2c-.7-.8-1.6-.8-2-0.9C16 4.5 12 4.5 12 4.5h0s-4 0-7 .4c-.4.1-1.3.1-2 .9C2.4 6.5 2.2 8 2.2 8S2 9.8 2 11.6v1c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.2c.7.8 1.6.7 2 .9 1.5.1 6.9.4 6.9.4s4 0 7-.4c.4-.1 1.3-.1 2-.9.6-.7.8-2.2.8-2.2s.2-1.7.2-3.5v-1c0-1.8-.2-3.6-.2-3.6zM10 9.75l5 2.85-5 2.85v-5.7z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...baseProps}>
          <path d="M13 22v-9h3l1-4h-4V7c0-1.1.3-2 2-2h2V1.1C16.5 1 15.3 1 14 1c-3 0-5 1.8-5 5v3H6v4h3v9h4z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...baseProps}>
          <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm13 1.5a1 1 0 11-2 0 1 1 0 012 0zM12 8a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...baseProps}>
          <path d="M16.5 3.5c1.2 1.5 2.9 2.4 4.8 2.4v3.2c-1.8 0-3.5-.5-4.8-1.4v6.9a6.4 6.4 0 11-6.4-6.4v3.2a3.2 3.2 0 103.2 3.2V2h3.2v1.5z" />
        </svg>
      );
    case 'x':
      return (
        <svg {...baseProps}>
          <path d="M6.3 3h4.2l3.1 4.7L17.5 3H21l-6.6 7.6L21.8 21h-4.2l-3.5-5.1L10 21H3.2l7-7.8L2.9 3h3.4l3 4.4L13.5 3h-3.2L6.3 3z" />
        </svg>
      );
    case 'website':
    default:
      return (
        <svg {...baseProps}>
          <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm6.9 8H16a15 15 0 00-.8-4.3A7 7 0 0118.9 11zM12 5c.8 1 1.4 2.9 1.6 4H10.4C10.6 7 11.2 6 12 5zM5.1 13H8a14.6 14.6 0 00.8 4.3A7 7 0 015.1 13zm0-2A7 7 0 018.8 6.7 14.6 14.6 0 008 11H5.1zM10.4 13h3.2c-.2 1.1-.8 3-1.6 4-0.8-1-1.4-2.9-1.6-4zm4 4.3A15 15 0 0016 13h2.9A7 7 0 0114.4 17.3z" />
        </svg>
      );
  }
}

function formatPlatformLabel(platform: MatchMediaLink['platform']) {
  switch (platform) {
    case 'twitch':
      return 'Twitch';
    case 'youtube':
      return 'YouTube';
    case 'facebook':
      return 'Facebook';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'x':
      return 'X (Twitter)';
    case 'website':
    default:
      return 'Bekijk online';
  }
}

