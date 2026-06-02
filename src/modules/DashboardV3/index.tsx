import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { ObjectivesModal } from './ObjectivesModal';
import { cn } from '../../lib/utils';
import { containerVariants } from './lib/animations';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardHeader } from './components/DashboardHeader';
import { RevenueCard } from './components/RevenueCard';
import { ContactsCard } from './components/ContactsCard';
import { ProjectsCard } from './components/ProjectsCard';
import { RevenueChartSection } from './components/RevenueChartSection';
import { ObjectivesSection } from './components/ObjectivesSection';
import { PipelineBoardSection } from './components/PipelineBoardSection';

export function DashboardV3() {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const isMobile = useIsMobile();
  const data = useDashboardData();

  return (
    <div className="min-h-screen text-[#ede9fe] relative overflow-hidden bg-[#020205]">
      {isMobile && (
        <MobileHeader
          title="Tableau de bord"
          actions={
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={cn("p-2 rounded-full transition-colors", isPrivacyMode ? "text-rose-400" : "text-[#9ca3af]")}
            >
              {isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />
      )}

      {/* Background V3 — dégradé radial violet subtil + grid pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139,92,246,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        {!isMobile && (
          <>
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#A78BFA]/5 rounded-full blur-3xl" />
          </>
        )}
      </div>

      <div className={cn("relative z-10 max-w-[1600px] mx-auto", isMobile ? "p-4" : "p-4 lg:p-5")}>
        {!isMobile && (
          <DashboardHeader
            mounted={data.mounted}
            formattedDate={data.formattedDate}
            isPrivacyMode={isPrivacyMode}
            onTogglePrivacy={() => setIsPrivacyMode(!isPrivacyMode)}
          />
        )}

        <motion.div
          className={cn("grid gap-3 md:gap-4", isMobile ? "grid-cols-2" : "grid-cols-12")}
          variants={containerVariants}
          initial="hidden"
          animate={data.mounted ? "visible" : "hidden"}
        >
          <RevenueCard
            currentYear={data.currentYear}
            currentYearRevenue={data.currentYearRevenue}
            accountingLoading={data.accountingLoading}
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            onClick={data.handleNavigateToAccounting}
          />
          <ContactsCard
            contactsCount={data.contactsCount}
            leadsCount={data.leadsCount}
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            onClick={data.handleNavigateToCRM}
          />
          <ProjectsCard
            projectsCount={data.projectsCount}
            activeProjectsCount={data.activeProjectsCount}
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            onClick={data.handleNavigateToProjects}
          />
          <PipelineBoardSection
            crmOfferLeads={data.crmOfferLeads}
            projects={data.projects}
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            onNavigateToCRM={data.handleNavigateToCRM}
            onNavigateToLead={data.handleNavigateToLead}
            onNavigateToProjects={data.handleNavigateToProjects}
            onNavigateToProject={data.handleNavigateToProject}
          />
          <RevenueChartSection
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            accountingLoading={data.accountingLoading}
            accountingEntries={data.accountingEntries}
            onNavigateToAccounting={data.handleNavigateToAccounting}
          />
          <ObjectivesSection
            objectives={data.objectives}
            isPrivacyMode={isPrivacyMode}
            isMobile={isMobile}
            onOpenModal={() => setShowObjectivesModal(true)}
          />
        </motion.div>
      </div>

      <ObjectivesModal open={showObjectivesModal} onClose={() => setShowObjectivesModal(false)} />
    </div>
  );
}
