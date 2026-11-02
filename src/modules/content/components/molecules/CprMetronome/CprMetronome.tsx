import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Users, Volume2, VolumeX } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import logger from 'modules/shared/services/logger/logger';
import './CprMetronome.scss';

export interface CprMetronomeProps {
  beatsPerMinute: number;
  title?: string;
  hint?: string;
  /** Cada cuántos segundos avisar del relevo. Omitirlo desactiva el aviso. */
  relaySeconds?: number;
}

const MS_PER_MINUTE = 60_000;

/** Cadencia del reloj. Independiente del pulso para que el tiempo no salte. */
const CLOCK_TICK_MS = 250;

/** Cuánto se queda en pantalla el aviso de relevo. */
const RELAY_ALERT_MS = 8000;

/** Clic del pulso: corto y agudo para que corte el ruido de una emergencia. */
const BEAT_CLICK = {
  frequencyHz: 1000,
  peakGain: 0.22,
  decaySeconds: 0.055,
} as const;

/** Aviso de relevo: más grave y doble, para no confundirlo con el pulso. */
const RELAY_CHIME = {
  frequencyHz: 520,
  peakGain: 0.3,
  decaySeconds: 0.22,
  repeats: 2,
  gapSeconds: 0.28,
} as const;

type AudioContextCtor = typeof AudioContext;

/** Safari antiguo solo expone el constructor con prefijo. */
const getAudioContextCtor = (): AudioContextCtor | null => {
  if (typeof AudioContext !== 'undefined') return AudioContext;

  const scope = window as { webkitAudioContext?: AudioContextCtor };
  return scope.webkitAudioContext ?? null;
};

const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Guía de compresiones: marca el ritmo y cuenta el tiempo.
 *
 * El pulso por sí solo no calcula nada: repite un dato que ya está escrito. Lo
 * que de verdad no se puede hacer de cabeza mientras comprimes es llevar el
 * tiempo, y de ahí salen las dos cifras que sí sirven:
 *
 * - **Llevas**: lo primero que pregunta quien atiende la llamada de emergencias.
 * - **Relevo**: la calidad de las compresiones cae por fatiga en un par de
 *   minutos sin que la persona lo note. Al llegar a cero avisa, no informa.
 *
 * Arranca detenido: el `AudioContext` necesita un gesto del usuario para sonar,
 * y un pulso animado al abrir distraería de los pasos.
 */
