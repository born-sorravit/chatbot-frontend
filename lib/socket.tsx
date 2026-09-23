'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface SocketContextValue {
  socket: Socket | null;
  state: ConnectionState;
  /** Increments on every (re)connect — a cue to refetch, see below. */
  reconnectCount: number;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  state: 'connecting',
  reconnectCount: 0,
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  namespace: '/ws/admin' | '/ws/customer';
  /** Null defers the connection until a credential exists. */
  token: string | null;
  children: ReactNode;
}

/**
 * Socket.IO connection for one namespace.
 *
 * Only the namespace the current route needs is ever mounted — an admin page
 * has no reason to hold a customer socket open, and vice versa.
 *
 * `reconnectCount` exists because Socket.IO is at-most-once: a client that is
 * offline during an emit misses it permanently. Consumers refetch when it
 * changes, which is what makes dropped events survivable (docs/API.md §7).
 */
export function SocketProvider({ namespace, token, children }: SocketProviderProps) {
  // The socket lives in state, not a ref: consumers must re-render when it
  // becomes available, and reading a ref during render is not allowed.
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketState, setSocketState] = useState<ConnectionState>('connecting');
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    const instance = io(`${WS_URL}${namespace}`, {
      auth: { token },
      transports: ['websocket'],
      // Sends the httpOnly customer session cookie during the handshake; the
      // widget's own JS cannot read it to pass in `auth`.
      withCredentials: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
    });

    instance.on('connect', () => {
      setSocketState('connected');
      setReconnectCount((n) => n + 1);
    });
    instance.on('disconnect', () => setSocketState('disconnected'));
    instance.on('connect_error', () => setSocketState('disconnected'));

    // Publishing the instance costs one extra render, which is inherent to
    // creating an imperative external resource and handing it to consumers:
    // it cannot be created during render (StrictMode would double-connect)
    // and consumers must re-render once it exists. The cascade is bounded at
    // one and cannot loop — `instance` changes only when namespace or token
    // does, both of which are already effect dependencies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.close();
      setSocket(null);
    };
  }, [namespace, token]);

  // Derived, not assigned in an effect: with no token there is nothing to
  // connect and the state is knowable during render.
  const state: ConnectionState = token ? socketState : 'disconnected';

  const value = useMemo<SocketContextValue>(
    () => ({ socket, state, reconnectCount }),
    [socket, state, reconnectCount],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * Subscribes to a socket event for the lifetime of the component.
 *
 * The handler is kept in a ref, updated in an effect rather than during
 * render, so a fresh closure each render does not detach and reattach the
 * listener — which would drop events emitted in the gap.
 */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void): void {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return;

    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
