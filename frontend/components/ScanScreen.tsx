import { CameraView, useCameraPermissions, type CameraMountError } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useIsFocused, useRouter } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AloeRosette } from '@/components/AloeArt';
import { Entry } from '@/components/Entry';
import { FieldButton, Meta, Stamp } from '@/components/FieldUI';
import { ScreenShell } from '@/components/ScreenShell';
import { Palette } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { Type } from '@/constants/Typography';
import {
  detectDisease,
  getMlErrorDetail,
  isMlOfflineError,
  type DiseaseDetectionResult,
} from '@/lib/api/ml';
import { createScan, updateScanResult } from '@/lib/db/scans';

const scanlines = require('../assets/images/scanlines.png') as number;

export type ScanMode = {
  key: 'diagnosis' | 'maturity' | 'grading';
  label: string;
  href: Href;
  eyebrow: string;
  title: string;
  description: string;
  modeIndex: string;
  reads: { id: string; title: string; note: string }[];
  result: { label: string; value: string }[];
  frameNote: string;
};

export const scanModes: ScanMode[] = [
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    href: '/scan/diagnosis',
    eyebrow: 'Mode 01 / Disease & pests',
    title: 'Look closely.',
    description:
      'Disease and pest symptoms from a single leaf. Hold the frame steady, then send one preview frame to the field server for a reading. Analysis needs a reachable backend — nothing is written to the ledger.',
    modeIndex: '01 / 03',
    reads: [
      { id: '01', title: 'Leaf surface', note: 'Texture, lesions and discoloration' },
      { id: '02', title: 'Edges & tips', note: 'Browning, curling and pest residue' },
      { id: '03', title: 'Pattern', note: 'Spread across the rosette, not just one leaf' },
    ],
    result: [
      { label: 'Finding', value: '—' },
      { label: 'Confidence', value: '—' },
      { label: 'Detections', value: '—' },
    ],
    frameNote: 'Align one leaf · hold 20 cm from the surface',
  },
  {
    key: 'maturity',
    label: 'Maturity',
    href: '/scan/maturity',
    eyebrow: 'Mode 02 / Harvest readiness',
    title: 'Time the cut.',
    description:
      'Estimate harvest readiness from the shape of the plant — leaf count, structure and the weight of the outer leaves.',
    modeIndex: '02 / 03',
    reads: [
      { id: '01', title: 'Leaf count', note: 'Harvestable leaves on the rosette' },
      { id: '02', title: 'Structure', note: 'Spread, height and stem thickness' },
      { id: '03', title: 'Outer leaves', note: 'Firmness and colour at the base' },
    ],
    result: [
      { label: 'Stage', value: '—' },
      { label: 'Window', value: '—' },
      { label: 'Confidence', value: '—' },
    ],
    frameNote: 'Fit the whole rosette · keep the base in frame',
  },
  {
    key: 'grading',
    label: 'Grading',
    href: '/scan/grading',
    eyebrow: 'Mode 03 / Post-harvest',
    title: 'Grade the cut.',
    description:
      'Classify a harvested leaf by its measurable qualities. This is the record that follows the harvest to market.',
    modeIndex: '03 / 03',
    reads: [
      { id: '01', title: 'Length', note: 'Tip to cut, in centimetres' },
      { id: '02', title: 'Width & taper', note: 'Shoulder width and evenness' },
      { id: '03', title: 'Surface', note: 'Blemishes, cuts and handling marks' },
    ],
    result: [
      { label: 'Grade', value: '—' },
      { label: 'Class', value: '—' },
      { label: 'Notes', value: '—' },
    ],
    frameNote: 'Lay the leaf flat · fill the frame corner to corner',
  },
];

type CapturedFrame = {
  uri: string;
  width: number;
  height: number;
};

type CameraPermission = ReturnType<typeof useCameraPermissions>[0];

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: DiseaseDetectionResult }
  | { status: 'error'; offline: boolean; message: string };

function formatConfidence(confidence: number): string {
  const percent = Math.max(0, Math.min(1, confidence)) * 100;
  return `${Math.round(percent)}%`;
}

