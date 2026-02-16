"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Sun01Icon, 
  Moon01Icon, 
  ComputerIcon,
  Settings02Icon,
  UserCircle02Icon,
  Notification03Icon,
  Shield01Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="  py-10 px-4 space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="appearance" className="w-full max-w-4xl">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="appearance" className="rounded-lg gap-2">
            <HugeiconsIcon icon={Sun01Icon} size={16} />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg gap-2">
            <HugeiconsIcon icon={UserCircle02Icon} size={16} />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-2">
            <HugeiconsIcon icon={Notification03Icon} size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={16} />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Card className="rounded-2xl border-none ring-1 ring-border shadow-none bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Customize how CheapShip looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-border/80 bg-transparent"
                    )}
                  >
                    <div className="size-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <HugeiconsIcon icon={Sun01Icon} size={20} />
                    </div>
                    <span className="text-xs font-bold">Light</span>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-border/80 bg-transparent"
                    )}
                  >
                    <div className="size-10 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
                      <HugeiconsIcon icon={Moon01Icon} size={20} />
                    </div>
                    <span className="text-xs font-bold">Dark</span>
                  </button>

                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-border/80 bg-transparent"
                    )}
                  >
                    <div className="size-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                      <HugeiconsIcon icon={ComputerIcon} size={20} />
                    </div>
                    <span className="text-xs font-bold">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="rounded-2xl border-none ring-1 ring-border shadow-none bg-card/50 h-40 flex items-center justify-center">
             <p className="text-muted-foreground text-sm italic">Profile settings coming soon...</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="rounded-2xl border-none ring-1 ring-border shadow-none bg-card/50 h-40 flex items-center justify-center">
             <p className="text-muted-foreground text-sm italic">Notification settings coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="rounded-2xl border-none ring-1 ring-border shadow-none bg-card/50 h-40 flex items-center justify-center">
             <p className="text-muted-foreground text-sm italic">Security settings coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
