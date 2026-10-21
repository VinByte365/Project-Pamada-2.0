import { ScanScreen, scanModes } from '@/components/ScanScreen';

const mode = scanModes[1];

export default function ScanMaturityScreen() {
  return (
    <ScanScreen
      mode={mode}
      cameraSymbol={{ ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' }}
    />
  );
}
