import { ScanScreen, scanModes } from '@/components/ScanScreen';

const mode = scanModes[2];

export default function ScanGradingScreen() {
  return (
    <ScanScreen
      mode={mode}
      cameraSymbol={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' }}
    />
  );
}
