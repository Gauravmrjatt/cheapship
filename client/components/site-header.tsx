import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RupeeSquareIcon, PlusSignIcon, SecurityLockIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { WalletTopUp } from "@/components/wallet-top-up";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SiteHeaderProps {
  pageTitle: string;
}

export function SiteHeader({ pageTitle }: SiteHeaderProps) {
  const [showTopUp, setShowTopUp] = useState(false);
  const { data: user } = useUser();

  return (
    <header className="flex h-(--header-height) sticky top-0 bg-background rounded-t-3xl z-50 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4 data-vertical:self-auto"
          />
          <h1 className="text-base font-medium">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center hover:bg-muted/50 gap-1.5 md:gap-2 px-2 md:px-2.5 bg-muted/30 border rounded-2xl">
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 cursor-pointer  pr-2 py-1.5 rounded-lg transition">
                <HugeiconsIcon
                  color="green"
                  icon={RupeeSquareIcon}
                  size={22}
                />

                <span className="text-sm font-semibold text-foreground">
                  ₹{Number(user?.wallet_balance || 0).toLocaleString("en-IN")}
                </span>

              </PopoverTrigger>

              <PopoverContent className=" p-4">

                <PopoverHeader className="px-0 pb-2">
                  <PopoverTitle className="text-sm font-semibold">
                    Wallet Balance
                  </PopoverTitle>
                </PopoverHeader>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3 mt-2">

                  {/* Wallet */}
                  <div className="flex flex-col items-center bg-muted justify-center gap-1 border-dashed border-2 border-green-600/10 rounded-lg py-3">

                    <HugeiconsIcon icon={RupeeSquareIcon} color="green" size={20} />

                    <span className="text-xs text-muted-foreground/50">
                      Wallet
                    </span>

                    <span className="text-sm font-bold ">
                      ₹{Number(user?.wallet_balance || 0).toLocaleString("en-IN")}
                    </span>

                  </div>

                  {/* Security Deposit */}
                  <div className="flex flex-col items-center  bg-muted justify-center gap-1 border-dashed border-2 border-orange-600/10 rounded-lg py-3">

                    <HugeiconsIcon icon={SecurityLockIcon} color="orange" size={20} />

                    <span className="text-xs text-muted-foreground/50">
                      Security
                    </span>

                    <span className="text-sm font-bold text-muted-foreground">
                      ₹{Number(user?.security_deposit || 0).toLocaleString("en-IN")}
                    </span>

                  </div>

                </div>

                {/* Button */}
                <Button
                  size="sm"
                  onClick={() => setShowTopUp(true)}
                  className="w-full mt-4 border-double border-2 border-primary"
                >
                  Top Up Wallet
                </Button>

              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-7 md:h-9 mx-0.5 md:mx-1" />
            <Button size="icon" onClick={() => setShowTopUp(true)} className="size-6 md:size-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
              <HugeiconsIcon icon={PlusSignIcon} size={14} className="md:size-4" />
            </Button>
          </div>
        </div>
      </div>

      <WalletTopUp open={showTopUp} onOpenChange={setShowTopUp} />
    </header>
  )
}
