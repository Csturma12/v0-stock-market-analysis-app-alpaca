"use client"

import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import { jsonFetcher } from "@/lib/widget-data"

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: jsonFetcher,
        dedupingInterval: 20_000,
        errorRetryCount: 1,
        errorRetryInterval: 4_000,
        focusThrottleInterval: 45_000,
        keepPreviousData: true,
        loadingTimeout: 8_000,
        revalidateOnFocus: false,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
