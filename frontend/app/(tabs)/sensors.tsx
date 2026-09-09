import { ScreenShell } from '@/components/ScreenShell';

export default function SensorsScreen() {
  return (
    <ScreenShell
      eyebrow="Sensors"
      title="Soil intelligence"
      description="Live readings from your Raspberry Pi node — moisture, nitrogen, phosphorus, potassium, EC, and pH. Flow from the Pi to your app is being finalized."
    />
  );
}