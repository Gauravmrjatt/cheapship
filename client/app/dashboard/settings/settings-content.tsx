"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHttp } from "@/lib/hooks/use-http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Sun01Icon, 
  Moon01Icon, 
  ComputerIcon,
  UserCircle02Icon,
  Notification03Icon,
  Shield01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  UserSquareIcon,
  Building06Icon,
  Settings02Icon,
  LockPasswordIcon,
  Mail01Icon,
  SmartPhone01Icon,
  ShippingTruck01Icon,
  Wallet01Icon,
  Globe02Icon,
  CreditCardIcon,
  
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { sileo } from "sileo";
import { useLoginHistory, LoginSession } from "@/lib/hooks/use-sessions";
import { format } from "date-fns";

interface KycData {
  pan_number: string | null;
  pan_verified: boolean;
  aadhaar_number: string | null;
  aadhaar_verified: boolean;
  gst_number: string | null;
  gst_verified: boolean;
  kyc_status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
}

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  kyc_status: string;
  upi_id?: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const http = useHttp();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") || "profile";

  const { data: userData } = useQuery<UserData>(
    http.get(["me"], "/auth/me")
  );

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!mounted) return null;

  const isKycVerified = userData?.kyc_status === "VERIFIED";

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="flex flex-col md:flex-row gap-6 items-start"
          >
            {/* Sidebar Navigation */}
            <div className="w-full  shrink-0 overflow-x-auto no-scrollbar pb-4 md:pb-0">
              <TabsList className="">
                <NavTrigger value="profile" icon={UserCircle02Icon} label="Account Profile" />
                <NavTrigger value="kyc" icon={Shield01Icon} label="KYC Verification" />
                <NavTrigger value="appearance" icon={Sun01Icon} label="Appearance" />
                <NavTrigger value="notifications" icon={Notification03Icon} label="Notifications" />
                <NavTrigger value="security" icon={LockPasswordIcon} label="Security & Sessions" />
              </TabsList>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full min-w-0 space-y-6">
              {/* CTA Alert Panel */}
              {!isKycVerified && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                        <HugeiconsIcon icon={Shield01Icon} size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Complete your verification</h4>
                        <p className="text-sm text-muted-foreground">Unlock higher shipping limits and COD features by completing your KYC.</p>
                      </div>
                    </div>
                    <Button 
                      className="hidden sm:flex bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleTabChange("kyc")}
                    >
                      Verify Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Content Tabs */}
              <div className="w-full">
                <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                  <ProfileTab http={http} />
                </TabsContent>

                <TabsContent value="kyc" className="mt-0 focus-visible:outline-none">
                  <KycTab http={http} />
                </TabsContent>

                <TabsContent value="appearance" className="mt-0 focus-visible:outline-none">
                  <AppearanceTab theme={theme} setTheme={setTheme} />
                </TabsContent>

                <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
                  <PlaceholderTab title="Notifications" description="Manage how you receive updates and alerts." />
                </TabsContent>

                <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                  <SecurityTab />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NavTrigger({ value, icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="gap-3 py-2.5 px-4 md:w-full justify-start text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
    >
      <HugeiconsIcon icon={icon} size={18} />
      <span className="whitespace-nowrap">{label}</span>
    </TabsTrigger>
  );
}

