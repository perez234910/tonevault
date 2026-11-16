"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";
import { formatPrice } from "@/src/lib/format";
import type { OwnerMetrics } from "@/src/lib/owner/metrics";
import type { EscrowStatus } from "@/src/types";
import {
  OwnerOrders,
  type OwnerOrderRow,
  type OwnerOrdersState,
} from "@/src/components/owner-orders";

type ApiOrder = {
  id: string;
  quantity: number;
  total_amount: number;
  escrow_status: EscrowStatus;
  product: {
    id: string;
    brand: string;
    model: string;
  } | null;
};

type OrdersResponse = {
  ok: boolean;
  error?: string;
  orders?: ApiOrder[];
};

type MetricsResponse = {
  ok: boolean;
  error?: string;
  metrics?: OwnerMetrics;
};

export function OwnerDashboardClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<OwnerOrderRow[]>([]);
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [ordersResponse, metricsResponse] = await Promise.all([
        fetch("/api/orders", {
          headers,
          cache: "no-store",
        }),
        fetch("/api/metrics", {
          headers,
          cache: "no-store",
        }),
      ]);

      const [ordersData, metricsData] = await Promise.all([
        ordersResponse.json() as Promise<OrdersResponse>,
        metricsResponse.json() as Promise<MetricsResponse>,
      ]);

      if (!ordersResponse.ok || !ordersData.ok) {
        throw new Error(ordersData.error ?? "Unable to retrieve orders.");
      }

      if (!metricsResponse.ok || !metricsData.ok) {
        throw new Error(metricsData.error ?? "Unable to retrieve metrics.");
      }

      const mappedOrders: OwnerOrderRow[] = (ordersData.orders ?? []).map(
        (order) => ({
          id: order.id,
          quantity: order.quantity,
          total_amount: order.total_amount,
          escrow_status: order.escrow_status,
          instrument: order.product
            ? `${order.product.brand} ${order.product.model}`
            : "Unavailable",
        }),
      );

      setOrders(mappedOrders);
      setMetrics(metricsData.metrics ?? null);
    } catch (err) {
      setOrders([]);
      setMetrics(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the Owner Dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (
        nextSession &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        void loadDashboard(nextSession.access_token);
      }

      if (event === "SIGNED_OUT") {
        setOrders([]);
        setMetrics(null);
        setError("");
      }
    });

    async function initializeSession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!active) return;

        if (sessionError) {
          setError(sessionError.message);
        }

        if (data.session) {
          setSession(data.session);
          void loadDashboard(data.session.access_token);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to check your administrator session.",
          );
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    }

    void initializeSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    setError("");

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in.",
      );
    } finally {
      setSigningIn(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
    }
  }

  if (initializing) {
    return (
      <p role="status" className="owner-access-note">
        Checking administrator session...
      </p>
    );
  }

  if (!session) {
    return (
      <section className="max-w-md" aria-labelledby="owner-login-heading">
        <h2 id="owner-login-heading" className="text-xl">
          Owner Login
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sign in using your administrator account to access private
          marketplace orders and analytics.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label htmlFor="owner-email" className="mb-2 block text-sm">
              Email address
            </label>
            <input
              id="owner-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="owner-password" className="mb-2 block text-sm">
              Password
            </label>
            <input
              id="owner-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line bg-background px-4 py-3 text-foreground outline-none focus:border-gold"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="rounded-full border border-line px-5 py-3 text-sm hover:border-gold disabled:opacity-50"
          >
            {signingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    );
  }

  const topSellingItems = metrics?.topSellingItems ?? [];
  const lowStockItems = metrics?.lowStockItems ?? [];

  const cards = [
    {
      label: "Total orders",
      value: metrics ? String(metrics.totalOrders) : "—",
      description: "Saved marketplace transactions",
    },
    {
      label: "Total order value",
      value: metrics ? formatPrice(metrics.totalOrderValue) : "—",
      description: "Gross value of saved buyer orders",
    },
    {
      label: "Platform revenue",
      value: metrics ? formatPrice(metrics.platformRevenue) : "—",
      description: "Saved commission and verification revenue",
    },
    {
      label: "Average order value",
      value: metrics ? formatPrice(metrics.averageOrderValue) : "—",
      description: "Average saved buyer order total",
    },
    {
      label: "Top-selling guitars",
      value: topSellingItems.length
        ? topSellingItems.map((item) => item.name).join(", ")
        : "No sales yet",
      description: topSellingItems.length
        ? `${topSellingItems[0].quantitySold} units sold each`
        : "No recorded product sales",
    },
    {
      label: "Low-stock listings",
      value: metrics ? String(lowStockItems.length) : "—",
      description: `Stock threshold: ${metrics?.lowStockThreshold ?? "—"}`,
    },
  ];

  const orderState: OwnerOrdersState = error
    ? { status: "error" }
    : loading && orders.length === 0
      ? { status: "loading" }
      : { status: "ready", orders };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Administrator dashboard
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadDashboard(session.access_token)}
            disabled={loading}
            className="ui-link disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="ui-link"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="owner-access-note">
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Verify your administrator role and database access.
          </p>
        </div>
      )}

      <section className="mt-8" aria-labelledby="owner-metrics-heading">
        <h2 id="owner-metrics-heading" className="mb-6 text-xl">
          Business overview
        </h2>

        <dl className="owner-metrics" aria-busy={loading}>
          {cards.map((card) => (
            <div key={card.label}>
              <dt>{card.label}</dt>
              <dd className="break-words">
                {loading ? "Loading..." : card.value}
              </dd>
              <p className="metric-unavailable">{card.description}</p>
            </div>
          ))}
        </dl>
      </section>

      <section id="orders" className="mt-12" aria-labelledby="owner-orders-heading">
        <h2 id="owner-orders-heading" className="mb-5 text-xl">
          Recent orders
        </h2>
        <OwnerOrders state={orderState} />
      </section>

      <section className="mt-12" aria-labelledby="low-stock-heading">
        <h2 id="low-stock-heading" className="text-xl">
          Low-stock listings
        </h2>
        <p className="mt-2 text-sm text-muted">
          Available guitars with stock at or below{" "}
          {metrics?.lowStockThreshold ?? "—"} units.
        </p>

        <div className="mt-5">
          {loading ? (
            <p role="status" className="text-sm text-muted">
              Loading inventory...
            </p>
          ) : error ? (
            <p className="text-sm text-muted">
              Inventory information is unavailable.
            </p>
          ) : lowStockItems.length > 0 ? (
            <ul className="space-y-3">
              {lowStockItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3"
                >
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-muted">
                    {item.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              No low-stock listings found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
