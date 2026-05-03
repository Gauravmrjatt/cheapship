"use client";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { OfflineBanner } from "./offline-banner";
import { ConnectionRestoredBanner } from "./connection-restored-banner";
import { InstallPwaBanner } from "./install-pwa-banner";
import { useEffect, useState } from "react";

export function PwaBanners() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [prevOnline, setPrevOnline] = useState(true);

  useEffect(() => {
    if (!isOnline && prevOnline) {
      setShowRestored(false);
    }
    if (isOnline && !prevOnline && wasOffline) {
      setShowRestored(true);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline, wasOffline]);

  return (
    <>
      <ConnectionRestoredBanner show={showRestored && isOnline} />
      <OfflineBanner show={!isOnline} />
      <InstallPwaBanner />
    </>
  );
}