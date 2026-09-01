"use client";

import { JOURNEY_MOBILE_MEDIA } from "./constants";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function useJourneyMobile(serverValue = false) {
  return useMediaQuery(JOURNEY_MOBILE_MEDIA, serverValue);
}
