'use client'
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { useDashboard } from "@/lib/hooks/use-dashboard"
import { useAuthStore } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { Shield01Icon, Warning01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

export default function Dashboard() {
  const { data: dashboardData, isLoading, isError, error } = useDashboard();
  const { user } = useAuthStore();
  const router = useRouter();

  const kycStatus = user?.kyc_status;
  const needsKycAction = kycStatus === "PENDING" || kycStatus === "REJECTED";

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        {needsKycAction && (
          <div className="px-4 lg:px-6 pt-4">
            <Card className={kycStatus === "REJECTED" ? "border-red-200 bg-red-50/50 shadow-none rounded-2xl" : "border-amber-200 bg-amber-50/50 shadow-none rounded-2xl"}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${kycStatus === "REJECTED" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                    <HugeiconsIcon icon={kycStatus === "REJECTED" ? Warning01Icon : Shield01Icon} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">
                      {kycStatus === "REJECTED" ? "KYC Verification Rejected" : "Complete your KYC Verification"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {kycStatus === "REJECTED" 
                        ? "Your KYC documents were rejected. Please resubmit to unlock full account features." 
                        : "Verify your identity to unlock higher shipping limits and COD features."}
                    </p>
                  </div>
                </div>
                <Button 
                  className={`shrink-0 ${kycStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"} text-white border-none rounded-xl flex items-center gap-2`}
                  onClick={() => router.push("/dashboard/settings?tab=kyc")}
                >
                  {kycStatus === "REJECTED" ? "Resubmit KYC" : "Verify Now"}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={dashboardData} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive isLoading={isLoading} data={dashboardData?.graphData} />
          </div>
        </div>
      </div>
    </div>
  )
}