function ProfileTab({ http }: { http: any }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    upi_id: ""
  });

  const { data: userData, isLoading } = useQuery<UserData>(
    http.get(["me"], "/auth/me")
  );

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        mobile: userData.mobile || "",
        upi_id: userData.upi_id || ""
      });
    }
  }, [userData]);

  const { mutate: updateProfile, isPending } = useMutation(
    http.put("/auth/profile", {
      onSuccess: () => {
        sileo.success({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData as any);
  };

  if (isLoading) return <SettingsSkeleton />;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
        <CardDescription>Update your personal details and account email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative group">
                <HugeiconsIcon icon={UserCircle02Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10" 
                  placeholder="Deepak" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
              <div className="relative group">
                <HugeiconsIcon icon={SmartPhone01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <Input 
                  id="mobile" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="pl-10" 
                  placeholder="9876543210" 
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative group">
                <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <Input 
                  id="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10" 
                  placeholder="hello@example.com" 
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="upi_id" className="text-sm font-medium">UPI ID (for COD payouts)</Label>
              <div className="relative group">
                <HugeiconsIcon icon={CreditCardIcon} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <Input 
                  id="upi_id" 
                  value={formData.upi_id}
                  onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                  className="pl-10" 
                  placeholder="yourname@upi" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function KycTab({ http }: { http: any }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    pan_number: "",
    aadhaar_number: "",
    gst_number: ""
  });
  const [panError, setPanError] = useState("");

  const { data: userData } = useQuery<UserData>(
    http.get(["me"], "/auth/me")
  );

  const { data: kycData, isLoading } = useQuery<KycData>(
    http.get(["kyc-status"], "/auth/kyc")
  );

  useEffect(() => {
    if (kycData) {
      setFormData({
        pan_number: kycData.pan_number || "",
        aadhaar_number: kycData.aadhaar_number || "",
        gst_number: kycData.gst_number || ""
      });
    }
  }, [kycData]);

  const validatePanNumber = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handlePanChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setFormData({ ...formData, pan_number: upperValue });
    
    if (upperValue.length === 10) {
      if (validatePanNumber(upperValue)) {
        setPanError("");
      } else {
        setPanError("Invalid PAN format. Use: AAAAA1234A");
      }
    } else if (upperValue.length > 0) {
      setPanError("");
    }
  };

  const { mutate: updateKyc, isPending: isUpdating } = useMutation(
    http.put("/auth/kyc", {
      onSuccess: () => {
        sileo.success({ title: "KYC details updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.pan_number && !validatePanNumber(formData.pan_number)) {
      setPanError("Invalid PAN format. Use: AAAAA1234A");
      return;
    }
    
    const dataToSubmit: Record<string, string> = {};
    if (formData.pan_number) dataToSubmit.pan_number = formData.pan_number.toUpperCase();
    if (formData.aadhaar_number) dataToSubmit.aadhaar_number = formData.aadhaar_number;
    if (formData.gst_number) dataToSubmit.gst_number = formData.gst_number.toUpperCase();
    updateKyc(dataToSubmit as any);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Submitted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getFieldStatus = (value: string | null, verified: boolean) => {
    if (!value) return null;
    if (verified) {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
          Verified
        </div>
      );
    }
    return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Pending</span>;
  };

  if (isLoading) return <SettingsSkeleton />;

  const isKycVerified = userData?.kyc_status === "VERIFIED";

  const permissions = [
    { name: "Domestic Shipping", description: "Ship packages within India", status: "Active", icon: ShippingTruck01Icon },
    { name: "COD Shipments", description: "Collect cash on delivery", status: isKycVerified ? "Active" : "Locked", icon: Wallet01Icon },
    { name: "International Shipping", description: "Ship to 220+ countries", status: isKycVerified ? "Active" : "Locked", icon: Globe02Icon },
    { name: "Bulk Order Upload", description: "CSV/Excel order processing", status: isKycVerified ? "Active" : "Locked", icon: Building06Icon },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-secondary rounded-lg text-primary">
              <HugeiconsIcon icon={Shield01Icon} size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Account Verification</h3>
              <p className="text-sm text-muted-foreground">Complete KYC to unlock full account features</p>
            </div>
          </div>
          {kycData && getStatusBadge(kycData.kyc_status)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={UserSquareIcon} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">Identity Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="pan_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PAN Number</Label>
                      {kycData && getFieldStatus(kycData.pan_number, kycData.pan_verified)}
                    </div>
                    <Input
                      id="pan_number"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={formData.pan_number}
                      onChange={(e) => handlePanChange(e.target.value)}
                      className={cn(
                        "uppercase font-mono tracking-widest",
                        panError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {panError && <p className="text-xs text-destructive">{panError}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="aadhaar_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aadhaar (Optional)</Label>
                      {kycData && getFieldStatus(kycData.aadhaar_number, kycData.aadhaar_verified)}
                    </div>
                    <Input
                      id="aadhaar_number"
                      placeholder="123456789012"
                      maxLength={12}
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, "") })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="gst_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GSTIN Number</Label>
                      {kycData && getFieldStatus(kycData.gst_number, kycData.gst_verified)}
                    </div>
                    <Input
                      id="gst_number"
                      placeholder="12ABCDE3456F7Z8"
                      maxLength={15}
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                      className="uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" size={16} /> : <HugeiconsIcon icon={Shield01Icon} size={16} />}
                    Update KYC
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Settings02Icon} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">Permissions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {permissions.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 sm:p-5 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-md", p.status === "Active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground/50")}>
                        <HugeiconsIcon icon={p.icon} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{p.description}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === "Active" ? "default" : "outline"} className={cn("text-[10px] font-bold", p.status === "Active" ? "bg-green-600" : "text-muted-foreground opacity-50 uppercase")}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function AppearanceTab({ theme, setTheme }: any) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Appearance</CardTitle>
        <CardDescription>Personalize your workspace with a theme that suits you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ThemeCard 
            active={theme === "light"} 
            onClick={() => setTheme("light")} 
            icon={Sun01Icon} 
            label="Light" 
            description="Clean and bright"
            colorClass="bg-orange-50 text-orange-600"
          />
          <ThemeCard 
            active={theme === "dark"} 
            onClick={() => setTheme("dark")} 
            icon={Moon01Icon} 
            label="Dark" 
            description="Easy on the eyes"
            colorClass="bg-slate-900 text-slate-100"
          />
          <ThemeCard 
            active={theme === "system"} 
            onClick={() => setTheme("system")} 
            icon={ComputerIcon} 
            label="System" 
            description="Sync with OS"
            colorClass="bg-muted text-muted-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ThemeCard({ active, onClick, icon, label, description, colorClass }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-4 p-6 border-2 transition-all duration-200 relative group",
        active 
          ? "border-primary bg-background ring-2 ring-primary/5" 
          : "border-transparent bg-background hover:border-muted-foreground/20"
      )}
    >
      {active && (
        <div className="absolute top-3 right-3 text-primary">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
        </div>
      )}
      <div className={cn("size-12 rounded-lg flex items-center justify-center transition-transform duration-300", colorClass)}>
        <HugeiconsIcon icon={icon} size={24} />
      </div>
      <div className="text-center">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">{description}</span>
      </div>
    </button>
  );
}

function SecurityTab() {
  const { data: sessions, isLoading } = useLoginHistory();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Security & Sessions</CardTitle>
          <CardDescription>Monitor your account activity and manage active sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</h4>
              <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold">Last 20 attempts</Badge>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session: LoginSession) => (
                  <div key={session.id} className="group p-4 rounded-lg bg-background border hover:border-primary/20 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        session.device_info === 'Mobile Device' ? "bg-blue-50 text-blue-600" : "bg-primary/5 text-primary"
                      )}>
                        <HugeiconsIcon icon={session.device_info === 'Mobile Device' ? SmartPhone01Icon : ComputerIcon} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{session.device_info || 'Unknown Device'}</p>
                          <Badge variant={session.login_status === 'SUCCESS' ? 'default' : 'destructive'} className={cn("text-[8px] font-bold uppercase px-1.5 h-3.5 rounded-sm", session.login_status === 'SUCCESS' ? "bg-green-500" : "bg-red-500")}>
                            {session.login_status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            {session.ip_address}
                          </span>
                          <span className="size-1 rounded-full bg-muted-foreground/30" />
                          <span>
                            {format(new Date(session.login_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {session.login_status === 'SUCCESS' && (
                      <div className="hidden sm:flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                        <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase">Active</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-background/50 border border-dashed rounded-xl">
                <p className="text-muted-foreground text-sm font-medium italic">No recent login history found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="p-2.5 bg-background rounded-lg text-primary">
              <HugeiconsIcon icon={Shield01Icon} size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Security Overview</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We monitor login attempts to keep your account safe. Always ensure you recognize the devices and IP addresses shown. Session limit is currently 5 days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <Card className="min-h-[400px] flex items-center justify-center">
      <CardContent className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm">
        <div className="size-20 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground/30">
          <HugeiconsIcon icon={Settings02Icon} size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase">
          Coming Soon
        </Badge>
      </CardContent>
    </Card>
  );
}

function SettingsSkeleton() {
  return (
    <Card className="p-6 sm:p-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-7 w-1/4 bg-muted rounded-lg" />
        <div className="h-4 w-1/2 bg-muted rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
      <div className="h-48 bg-muted rounded-lg" />
    </Card>
  );
}
