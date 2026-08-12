import SurfaceShell from "@/components/SurfaceShell";
import IntegrationSettingsForm from "@/components/IntegrationSettingsForm";
import { CALENDAR_INTEGRATION } from "@/lib/integrations";

export default function CalendarAgentSettingsPage() {
  return (
    <SurfaceShell title={CALENDAR_INTEGRATION.title} subtitle={CALENDAR_INTEGRATION.subtitle}>
      <IntegrationSettingsForm config={CALENDAR_INTEGRATION} />
    </SurfaceShell>
  );
}
