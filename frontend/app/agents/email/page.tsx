import SurfaceShell from "@/components/SurfaceShell";
import IntegrationSettingsForm from "@/components/IntegrationSettingsForm";
import { EMAIL_INTEGRATION } from "@/lib/integrations";

export default function EmailAgentSettingsPage() {
  return (
    <SurfaceShell title={EMAIL_INTEGRATION.title} subtitle={EMAIL_INTEGRATION.subtitle}>
      <IntegrationSettingsForm config={EMAIL_INTEGRATION} />
    </SurfaceShell>
  );
}