const CprMetronome = ({
  beatsPerMinute,
  title = 'Marca el ritmo',
  hint,
  relaySeconds,
}: CprMetronomeProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [beat, setBeat] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRelayDue, setIsRelayDue] = useState(false);

  const beatIntervalRef = useRef<number | null>(null);
  const clockIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef<number | null>(null);
  /**
   * Último turno de relevo ya avisado, para no repetir el aviso en cada tick.
   *
   * Arranca en 1, no en 0: el primer turno empieza en curso y no hay nada que
   * anunciar. Con 0 el aviso saltaba en el primer segundo.
   */
  const announcedTurnRef = useRef(1);

  const beatIntervalMs = Math.round(MS_PER_MINUTE / beatsPerMinute);

  // --- Derivados del tiempo: el cálculo que el componente aporta ---
  const hasRelay = relaySeconds !== undefined && relaySeconds > 0;
  const relayTurn = hasRelay ? Math.floor(elapsedSeconds / relaySeconds) + 1 : 0;
  const secondsToRelay = hasRelay ? relaySeconds - (elapsedSeconds % relaySeconds) : 0;

  /** Crea el contexto la primera vez y lo reanuda si el navegador lo suspendió. */
  const ensureAudio = useCallback(async (): Promise<AudioContext | null> => {
    if (audioRef.current === null) {
      const Ctor = getAudioContextCtor();
      if (Ctor === null) {
        logger.warn('Sin Web Audio: la guía funciona solo en visual');
        return null;
      }
      audioRef.current = new Ctor();
    }

    if (audioRef.current.state === 'suspended') {
      await audioRef.current.resume();
    }

    return audioRef.current;
  }, []);

  /** Un tono con caída rápida. La rampa evita el chasquido del corte en seco. */
  const playTone = useCallback(
    (
      context: AudioContext,
      config: { frequencyHz: number; peakGain: number; decaySeconds: number },
      offsetSeconds = 0,
    ) => {
      const startAt = context.currentTime + offsetSeconds;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(config.frequencyHz, startAt);

      envelope.gain.setValueAtTime(0, startAt);
      envelope.gain.linearRampToValueAtTime(config.peakGain, startAt + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + config.decaySeconds);

      oscillator.connect(envelope).connect(context.destination);
      oscillator.start(startAt);
      // Los nodos de Web Audio son de un solo uso: al pararlos se liberan solos.
      oscillator.stop(startAt + config.decaySeconds + 0.005);
    },
    [],
  );

  // --- Pulso ---
  useEffect(() => {
    if (!isRunning) return undefined;

    beatIntervalRef.current = window.setInterval(
      () => setBeat((current) => current + 1),
      beatIntervalMs,
    );

    // Limpieza obligatoria: sin esto el intervalo sobrevive al desmontaje y
    // sigue provocando renders de un componente que ya no existe.
    return () => {
      if (beatIntervalRef.current !== null) {
        window.clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
    };
  }, [isRunning, beatIntervalMs]);

  // --- Reloj ---
  useEffect(() => {
    if (!isRunning) return undefined;

    // El tiempo se calcula contra una marca real, no contando pulsos: un
    // intervalo acumula desfase y el cronómetro acabaría mintiendo.
    clockIntervalRef.current = window.setInterval(() => {
      if (startedAtRef.current === null) return;
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, CLOCK_TICK_MS);

    return () => {
      if (clockIntervalRef.current !== null) {
        window.clearInterval(clockIntervalRef.current);
        clockIntervalRef.current = null;
      }
    };
  }, [isRunning]);

  // --- Sonido del pulso ---
  useEffect(() => {
    if (!isRunning || isMuted) return;
    const context = audioRef.current;
    if (context === null || context.state !== 'running') return;

    playTone(context, BEAT_CLICK);
  }, [beat, isRunning, isMuted, playTone]);

  // --- Aviso de relevo ---
  useEffect(() => {
    if (!isRunning || !hasRelay) return undefined;
    if (elapsedSeconds === 0 || relayTurn <= announcedTurnRef.current) return undefined;

    announcedTurnRef.current = relayTurn;
    setIsRelayDue(true);

    const context = audioRef.current;
    if (!isMuted && context !== null && context.state === 'running') {
      for (let repeat = 0; repeat < RELAY_CHIME.repeats; repeat += 1) {
        playTone(context, RELAY_CHIME, repeat * RELAY_CHIME.gapSeconds);
      }
    }

    const timer = window.setTimeout(() => setIsRelayDue(false), RELAY_ALERT_MS);
    return () => window.clearTimeout(timer);
  }, [elapsedSeconds, relayTurn, isRunning, hasRelay, isMuted, playTone]);

  // --- Liberar el contexto al desmontar ---
  useEffect(
    () => () => {
      void audioRef.current?.close().catch(() => undefined);
      audioRef.current = null;
    },
    [],
  );

  const toggleRunning = async () => {
    if (isRunning) {
      setIsRunning(false);
      startedAtRef.current = null;
      return;
    }

    // El contexto se prepara ANTES de arrancar para que el primer pulso ya
    // suene: si se creara dentro del efecto, el primer clic se perdería.
    if (!isMuted) await ensureAudio();

    // Detener significa que se dejó de comprimir, así que al reanudar se
    // cuenta desde cero. No es una pausa.
    announcedTurnRef.current = 1;
    startedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setIsRelayDue(false);
    setBeat(0);
    setIsRunning(true);
  };

  const toggleMuted = async () => {
    const nextMuted = !isMuted;
    if (!nextMuted && isRunning) await ensureAudio();
    setIsMuted(nextMuted);
  };

  return (
    <section
      className={`metronome ${isRelayDue ? 'is-relay-due' : ''}`.trim()}
      data-testid="CprMetronome"
    >
      <header className="metronome__head">
        <div className="metronome__head-text">
          <h3 className="metronome__title">{title}</h3>
          <p className="metronome__bpm">
            <strong>{beatsPerMinute}</strong> por minuto
          </p>
        </div>

        <button
          type="button"
          className="metronome__mute"
          onClick={() => void toggleMuted()}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Activar el sonido' : 'Silenciar el sonido'}
        >
          {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
      </header>

      <div className="metronome__stage">
        {/* `key` fuerza un nodo nuevo en cada pulso: así la animación se
            reinicia sin tener que reiniciarla a mano. */}
        <span
          key={beat}
          className={`metronome__pulse ${isRunning ? 'is-running' : ''}`.trim()}
          aria-hidden="true"
        />
        <span className="metronome__core" aria-hidden="true">
          {isRunning ? 'Comprime' : 'Listo'}
        </span>
      </div>

      {/* Las cifras calculadas. Sin ellas esto solo repetiría un dato escrito. */}
      <dl className="metronome__readout">
        <div className="metronome__metric">
          <dd className="metronome__metric-value">{formatClock(elapsedSeconds)}</dd>
          <dt className="metronome__metric-label">llevas</dt>
        </div>

        {hasRelay && (
          <div
            className={`metronome__metric ${isRelayDue ? 'is-due' : ''}`.trim()}
          >
            <dd className="metronome__metric-value">
              {isRunning ? formatClock(secondsToRelay) : formatClock(relaySeconds)}
            </dd>
            <dt className="metronome__metric-label">
              relevo {isRunning && relayTurn > 1 ? `· turno ${relayTurn}` : ''}
            </dt>
          </div>
        )}
      </dl>

      {/* `role="alert"` para que un lector de pantalla lo interrumpa todo: el
          relevo es una acción, no una notificación. */}
      {isRelayDue && (
        <p className="metronome__relay-alert" role="alert">
          <Users aria-hidden="true" />
          Cambia de persona si hay alguien más
        </p>
      )}

      <Button
        variant={isRunning ? 'secondary' : 'primary'}
        size="lg"
        fullWidth
        onClick={() => void toggleRunning()}
        iconStart={isRunning ? <Pause /> : <Play />}
      >
        {isRunning ? 'Detener' : 'Iniciar guía'}
      </Button>

      {!isRunning && hint && <p className="metronome__hint">{hint}</p>}
    </section>
  );
};

export default CprMetronome;
