'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MARKET_ASSETS, MARKET_ENDPOINT, MARKET_SUBSCRIPTION, isRecord,
  mergeMarketQuotes, parseTickerMessage, type MarketId, type MarketQuotes, type PriceStatus,
} from '@/lib/market-data';

const CONNECT_TIMEOUT_MS = 15_000;
const SILENCE_TIMEOUT_MS = 15_000;

/** One public socket for the watchlist. Reconnects never replace real quotes with examples. */
export function useMarketPrices() {
  const [quotes, setQuotes] = useState<MarketQuotes>({});
  const [status, setStatus] = useState<PriceStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const quotesRef = useRef<MarketQuotes>({});
  const reconnect = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let connectionTimer: ReturnType<typeof setTimeout> | undefined;
    let snapshotTimer: ReturnType<typeof setTimeout> | undefined;
    let lastMessageAt = 0;
    let failures = 0;
    let seen = new Set<MarketId>();
    let subscriptionFailed = false;

    const clearConnectionTimers = () => {
      clearTimeout(connectionTimer);
      clearTimeout(snapshotTimer);
    };
    const releaseSocket = () => {
      clearConnectionTimers();
      if (!socket) return;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
      socket = null;
    };
    const updateFeedStatus = () => {
      if (disposed) return;
      if (seen.size === MARKET_ASSETS.length && !subscriptionFailed) {
        setStatus('live');
        setErrorMessage(null);
      } else if (seen.size > 0) {
        setStatus('partial');
        setErrorMessage('Some quotes are still unavailable. Showing the latest received prices.');
      }
    };
    const scheduleReconnect = () => {
      if (disposed || retryTimer) return;
      releaseSocket();
      if (!navigator.onLine) {
        setStatus('offline');
        setErrorMessage('You’re offline. Prices will reconnect when your connection returns.');
        return;
      }
      setStatus('reconnecting');
      setErrorMessage('The price feed is reconnecting. Any visible prices are the last received quotes.');
      const backoff = Math.min(30_000, 5_000 * 2 ** Math.min(failures, 3));
      failures += 1;
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        connect();
      }, backoff + Math.random() * 1_000);
    };
    const connect = () => {
      if (disposed) return;
      clearTimeout(retryTimer);
      retryTimer = undefined;
      releaseSocket();
      if (!navigator.onLine) {
        setStatus('offline');
        setErrorMessage('You’re offline. Prices will reconnect when your connection returns.');
        return;
      }
      setStatus(Object.keys(quotesRef.current).length ? 'reconnecting' : 'connecting');
      setErrorMessage(null);
      seen = new Set();
      subscriptionFailed = false;
      lastMessageAt = Date.now();
      let activeSocket: WebSocket;
      try {
        activeSocket = new WebSocket(MARKET_ENDPOINT);
        socket = activeSocket;
      } catch {
        scheduleReconnect();
        return;
      }
      connectionTimer = setTimeout(scheduleReconnect, CONNECT_TIMEOUT_MS);
      activeSocket.onopen = () => {
        if (disposed || socket !== activeSocket) return;
        clearTimeout(connectionTimer);
        lastMessageAt = Date.now();
        activeSocket.send(JSON.stringify(MARKET_SUBSCRIPTION));
        // Snapshots are sent even when a thinly traded asset has no new trades.
        snapshotTimer = setTimeout(() => {
          if (!seen.size) scheduleReconnect();
          else updateFeedStatus();
        }, CONNECT_TIMEOUT_MS);
      };
      activeSocket.onmessage = event => {
        if (disposed || socket !== activeSocket) return;
        lastMessageAt = Date.now();
        let payload: unknown;
        try { payload = JSON.parse(event.data as string); } catch { return; }
        if (isRecord(payload) && payload.method === 'subscribe' && payload.success === false) {
          subscriptionFailed = true;
          updateFeedStatus();
          return;
        }
        const incoming = parseTickerMessage(payload, lastMessageAt);
        const ids = Object.keys(incoming) as MarketId[];
        if (!ids.length) return; // Heartbeats do not change trade timestamps.
        ids.forEach(id => seen.add(id));
        quotesRef.current = mergeMarketQuotes(quotesRef.current, incoming);
        setQuotes(quotesRef.current);
        setNow(lastMessageAt);
        failures = 0;
        if (seen.size === MARKET_ASSETS.length) clearTimeout(snapshotTimer);
        updateFeedStatus();
      };
      activeSocket.onerror = scheduleReconnect;
      activeSocket.onclose = scheduleReconnect;
    };
    const handleOffline = () => {
      clearTimeout(retryTimer);
      retryTimer = undefined;
      releaseSocket();
      setStatus('offline');
      setErrorMessage('You’re offline. Any visible prices are the last received quotes.');
    };
    const handleOnline = () => { failures = 0; connect(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine
        && (!socket || Date.now() - lastMessageAt > SILENCE_TIMEOUT_MS)) connect();
    };

    setNow(Date.now());
    connect();
    const watchdog = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (socket?.readyState === WebSocket.OPEN && currentTime - lastMessageAt > SILENCE_TIMEOUT_MS) {
        scheduleReconnect();
      }
    }, 5_000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearInterval(watchdog);
      releaseSocket();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [attempt]);

  return { quotes, status, errorMessage, reconnect, now };
}
