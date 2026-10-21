import { ScanScreen, scanModes } from '@/components/ScanScreen';

const mode = scanModes[0];

export default function ScanDiagnosisScreen() {
  return (
    <ScanScreen
      mode={mode}
      cameraSymbol={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' }}
    />
  );
}