function ModeSwitch({ mode }: { mode: ScanMode }) {
  const router = useRouter();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  return (
    <View style={styles.modeSwitch}>
      {scanModes.map((item) => {
        const active = item.key === mode.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onBlur={() => setFocusedKey(null)}
            onFocus={() => setFocusedKey(item.key)}
            onPress={() => router.push(item.href)}
            style={[
              styles.modeTab,
              active && styles.modeTabActive,
              focusedKey === item.key && styles.modeTabFocused,
            ]}
          >
            <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
              {item.label}
            </Text>
            <Text style={[styles.modeIndex, active && styles.modeIndexActive]}>
              0{scanModes.findIndex((entry) => entry.key === item.key) + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FrameAction({
  label,
  onPress,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.frameAction,
        focused && styles.frameActionFocused,
        pressed && !busy && styles.frameActionPressed,
        busy && styles.frameActionBusy,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={Palette.cream} size="small" />
      ) : (
        <Text style={styles.frameActionLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

function AnalysisButton({
  busy,
  label,
  onPress,
}: {
  busy: boolean;
  label: string;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityHint="Sends the captured frame to the field server for detection. A reachable backend is required."
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.analysisButton,
        focused && styles.analysisButtonFocused,
        pressed && !busy && styles.analysisButtonPressed,
        busy && styles.analysisButtonBusy,
      ]}
    >
      {busy ? <ActivityIndicator color={Palette.cream} size="small" /> : null}
      <Text style={styles.analysisButtonLabel}>{label}</Text>
      <Text style={styles.analysisButtonGlyph}>↗</Text>
    </Pressable>
  );
}

function ScanFrame({
  mode,
  permission,
  isFocused,
  captured,
  cameraReady,
  cameraError,
  cameraKey,
  permissionBusy,
  cameraRef,
  onCameraReady,
  onMountError,
  onRequestPermission,
  onRetryCamera,
}: {
  mode: ScanMode;
  permission: CameraPermission;
  isFocused: boolean;
  captured: CapturedFrame | null;
  cameraReady: boolean;
  cameraError: string | null;
  cameraKey: number;
  permissionBusy: boolean;
  cameraRef: RefObject<CameraView | null>;
  onCameraReady: () => void;
  onMountError: (message: string) => void;
  onRequestPermission: () => void;
  onRetryCamera: () => void;
}) {
  const scan = useSharedValue(0);

  useEffect(() => {
    scan.value = 0;
    scan.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [scan, mode.key]);

  const line = useAnimatedStyle(() => ({
    transform: [{ translateY: 58 + scan.value * 232 }],
    opacity: 0.35 + 0.5 * Math.sin(scan.value * Math.PI),
  }));

  const showCamera = Boolean(
    permission?.granted && isFocused && !captured && !cameraError
  );
  const showPreview = Boolean(showCamera || captured);
  const cameraMessage =
    cameraError && cameraError.length > 180
      ? `${cameraError.slice(0, 177)}…`
      : cameraError;

  return (
    <View style={styles.frame}>
      {captured ? (
        <Image
          accessible
          accessibilityIgnoresInvertColors
          accessibilityLabel="Captured leaf frame preview"
          resizeMode="cover"
          source={{ uri: captured.uri }}
          style={styles.cameraLayer}
        />
      ) : null}

      {showCamera ? (
        <CameraView
          key={cameraKey}
          ref={cameraRef}
          accessible
          accessibilityLabel="Live camera preview"
          animateShutter
          facing="back"
          mode="picture"
          onCameraReady={onCameraReady}
          onMountError={(event: CameraMountError) => onMountError(event.message)}
          pointerEvents="none"
          style={styles.cameraLayer}
        />
      ) : null}

      {showPreview ? (
        <>
          <LinearGradient
            colors={['rgba(16,20,16,0.72)', 'rgba(16,20,16,0)']}
            locations={[0, 1]}
            pointerEvents="none"
            style={styles.scrimTop}
          />
          <LinearGradient
            colors={['rgba(16,20,16,0)', 'rgba(16,20,16,0.82)']}
            locations={[0, 1]}
            pointerEvents="none"
            style={styles.scrimBottom}
          />
        </>
      ) : null}

      <Image source={scanlines} resizeMode="cover" style={styles.scanlines} />

      <View style={styles.frameTop}>
        <View style={styles.frameTag}>
          <View style={[styles.frameDot, captured && styles.frameDotCaptured]} />
          <Text numberOfLines={1} style={styles.frameTagText}>
            {captured ? 'Captured · preview only' : 'Camera · offline'}
          </Text>
        </View>
        <Text style={styles.frameZoom}>1×</Text>
      </View>

      <View pointerEvents="none" style={styles.reticle}>
        <View style={styles.reticleCircle} />
        {!showPreview ? <AloeRosette height={196} tone="ink" /> : null}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <Animated.View pointerEvents="none" style={[styles.scanLine, line]} />

      <View style={styles.frameFoot}>
        <Text style={styles.frameNote}>{mode.frameNote}</Text>
        <Text style={styles.frameMeta} numberOfLines={1}>
          2K × 2K
        </Text>
      </View>

      {showCamera && !cameraReady ? (
        <View pointerEvents="none" style={styles.cameraLoading}>
          <ActivityIndicator color={Palette.creamMuted} size="small" />
          <Text style={styles.cameraLoadingText}>Opening camera</Text>
        </View>
      ) : null}

      {!captured && !showCamera ? (
        <View style={styles.cameraGate}>
          {cameraError ? (
            <>
              <Text style={styles.gateEyebrow}>Camera unavailable</Text>
              <Text style={styles.gateTitle}>The lens did not open.</Text>
              <Text style={styles.gateBody}>
                {cameraMessage} Preview only — no frame is recorded.
              </Text>
              <FrameAction label="Retry camera" onPress={onRetryCamera} />
            </>
          ) : permission === null ? (
            <>
              <ActivityIndicator color={Palette.creamMuted} size="small" />
              <Text style={styles.gateTitle}>Checking camera access</Text>
              <Text style={styles.gateBody}>
                The preview only opens while this screen is active. Nothing is recorded.
              </Text>
              <FrameAction
                busy={permissionBusy}
                label="Enable camera"
                onPress={onRequestPermission}
              />
            </>
          ) : !permission.granted ? (
            <>
              <Text style={styles.gateEyebrow}>Camera access</Text>
              <Text style={styles.gateTitle}>The lens is closed.</Text>
              <Text style={styles.gateBody}>
                Allow camera access to frame a leaf. Preview only — nothing is uploaded or
                analyzed.
              </Text>
              <FrameAction
                busy={permissionBusy}
                label={
                  permission.canAskAgain || Platform.OS === 'web'
                    ? 'Enable camera'
                    : 'Open device settings'
                }
                onPress={onRequestPermission}
              />
              {!permission.canAskAgain && Platform.OS !== 'web' ? (
                <Text style={styles.gateHelp}>
                  Enable camera access in device settings, then return to this screen.
                </Text>
              ) : null}
              {!permission.canAskAgain && Platform.OS === 'web' ? (
                <Text style={styles.gateHelp}>
                  Allow camera access in your browser&apos;s site settings, then try again.
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.gateTitle}>Preview paused</Text>
              <Text style={styles.gateBody}>
                Return to this screen to reopen the camera. Preview only.
              </Text>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

export function ScanScreen({
  mode,
  cameraSymbol,
}: {
  mode: ScanMode;
  cameraSymbol: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
}) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState<CapturedFrame | null>(null);
  const [scanRecordId, setScanRecordId] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [shutterFocused, setShutterFocused] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle' });
  const cameraRef = useRef<CameraView>(null);
  const captureLock = useRef(false);
  const permissionLock = useRef(false);
  const analysisRequest = useRef(0);
  const isFocused = useIsFocused();
  const isDiagnosis = mode.key === 'diagnosis';
  const ownerId = useAppStore((state) => (state.accountStatus === 'synced' ? state.supabaseUserId : state.localProfileId));
  const modePosition = scanModes.findIndex((item) => item.key === mode.key);
  const nextMode = scanModes[(modePosition + 1) % scanModes.length];

  useEffect(() => {
    analysisRequest.current += 1;
    setAnalysis({ status: 'idle' });
  }, [mode.key]);

  useEffect(() => {
    return () => {
      // Ignore any response that lands after this screen or frame is gone.
      analysisRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setCameraReady(false);
    }
  }, [isFocused]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void getPermission().catch(() => {
          // The permission gate keeps its manual retry action if the check fails.
        });
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  const handlePermissionRequest = async () => {
    if (permissionLock.current) return;
    permissionLock.current = true;
    setPermissionBusy(true);
    try {
      if (permission && !permission.canAskAgain && Platform.OS !== 'web') {
        await Linking.openSettings();
      } else {
        await requestPermission();
      }
    } catch {
      // If the system dialog cannot open, the gate keeps its retry action visible.
    } finally {
      permissionLock.current = false;
      setPermissionBusy(false);
    }
  };

  const handleRetake = () => {
    analysisRequest.current += 1;
    setAnalysis({ status: 'idle' });
    setCaptured(null);
    setScanRecordId(null);
    setCaptureError(null);
    setCameraReady(false);
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    setCaptureError(null);
    setCameraReady(false);
    setCameraKey((key) => key + 1);
  };

  const handleCapture = async () => {
    const camera = cameraRef.current;
    if (!camera || !cameraReady || captureLock.current) return;

    captureLock.current = true;
    setCapturing(true);
    setCaptureError(null);
    analysisRequest.current += 1;
    setAnalysis({ status: 'idle' });
    try {
      const picture = await camera.takePictureAsync({ quality: 0.7 });
      setCaptured({
        uri: picture.uri,
        width: picture.width,
        height: picture.height,
      });
      setCameraReady(false);
      try {
        const record = await createScan({
          mode: mode.key,
          result: { status: 'captured', width: picture.width, height: picture.height },
        }, ownerId);
        setScanRecordId(record.id);
      } catch {
        // Scan history is best-effort; capture still succeeds.
      }
    } catch {
      setCaptureError(
        'The shutter fired but the frame could not be read. Keep the preview open and try again.'
      );
    } finally {
      captureLock.current = false;
      setCapturing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!captured || analysis.status === 'loading') return;

    const requestId = analysisRequest.current + 1;
    analysisRequest.current = requestId;
    setAnalysis({ status: 'loading' });

    try {
      const result = await detectDisease(captured.uri);
      if (analysisRequest.current !== requestId) return;
      setAnalysis({ status: 'success', result });
      if (scanRecordId) {
        void updateScanResult(scanRecordId, { status: 'analyzed', result });
      }
    } catch (error) {
      if (analysisRequest.current !== requestId) return;

      const offline = isMlOfflineError(error);
      const detail = getMlErrorDetail(error)?.replace(/\.+$/, '');
      setAnalysis({
        status: 'error',
        offline,
        message: offline
          ? 'The field server could not be reached, so no analysis ran. The frame is still held in this session.'
          : detail
            ? `The field server could not analyze this frame: ${detail}. The frame is still held in this session.`
            : 'The field server could not analyze this frame. The frame is still held in this session.',
      });
    }
  };

  const handleShutter = () => {
    if (captured) {
      handleRetake();
      return;
    }
    if (permission === null) return;
    if (!permission.granted) {
      void handlePermissionRequest();
      return;
    }
    if (cameraError) {
      handleRetryCamera();
      return;
    }
    void handleCapture();
  };

  const shutterDisabled =
    capturing ||
    permissionBusy ||
    permission === null ||
    (permission.granted && !captured && !cameraReady && !cameraError);

  const shutterLabel = captured
    ? 'Retake frame'
    : permission === null
      ? 'Camera starting'
      : !permission.granted
        ? 'Enable camera'
        : cameraError
          ? 'Retry camera'
          : capturing
            ? 'Capturing frame'
            : 'Capture leaf';

  const captureTitle = captured
    ? 'Frame captured'
    : permission === null
      ? 'Waking the camera'
      : !permission.granted
        ? 'Camera is closed'
        : cameraError
          ? 'Camera unavailable'
          : capturing
            ? 'Capturing'
            : 'Capture leaf';

  const captureNote = captured
    ? isDiagnosis
      ? 'Preview only. Tap the shutter to retake; analysis runs only when you ask.'
      : 'Preview only. Tap the shutter to retake; nothing is saved to the ledger.'
    : permission === null
      ? 'Checking camera access. Preview only.'
      : !permission.granted
        ? 'Preview only. Allow camera access to frame a leaf.'
        : cameraError
          ? 'Preview only. The preview could not start.'
          : capturing
            ? 'Preview only. Hold steady while the frame is captured.'
            : mode.key === 'grading'
              ? 'Preview only. Lay the leaf flat, cut edge at the bottom.'
              : 'Preview only. Hold steady — one frame is all it needs.';

  const topDetection = analysis.status === 'success' ? analysis.result.top : null;
  const detectionCount = analysis.status === 'success' ? analysis.result.count : 0;
  const analysisBusy = analysis.status === 'loading';
  const resultRows = isDiagnosis
    ? [
        {
          label: 'Finding',
          value:
            topDetection?.label ??
            (analysis.status === 'success' ? 'No detection' : '—'),
        },
        {
          label: 'Confidence',
          value: topDetection ? formatConfidence(topDetection.confidence) : '—',
        },
        {
          label: 'Detections',
          value:
            analysis.status === 'success'
              ? detectionCount > 0
                ? `${detectionCount} region${detectionCount === 1 ? '' : 's'} flagged`
                : 'No region flagged'
              : '—',
        },
      ]
    : mode.result;
  const ledgerStatus = !isDiagnosis
    ? 'No scan on file'
    : analysis.status === 'loading'
      ? 'Analyzing'
      : analysis.status === 'error'
        ? analysis.offline
          ? 'Offline'
          : 'Failed'
        : analysis.status === 'success'
          ? topDetection
            ? 'Complete'
            : 'No detection'
          : captured
            ? 'Frame ready'
            : 'No scan on file';

  return (
    <ScreenShell
      eyebrow={mode.eyebrow}
      title={mode.title}
      description={mode.description}
      index={`scan / ${mode.modeIndex}`}
      back
      footer={false}
    >
      <View style={styles.scanBlock}>
        <ModeSwitch mode={mode} />
        <ScanFrame
          mode={mode}
          permission={permission}
          isFocused={isFocused}
          captured={captured}
          cameraReady={cameraReady}
          cameraError={cameraError}
          cameraKey={cameraKey}
          permissionBusy={permissionBusy}
          cameraRef={cameraRef}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(message) => {
            setCameraReady(false);
            setCameraError(
              message.trim() || 'The camera preview could not start on this device.'
            );
          }}
          onRequestPermission={() => {
            void handlePermissionRequest();
          }}
          onRetryCamera={handleRetryCamera}
        />

        <View style={styles.captureRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shutterLabel}
            accessibilityState={{ busy: capturing, disabled: shutterDisabled }}
            disabled={shutterDisabled}
            onBlur={() => setShutterFocused(false)}
            onFocus={() => setShutterFocused(true)}
            onPress={handleShutter}
            style={({ pressed }) => [
              styles.capture,
              shutterFocused && styles.captureFocused,
              pressed && !shutterDisabled && styles.capturePressed,
              shutterDisabled && styles.captureDisabled,
            ]}
          >
            <View style={styles.captureInner}>
              {capturing ? (
                <ActivityIndicator color={Palette.cream} size="small" />
              ) : (
                <SymbolView
                  name={{
                    ios: cameraSymbol.ios,
                    android: cameraSymbol.android,
                    web: cameraSymbol.web,
                  }}
                  size={24}
                  weight="light"
                  tintColor={Palette.cream}
                />
              )}
            </View>
          </Pressable>
          <View style={styles.captureCopy}>
            <Text style={styles.captureTitle}>{captureTitle}</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.captureNote,
                (permission?.granted === false || cameraError) && styles.captureNoteNotice,
                captured && styles.captureNoteCaptured,
              ]}
            >
              {captureNote}
            </Text>
          </View>
          <Stamp label="Preview" />
        </View>

        {captured ? (
          <Entry distance={10}>
            <View style={styles.notice}>
              <Image
                accessible
                accessibilityIgnoresInvertColors
                accessibilityLabel="Captured frame thumbnail"
                resizeMode="cover"
                source={{ uri: captured.uri }}
                style={styles.noticeThumb}
              />
              <View style={styles.noticeText}>
                <Text accessibilityLiveRegion="polite" style={styles.noticeTitle}>
                  Preview only — frame held in session.
                </Text>
                <Text style={styles.noticeBody}>
                  {isDiagnosis
                    ? 'This frame lives in this session and the camera cache. It is sent to the field server only when you tap Analyze leaf; nothing is written to the ledger.'
                    : 'This frame lives in this session and the device cache. Nothing is uploaded, analyzed, or written to the ledger.'}
                </Text>
                <Text style={styles.noticeMeta}>
                  {captured.width} × {captured.height} px · session only
                </Text>
              </View>
            </View>
          </Entry>
        ) : null}

        {captureError ? (
          <Entry distance={10}>
            <View style={[styles.notice, styles.noticeError]}>
              <View style={styles.noticeText}>
                <Text accessibilityLiveRegion="polite" style={styles.noticeTitle}>
                  Capture failed.
                </Text>
                <Text style={styles.noticeBody}>
                  {captureError} Preview only — nothing reached the ledger.
                </Text>
              </View>
            </View>
          </Entry>
        ) : null}
      </View>

      <View style={styles.result}>
        <View style={styles.resultHead}>
          <Meta tone="accent">Result ledger</Meta>
          <Meta
            style={styles.resultStatus}
            tone={analysis.status === 'error' ? 'accent' : 'muted'}
          >
            {ledgerStatus}
          </Meta>
        </View>
        {resultRows.map((item, index) => (
          <View key={item.label} style={[styles.resultRow, index === 0 && styles.resultRowFirst]}>
            <Text style={styles.resultLabel}>{item.label}</Text>
            <Text style={styles.resultValue}>{item.value}</Text>
          </View>
        ))}

        {isDiagnosis ? (
          <View style={styles.analysis}>
            {captured ? (
              <>
                {analysisBusy ? (
                  <View style={styles.analysisStatus}>
                    <ActivityIndicator color={Palette.accentDeep} size="small" />
                    <View style={styles.analysisStatusText}>
                      <Text accessibilityLiveRegion="polite" style={styles.analysisTitle}>
                        Analyzing leaf
                      </Text>
                      <Text style={styles.analysisBody}>
                        One frame is being read by the field server. Preview only — no image
                        is written to the ledger.
                      </Text>
                    </View>
                  </View>
                ) : null}

                {analysis.status === 'error' ? (
                  <View style={[styles.analysisStatus, styles.analysisStatusError]}>
                    <View style={styles.analysisStatusText}>
                      <Text
                        accessibilityLiveRegion="assertive"
                        accessibilityRole="alert"
                        style={[styles.analysisTitle, styles.analysisTitleError]}
                      >
                        {analysis.offline ? 'Field server unreachable' : 'Analysis failed'}
                      </Text>
                      <Text style={styles.analysisBody}>{analysis.message}</Text>
                      <Text style={styles.analysisMeta}>
                        {analysis.offline
                          ? 'No analysis ran. Check the backend address and connection, then retry.'
                          : 'The frame remains in this session. Retry when the server is ready.'}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {analysis.status === 'success' ? (
                  <View style={[styles.analysisStatus, styles.analysisStatusSuccess]}>
                    <View style={styles.analysisStatusText}>
                      <Text accessibilityLiveRegion="polite" style={styles.analysisTitle}>
                        {topDetection ? 'Analysis complete' : 'No disease region found'}
                      </Text>
                      <Text style={styles.analysisBody}>
                        {topDetection
                          ? `${topDetection.label} at ${formatConfidence(topDetection.confidence)} confidence. ${detectionCount} region${detectionCount === 1 ? '' : 's'} flagged. Nothing is saved automatically.`
                          : 'The field server returned no detection for this frame. Retake with a closer, evenly lit leaf if symptoms are visible.'}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {analysis.status !== 'success' ? (
                  <AnalysisButton
                    busy={analysisBusy}
                    label={
                      analysisBusy
                        ? 'Analyzing leaf'
                        : analysis.status === 'error'
                          ? 'Retry analysis'
                          : 'Analyze leaf'
                    }
                    onPress={() => {
                      void handleAnalyze();
                    }}
                  />
                ) : null}

                <Text style={styles.analysisNote}>
                  {analysis.status === 'success'
                    ? 'Preview only. Retake the frame to analyze another leaf.'
                    : 'Preview only. Sends this one frame to the field server; requires a reachable backend. No image is added to the ledger.'}
                </Text>
              </>
            ) : (
              <Text style={styles.analysisHint}>
                Capture a leaf to enable analysis. Preview only — nothing is sent until you ask.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.reads}>
        <Text style={styles.readsTitle}>What this mode reads</Text>
        <View>
          {mode.reads.map((read, index) => (
            <View key={read.id} style={[styles.readRow, index === 0 && styles.readRowFirst]}>
              <Text style={styles.readId}>{read.id}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.readTitle}>{read.title}</Text>
                <Text style={styles.readNote}>{read.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.trust}>
        <Text style={styles.trustTitle}>
          {isDiagnosis
            ? 'Preview stays local. Analysis needs the field server.'
            : 'The image never leaves this device.'}
        </Text>
        <Text style={styles.trustBody}>
          {isDiagnosis
            ? 'A captured frame is held only in this session and the camera cache. Tapping Analyze leaf sends one copy to the field server for a reading; the app keeps no extra copy and writes nothing to the ledger. Analysis cannot run while the backend is unreachable — keep the frame and retry when a line returns.'
            : 'Preview frames stay on this device. When analysis arrives, inference runs locally. Only the result you choose to keep becomes part of the ledger, and only syncs if you register an account.'}
        </Text>
        <View style={styles.trustActions}>
          <FieldButton label="Try another read" href={nextMode.href} variant="outline" compact />
          <FieldButton label="Plant archive" href="/plants" variant="outline" compact />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scanBlock: {
    gap: 16,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    backgroundColor: 'rgba(22,26,20,0.03)',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: Palette.ink,
  },
  modeTabFocused: {
    boxShadow: '0 0 0 2px rgba(196,86,45,0.38)',
  },
  modeLabel: {
    ...Type.labelSmall,
    fontSize: 11.5,
    color: Palette.muted,
  },
  modeLabelActive: {
    color: Palette.cream,
  },
  modeIndex: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.dim,
  },
  modeIndexActive: {
    color: Palette.creamMuted,
  },
  frame: {
    position: 'relative',
    height: 352,
    borderRadius: 26,
    backgroundColor: '#101410',
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.45)',
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
    boxShadow: '0 30px 60px -40px rgba(22,26,20,0.8)',
  },
  cameraLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.16,
  },
  frameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  frameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  frameDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  frameDotCaptured: {
    backgroundColor: Palette.sage,
  },
  frameTagText: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.creamMuted,
    flexShrink: 1,
  },
  frameZoom: {
    ...Type.mono,
    fontSize: 10,
    color: Palette.creamMuted,
  },
  reticle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCircle: {
    position: 'absolute',
    width: 226,
    height: 226,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(241,236,224,0.14)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(241,236,224,0.5)',
  },
  cornerTL: {
    top: 10,
    left: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTR: {
    top: 10,
    right: 6,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBL: {
    bottom: 10,
    left: 6,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    bottom: 10,
    right: 6,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 0,
    height: 1,
    backgroundColor: Palette.accent,
    boxShadow: '0 0 18px rgba(196,86,45,0.8)',
  },
  frameFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  frameNote: {
    ...Type.caption,
    fontSize: 8.5,
    color: Palette.creamMuted,
    flexShrink: 1,
  },
  frameMeta: {
    ...Type.caption,
    fontSize: 7.5,
    color: Palette.creamDim,
    flexShrink: 0,
  },
  cameraGate: {
    position: 'absolute',
    top: 56,
    left: 22,
    right: 22,
    bottom: 52,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  gateEyebrow: {
    ...Type.caption,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Palette.accent,
  },
  gateTitle: {
    ...Type.subtitle,
    fontSize: 20,
    lineHeight: 25,
    color: Palette.cream,
    textAlign: 'center',
  },
  gateBody: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.creamMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  gateHelp: {
    ...Type.caption,
    fontSize: 9.5,
    lineHeight: 14,
    color: Palette.creamDim,
    textAlign: 'center',
    maxWidth: 280,
  },
  frameAction: {
    minHeight: 44,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(241,236,224,0.34)',
    backgroundColor: 'rgba(241,236,224,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameActionFocused: {
    borderColor: Palette.accent,
    backgroundColor: 'rgba(196,86,45,0.22)',
    boxShadow: '0 0 0 3px rgba(196,86,45,0.22)',
  },
  frameActionPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: 'rgba(241,236,224,0.16)',
  },
  frameActionBusy: {
    opacity: 0.7,
  },
  frameActionLabel: {
    ...Type.labelSmall,
    fontSize: 11,
    letterSpacing: 0.6,
    color: Palette.cream,
  },
  cameraLoading: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: 'center',
    gap: 6,
  },
  cameraLoadingText: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.creamMuted,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  capture: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 26px -14px rgba(196,86,45,0.85)',
  },
  captureFocused: {
    boxShadow:
      '0 0 0 3px rgba(196,86,45,0.28), 0 12px 26px -14px rgba(196,86,45,0.85)',
  },
  capturePressed: {
    transform: [{ scale: 0.96 }],
  },
  captureDisabled: {
    opacity: 0.55,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(22,26,20,0.22)',
    backgroundColor: 'rgba(22,26,20,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureCopy: {
    flex: 1,
    gap: 3,
  },
  captureTitle: {
    ...Type.subtitle,
    fontSize: 19,
  },
  captureNote: {
    ...Type.body,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.muted,
  },
  captureNoteNotice: {
    color: Palette.accentDeep,
  },
  captureNoteCaptured: {
    color: Palette.moss,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,86,45,0.34)',
    backgroundColor: Palette.accentSoft,
    borderRadius: 14,
    padding: 14,
  },
  noticeError: {
    borderColor: 'rgba(162,58,42,0.38)',
  },
  noticeThumb: {
    width: 66,
    height: 66,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.ink,
  },
  noticeText: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    color: Palette.accentDeep,
  },
  noticeBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  noticeMeta: {
    ...Type.caption,
    fontSize: 8,
    color: Palette.dim,
    paddingTop: 2,
  },
  result: {
    gap: 6,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 8,
  },
  resultStatus: {
    flexShrink: 1,
    textAlign: 'right',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  resultRowFirst: {
    borderTopColor: Palette.border,
  },
  resultLabel: {
    ...Type.caption,
    color: Palette.muted,
    flexShrink: 0,
  },
  resultValue: {
    ...Type.mono,
    fontSize: 12,
    color: Palette.text,
    flexShrink: 1,
    maxWidth: '68%',
    textAlign: 'right',
  },
  analysis: {
    gap: 10,
    paddingTop: 12,
  },
  analysisStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: 'rgba(22,26,20,0.03)',
    borderRadius: 14,
    padding: 13,
  },
  analysisStatusError: {
    borderColor: 'rgba(162,58,42,0.38)',
    backgroundColor: Palette.accentSoft,
  },
  analysisStatusSuccess: {
    borderColor: 'rgba(46,70,51,0.32)',
    backgroundColor: Palette.mossSoft,
  },
  analysisStatusText: {
    flex: 1,
    gap: 4,
  },
  analysisTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    color: Palette.text,
  },
  analysisTitleError: {
    color: Palette.accentDeep,
  },
  analysisBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.body,
  },
  analysisMeta: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 12,
    color: Palette.dim,
  },
  analysisHint: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
    paddingTop: 2,
  },
  analysisNote: {
    ...Type.caption,
    fontSize: 8,
    lineHeight: 12,
    color: Palette.dim,
  },
  analysisButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.ink,
    backgroundColor: Palette.ink,
    paddingHorizontal: 18,
    paddingVertical: 11,
    boxShadow: '0 14px 28px -18px rgba(22,26,20,0.55)',
  },
  analysisButtonFocused: {
    borderColor: Palette.accent,
    boxShadow:
      '0 0 0 3px rgba(196,86,45,0.22), 0 14px 28px -18px rgba(22,26,20,0.55)',
  },
  analysisButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
  analysisButtonBusy: {
    opacity: 0.62,
  },
  analysisButtonLabel: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: Palette.cream,
  },
  analysisButtonGlyph: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 13,
    color: Palette.creamMuted,
  },
  reads: {
    gap: 14,
  },
  readsTitle: {
    ...Type.title,
    fontSize: 24,
  },
  readRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  readRowFirst: {
    borderTopColor: Palette.border,
  },
  readId: {
    ...Type.caption,
    color: Palette.accent,
    width: 24,
    paddingTop: 2,
  },
  readTitle: {
    ...Type.label,
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
  },
  readNote: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.muted,
  },
  trust: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 20,
    gap: 9,
  },
  trustTitle: {
    ...Type.subtitle,
    fontSize: 19,
    maxWidth: 480,
  },
  trustBody: {
    ...Type.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.muted,
    maxWidth: 520,
  },
  trustActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
  },
});
